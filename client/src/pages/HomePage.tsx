import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Pagination, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { postsService } from '../services/postsService';
import { BlogPost, PostsResponse } from '../types';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const navigate = useNavigate();

  const fetchPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const response: PostsResponse = await postsService.getPosts({ 
        page, 
        limit: 6 
      });
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading && posts.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="hero-section text-center">
        <Container>
          <h1 className="display-4 fw-bold mb-4">Welcome to Blogosphere</h1>
          <p className="lead mb-4">
            Discover amazing stories, insights, and ideas from our community of writers
          </p>
          <Button 
            size="lg" 
            className="btn-gradient"
            onClick={() => navigate('/register')}
          >
            <i className="fas fa-rocket me-2"></i>
            Start Writing Today
          </Button>
        </Container>
      </div>

      <Container className="py-5">
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {posts.length === 0 && !loading && !error ? (
          <div className="text-center py-5">
            <i className="fas fa-blog fa-3x text-muted mb-3"></i>
            <h3>No posts yet</h3>
            <p className="text-muted">Be the first to share your thoughts!</p>
            <Button 
              className="btn-gradient"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        ) : (
          <>
            <Row className="g-4">
              {posts.map((post) => (
                <Col key={post.id} md={6} lg={4}>
                  <Card className="h-100 post-card">
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-3">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} bg="light" text="dark" className="me-2 mb-2">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Card.Title className="h5 mb-3">
                        <Link 
                          to={`/post/${post.id}`} 
                          className="text-decoration-none"
                        >
                          {post.title}
                        </Link>
                      </Card.Title>
                      
                      <Card.Text className="text-muted flex-grow-1">
                        {truncateContent(post.excerpt || post.content)}
                      </Card.Text>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">
                            <i className="fas fa-user me-1"></i>
                            {post.authorName}
                          </small>
                          <small className="text-muted">
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(post.createdAt)}
                          </small>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex gap-3">
                            <small className="text-muted">
                              <i className="fas fa-eye me-1"></i>
                              {post.views || 0}
                            </small>
                            <small className="text-muted">
                              <i className="fas fa-heart me-1"></i>
                              {post.likes || 0}
                            </small>
                          </div>
                          
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate(`/post/${post.id}`)}
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5">
                <Pagination>
                  <Pagination.Prev 
                    disabled={!pagination.hasPrevPage}
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                  
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={currentPage === index + 1}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}
                  
                  <Pagination.Next 
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}

        {loading && posts.length > 0 && (
          <div className="text-center mt-4">
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </Container>
    </>
  );
};

export default HomePage;