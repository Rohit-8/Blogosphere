import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { postsService } from '../services/postsService';
import { CATEGORIES } from '../components/Navbar';
import { BlogPost } from '../types';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = CATEGORIES.find(cat => cat.id === categoryId);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      if (!categoryId) return;
      
      try {
        setLoading(true);
        const response = await postsService.getPosts({ limit: 100 });
        const categoryPosts = response.posts.filter(post => 
          post.category === categoryId
        );
        setPosts(categoryPosts);
      } catch (err) {
        console.error('Error fetching category posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [categoryId]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  if (!category) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Category not found</Alert>
      </Container>
    );
  }

  return (
    <div className="category-page">
      {/* Posts Grid - starts immediately without hero */}
      <Container className="py-5">
        {/* Category Header - now inside container */}
        <div className="text-center mb-5">
          <div className="category-icon-inline mb-3" style={{ fontSize: '3rem', color: 'var(--bs-primary)' }}>
            <i className={category.icon}></i>
          </div>
          <h1 className="display-4 fw-bold mb-3">{category.name}</h1>
          <p className="lead mb-4">
            Discover the latest insights and trends in {category.name.toLowerCase()}
          </p>
          <div className="category-stats">
            <Badge bg="primary" className="fs-6 px-3 py-2">
              {posts.length} {posts.length === 1 ? 'Post' : 'Posts'}
            </Badge>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading posts...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : posts.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
            <h3 className="text-muted">No posts found</h3>
            <p className="text-muted">Be the first to write about {category.name}!</p>
          </div>
        ) : (
          <Row>
            {posts.map((post) => (
              <Col key={post.id} md={6} lg={4} className="mb-4">
                <Card className="modern-post-card h-100">
                  <div className="post-image-wrapper">
                    {post.imageUrl ? (
                      <Card.Img 
                        variant="top" 
                        src={post.imageUrl} 
                        className="post-image"
                        alt={post.title}
                      />
                    ) : (
                      <div className="post-image-placeholder">
                        <i className={category?.icon || 'fas fa-file-alt'}></i>
                      </div>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <div className="post-meta mb-2">
                      <Badge bg="primary" className="me-2">
                        <i className={`${category.icon} me-1`}></i>
                        {category.name}
                      </Badge>
                      <small className="text-muted">
                        {calculateReadTime(post.content)} min read
                      </small>
                    </div>
                    
                    <Card.Title className="post-title">
                      <Link to={`/post/${post.id}`} className="text-decoration-none">
                        {post.title}
                      </Link>
                    </Card.Title>
                    
                    <Card.Text className="post-excerpt flex-grow-1">
                      {post.excerpt || post.content.substring(0, 150) + '...'}
                    </Card.Text>
                    
                    <div className="post-footer mt-auto">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {post.authorName}
                        </small>
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(post.createdAt)}
                        </small>
                      </div>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="post-tags mt-2">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} bg="secondary" className="me-1">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default CategoryPage;