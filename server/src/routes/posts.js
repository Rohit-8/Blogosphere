const express = require('express');
const { getFirestore } = require('../config/firebase');
const { authenticateToken, verifyToken, optionalAuth } = require('../middleware/auth');
const { validatePost } = require('../middleware/validation');

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
      // Filter published posts in memory - handle both old 'published' field and new 'status' field
      const isPublished = data.status === 'published' || data.published === true;
      if (isPublished) {
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

// Get current user's all posts (drafts and published)
router.get('/my-posts', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    
    // Get user's all posts (both drafts and published)
    // Remove orderBy to avoid composite index requirement - we'll sort in memory
    const query = postsCollection
      .where('authorId', '==', req.user.id);
    
    const snapshot = await query.get();
    
    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
      });
    });
    
    // Sort posts by createdAt in memory (most recent first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({
      success: true,
      data: { posts }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
});

// Get current user's draft posts
router.get('/my-drafts', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    
    // Get user's draft posts
    // Remove orderBy to avoid composite index requirement - we'll sort in memory
    const query = postsCollection
      .where('authorId', '==', req.user.id)
      .where('status', '==', 'draft');
    
    const snapshot = await query.get();
    
    const drafts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      drafts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
      });
    });
    
    // Sort drafts by createdAt in memory (most recent first)
    drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({
      success: true,
      data: { posts: drafts }
    });
  } catch (error) {
    console.error('Error fetching user drafts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drafts'
    });
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
    
    // Check if post is published or if user is the author - handle both old and new field formats
    const isPublished = post.status === 'published' || post.published === true;
    if (!isPublished && (!req.user || req.user.id !== post.authorId)) {
      return res.status(403).json({ error: 'Post not accessible' });
    }
    
    // NOTE: view counting is handled by a dedicated endpoint to avoid double-counting and allow
    // throttling/deduplication. Clients should call POST /posts/:postId/view when a user views a post.
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
router.post('/', authenticateToken, validatePost, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { title, content, excerpt, tags, category = 'technology', status = 'draft', imageUrl } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Validate category
    const validCategories = ['daily-news', 'stock-market', 'ai', 'technology', 'business'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // Validate status
    const validStatuses = ['draft', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const now = new Date();
    const postData = {
      title: title.trim(),
      content,
      excerpt: excerpt ? excerpt.trim() : content.substring(0, 150) + '...',
      tags: Array.isArray(tags) ? tags : [],
      category,
      status,
      authorId: req.user.id,
      authorName: req.user.firstName && req.user.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : req.user.username || req.user.email?.split('@')[0] || 'Anonymous',
      authorEmail: req.user.email,
      createdAt: now,
      updatedAt: now,
      views: 0,
      likes: 0,
      ...(imageUrl && { imageUrl }),
      ...(status === 'published' && { publishedAt: now })
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
router.put('/:postId', authenticateToken, validatePost, async (req, res) => {
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
    
    // Check if user is the author or admin
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (published !== undefined) updateData.status = Boolean(published) ? 'published' : 'draft';
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
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { postId } = req.params;
    
    const doc = await postsCollection.doc(postId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = doc.data();
    
    // Check if user is the author or admin
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
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

// Record a view for a post with basic deduplication logic
// This endpoint should be called by the client when a user opens a post.
router.post('/:postId/view', optionalAuth, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { postId } = req.params;

    const docRef = postsCollection.doc(postId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });

    const post = doc.data();

    // Determine visitor identifier: use user id if logged in, otherwise use IP address
    const visitorId = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;

    // We'll keep a lightweight "recentViews" map on the post that stores visitorId => timestamp
    // to dedupe repeated rapid refreshes. This keeps the write small but is not intended as a
    // long-term analytics store. For production use, a separate analytics DB is recommended.
    const now = Date.now();
    const dedupeWindowMs = parseInt(process.env.VIEW_DEDUPE_WINDOW_MS) || 60 * 1000; // default 1 minute

    const recentViews = post.recentViews || {};
    const lastSeen = recentViews[visitorId];

    if (lastSeen && now - lastSeen < dedupeWindowMs) {
      // Already seen recently - do not increment
      return res.json({ success: true, message: 'View already counted recently' });
    }

    // Update recentViews (cleanup old entries)
    const cutoff = now - (parseInt(process.env.VIEW_RETENTION_MS) || 24 * 60 * 60 * 1000); // default 24h
    const newRecentViews = {};
    for (const [k, ts] of Object.entries(recentViews)) {
      if (ts > cutoff) newRecentViews[k] = ts;
    }
    newRecentViews[visitorId] = now;

    // Increment views atomically using transaction to avoid race conditions
    await db.runTransaction(async (t) => {
      const snapshot = await t.get(docRef);
      const current = snapshot.data();
      const currentViews = current.views || 0;
      t.update(docRef, {
        views: currentViews + 1,
        recentViews: newRecentViews
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({ error: 'Failed to record view' });
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
    
    // Only show published posts unless user is viewing their own posts or is admin
    if (!includeUnpublished || (!req.user || (req.user.id !== userId && req.user.role !== 'admin'))) {
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
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    const { postId } = req.params;
    const userId = req.user.id;
    
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

// Publish a draft post
router.put('/:postId/publish', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const db = getDB();
    const postsCollection = getBlogospherePostsCollection(db);
    
    // Get the post
    const postDoc = await postsCollection.doc(postId).get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const post = postDoc.data();
    
    // Verify ownership
    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only publish your own posts'
      });
    }
    
    // Check if post is a draft
    if (post.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Post is not a draft'
      });
    }
    
    // Update post status to published
    await postsCollection.doc(postId).update({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Post published successfully'
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish post'
    });
  }
});

module.exports = router;