const express = require('express');
const { getFirestore } = require('../config/firebase');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get Firestore instance
const getDB = () => {
  try {
    return getFirestore();
  } catch (error) {
    console.error('Failed to get Firestore instance:', error);
    throw new Error('Database connection failed');
  }
};

// Get blogosphere posts collection
const getBlogospherePostsCollection = (db) => {
  return db.collection('blogosphere').doc('posts').collection('posts');
};

// Get all posts (with pagination)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { page = 1, limit = 10, author, tag } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Simplified query to avoid composite index requirement
    // We'll filter published posts in memory for now
    let query = postsCollection.orderBy('createdAt', 'desc');
    
    // Filter by author if specified
    if (author) {
      query = query.where('authorId', '==', author);
    }
    
    // Filter by tag if specified  
    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }
    
    query = query.limit(parseInt(limit) * 2); // Get more to account for filtering
    
    const snapshot = await query.get();
    
    const allPosts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter published posts in memory
      if (data.published) {
        allPosts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
        });
      }
    });
    
    // Apply pagination in memory
    const startIndex = offset;
    const endIndex = startIndex + parseInt(limit);
    const posts = allPosts.slice(startIndex, endIndex);
    
    const totalPosts = allPosts.length;
    
    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasNextPage: offset + posts.length < totalPosts,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check Firebase configuration.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by ID
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { postId } = req.params;
    
    const doc = await postsCollection.doc(postId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const data = doc.data();
    const post = { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
    };
    
    // Check if post is published or if user is the author
    if (!post.published && (!req.user || req.user.uid !== post.authorId)) {
      return res.status(403).json({ error: 'Post not accessible' });
    }
    
    // Increment view count
    await postsCollection.doc(postId).update({
      views: (post.views || 0) + 1
    });
    
    post.views = (post.views || 0) + 1;
    
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check Firebase configuration.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { title, content, excerpt, tags, category = 'technology', published = false, imageUrl } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Validate category
    const validCategories = ['daily-news', 'stock-market', 'ai', 'technology', 'business'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const now = new Date();
    const postData = {
      title: title.trim(),
      content,
      excerpt: excerpt ? excerpt.trim() : content.substring(0, 150) + '...',
      tags: Array.isArray(tags) ? tags : [],
      category,
      published: Boolean(published),
      authorId: req.user.uid,
      authorName: req.user.name || req.user.email?.split('@')[0] || 'Anonymous',
      createdAt: now,
      updatedAt: now,
      views: 0,
      likes: 0,
      ...(imageUrl && { imageUrl })
    };
    
    const docRef = await postsCollection.add(postData);
    
    res.status(201).json({
      id: docRef.id,
      ...postData,
      createdAt: postData.createdAt.toISOString(),
      updatedAt: postData.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Create post error:', error);
    
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check Firebase configuration.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:postId', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { postId } = req.params;
    const { title, content, excerpt, tags, category, published, imageUrl } = req.body;
    
    const doc = await postsCollection.doc(postId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = doc.data();
    
    // Check if user is the author
    if (post.authorId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (published !== undefined) updateData.published = Boolean(published);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    
    // Validate and update category
    if (category !== undefined) {
      const validCategories = ['daily-news', 'stock-market', 'ai', 'technology', 'business'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      updateData.category = category;
    }
    
    await postsCollection.doc(postId).update(updateData);
    
    const updatedDoc = await postsCollection.doc(postId).get();
    const updatedData = updatedDoc.data();
    
    res.json({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate ? updatedData.createdAt.toDate().toISOString() : updatedData.createdAt,
      updatedAt: updatedData.updatedAt?.toDate ? updatedData.updatedAt.toDate().toISOString() : updatedData.updatedAt
    });
  } catch (error) {
    console.error('Update post error:', error);
    
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check Firebase configuration.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:postId', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { postId } = req.params;
    
    const doc = await postsCollection.doc(postId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = doc.data();
    
    // Check if user is the author
    if (post.authorId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    await postsCollection.doc(postId).delete();
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check Firebase configuration.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get user's posts
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { userId } = req.params;
    const { page = 1, limit = 10, includeUnpublished = false } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = postsCollection
      .where('authorId', '==', userId)
      .orderBy('createdAt', 'desc');
    
    // Only show published posts unless user is viewing their own posts
    if (!includeUnpublished || !req.user || req.user.uid !== userId) {
      query = query.where('published', '==', true);
    }
    
    query = query.limit(parseInt(limit)).offset(offset);
    
    const snapshot = await query.get();
    
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Like/Unlike post
router.post('/:postId/like', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { postId } = req.params;
    const userId = req.user.uid;
    
    const postRef = postsCollection.doc(postId);
    const likesRef = db.collection('blogosphere').doc('likes').collection('likes');
    
    // Check if post exists
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user already liked this post
    const existingLike = await likesRef
      .where('postId', '==', postId)
      .where('userId', '==', userId)
      .get();
    
    if (!existingLike.empty) {
      // Unlike the post
      const likeDoc = existingLike.docs[0];
      await likeDoc.ref.delete();
      
      // Decrement likes count
      await postRef.update({
        likes: Math.max((postDoc.data().likes || 1) - 1, 0)
      });
      
      res.json({ liked: false, message: 'Post unliked successfully' });
    } else {
      // Like the post
      await likesRef.add({
        postId,
        userId,
        createdAt: new Date()
      });
      
      // Increment likes count
      await postRef.update({
        likes: (postDoc.data().likes || 0) + 1
      });
      
      res.json({ liked: true, message: 'Post liked successfully' });
    }
  } catch (error) {
    console.error('Like/Unlike post error:', error);
    
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check Firebase configuration.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to like/unlike post' });
  }
});

module.exports = router;