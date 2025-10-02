import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { postsService } from '../services/postsService';
import { BlogPost } from '../types';
import { CATEGORIES } from '../components/Navbar';

const HomePage: React.FC = () => {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [displayPosts, setDisplayPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsService.getPosts({ limit: 50 });
      setAllPosts(response.posts);
      setDisplayPosts(response.posts);
      // Set featured posts as the most recent ones
      setFeaturedPosts(response.posts.slice(0, 3));
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setDisplayPosts(allPosts);
    } else {
      const filtered = allPosts.filter(post => post.category === categoryId);
      setDisplayPosts(filtered);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <div className="homepage-modern">
      {/* Enhanced Hero Section */}
      <div className="hero-section-modern">
        <Container>
          <Row className="align-items-center min-vh-60">
            <Col lg={6}>
              <div className="hero-content">
                <h1 className="hero-title">
                  Welcome to <span className="text-gradient">Blogosphere</span>
                </h1>
                <p className="hero-subtitle">
                  Discover insights across technology, business, AI, and market trends. 
                  Join our community of thought leaders and content creators.
                </p>
                <div className="hero-stats">
                  <div className="stat-item">
                    <h3>{allPosts.length}+</h3>
                    <p>Articles</p>
                  </div>
                  <div className="stat-item">
                    <h3>{CATEGORIES.length}</h3>
                    <p>Categories</p>
                  </div>
                  <div className="stat-item">
                    <h3>10K+</h3>
                    <p>Readers</p>
                  </div>
                </div>
                <div className="hero-actions">
                  <Button 
                    size="lg" 
                    className="btn-hero-primary me-3"
                    onClick={() => {
                      if (authService.isAuthenticated()) {
                        // If user is logged in, go to create post page
                        navigate('/create');
                      } else {
                        // If not logged in, send them to register and preserve intended destination
                        navigate('/register', { state: { from: { pathname: '/create' } } });
                      }
                    }}
                  >
                    <i className="fas fa-rocket me-2"></i>
                    Start Writing
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="lg"
                    className="btn-hero-secondary"
                    onClick={() => navigate('/explore')}
                  >
                    Explore Posts
                  </Button>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-visual">
                <div className="floating-cards">
                  {featuredPosts.slice(0, 3).map((post, index) => (
                    <Card key={post.id} className={`floating-card card-${index + 1}`}>
                      <Card.Body>
                        <Badge bg="primary" className="mb-2">
                          {CATEGORIES.find(cat => cat.id === post.category)?.name || 'General'}
                        </Badge>
                        <Card.Title className="h6">{post.title.substring(0, 40)}...</Card.Title>
                        <small className="text-muted">{post.authorName}</small>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>



      {/* Posts Grid */}
      <Container className="posts-section">
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        <div className="text-center mb-5">
          <h2 className="section-title">Latest Posts</h2>
          <p className="section-subtitle">Discover the most recent content from our community</p>
        </div>

        {allPosts.length === 0 && !loading && !error ? (
          <div className="text-center py-5">
            <i className="fas fa-blog fa-4x text-muted mb-4"></i>
            <h3>No posts in this category yet</h3>
            <p className="text-muted mb-4">Be the first to share your insights!</p>
            <Button 
              className="btn-gradient"
              onClick={() => navigate('/register')}
            >
              <i className="fas fa-plus me-2"></i>
              Create First Post
            </Button>
          </div>
        ) : (
          <Row className="g-4">
            {allPosts.slice(0, 6).map((post) => (
              <Col key={post.id} lg={4} md={6}>
                <Card className="modern-post-card h-100 clickable-card" onClick={() => navigate(`/post/${post.id}`)}>
                  <div className="post-image-wrapper">
                    {post.imageUrl ? (
                      <Card.Img variant="top" src={post.imageUrl} className="post-image" />
                    ) : (
                      <div className="post-image-placeholder">
                        <i className={`${CATEGORIES.find(cat => cat.id === post.category)?.icon || 'fas fa-file-alt'}`}></i>
                      </div>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <div className="post-meta mb-3">
                      <Badge bg="primary" className="category-badge">
                        <i className={`${CATEGORIES.find(cat => cat.id === post.category)?.icon || 'fas fa-tag'} me-1`}></i>
                        {CATEGORIES.find(cat => cat.id === post.category)?.name || 'General'}
                      </Badge>
                      <span className="read-time ms-2">
                        <i className="fas fa-clock me-1"></i>
                        {calculateReadTime(post.content)} min read
                      </span>
                    </div>
                    
                    <Card.Title className="post-title mb-3">
                      {post.title}
                    </Card.Title>
                    
                    <Card.Text className="post-excerpt flex-grow-1">
                      {truncateContent(post.excerpt || post.content)}
                    </Card.Text>
                    
                    <div className="post-footer mt-auto">
                      <div className="author-info mb-3">
                        <div className="d-flex align-items-center">
                          <div className="author-avatar me-2">
                            <i className="fas fa-user"></i>
                          </div>
                          <div>
                            <small className="fw-semibold">{post.authorName}</small>
                            <div className="post-date">
                              {formatDate(post.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="post-stats" onClick={(e) => e.stopPropagation()}>
                          <span className="stat-item me-3">
                            <i className="fas fa-eye me-1"></i>
                            {post.views || 0}
                          </span>
                          <span className="stat-item">
                            <i className="fas fa-heart me-1"></i>
                            {post.likes || 0}
                          </span>
                        </div>
                        
                        <Button 
                          variant="primary" 
                          size="sm"
                          className="read-more-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${post.id}`);
                          }}
                        >
                          Read More
                          <i className="fas fa-arrow-right ms-1"></i>
                        </Button>
                      </div>
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

export default HomePage;