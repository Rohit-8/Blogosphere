import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Nav } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { postsService } from '../services/postsService';
import { CATEGORIES } from '../components/Navbar';
import { BlogPost } from '../types';

const ExplorePage: React.FC = () => {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [displayPosts, setDisplayPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsService.getPosts({ limit: 50 });
      setAllPosts(response.posts);
      setDisplayPosts(response.posts);
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
    // Update URL parameters
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  // Filter posts based on URL parameter
  useEffect(() => {
    if (selectedCategory === 'all') {
      setDisplayPosts(allPosts);
    } else {
      const filtered = allPosts.filter(post => post.category === selectedCategory);
      setDisplayPosts(filtered);
    }
  }, [allPosts, selectedCategory]);

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
    <div className="explore-page">
      {/* Categories Section - starts immediately without hero */}
      <div className="categories-section" style={{ paddingTop: '1.5rem', paddingBottom: '1rem' }}>
        <Container>
          <div className="text-center mb-4">
            {selectedCategory === 'all' ? (
              <>
                <h1 className="h2 fw-bold mb-3">Explore All Posts</h1>
                <p className="mb-3" style={{ fontSize: '1.1rem' }}>
                  Discover amazing content across all categories. Filter by your interests and dive deep into topics you love.
                </p>
              </>
            ) : (
              <>
                {(() => {
                  const category = CATEGORIES.find(cat => cat.id === selectedCategory);
                  return category ? (
                    <>
                      <div className="category-icon-inline mb-2" style={{ fontSize: '2rem', color: 'var(--bs-primary)' }}>
                        <i className={category.icon}></i>
                      </div>
                      <h1 className="h2 fw-bold mb-3">{category.name}</h1>
                      <p className="mb-3" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        Discover the latest insights and trends in {category.name.toLowerCase()}
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="h2 fw-bold mb-3">Category Not Found</h1>
                      <p className="mb-3">The selected category could not be found.</p>
                    </>
                  );
                })()}
              </>
            )}
          </div>
          
          {/* Category Navigation */}
          <Nav className="category-nav justify-content-center mb-4">
            <Nav.Item>
              <Nav.Link 
                className={selectedCategory === 'all' ? 'active' : ''}
                onClick={() => handleCategoryChange('all')}
              >
                <i className="fas fa-th-large me-2"></i>
                All Posts ({allPosts.length})
              </Nav.Link>
            </Nav.Item>
            {CATEGORIES.map(category => {
              const count = allPosts.filter(post => post.category === category.id).length;
              return (
                <Nav.Item key={category.id}>
                  <Nav.Link 
                    className={selectedCategory === category.id ? 'active' : ''}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <i className={`${category.icon} me-2`}></i>
                    {category.name} ({count})
                  </Nav.Link>
                </Nav.Item>
              );
            })}
          </Nav>
        </Container>
      </div>

      {/* Posts Grid */}
      <Container className="posts-section pb-4">
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {displayPosts.length === 0 && !loading && !error ? (
          <div className="text-center py-5">
            <i className="fas fa-blog fa-4x text-muted mb-4"></i>
            <h3>No posts in this category yet</h3>
            <p className="text-muted mb-4">Be the first to share your insights!</p>
          </div>
        ) : (
          <Row className="g-4">
            {displayPosts.map((post) => (
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
                        
                        <button 
                          className="btn btn-primary btn-sm read-more-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${post.id}`);
                          }}
                        >
                          Read More
                          <i className="fas fa-arrow-right ms-1"></i>
                        </button>
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

export default ExplorePage;