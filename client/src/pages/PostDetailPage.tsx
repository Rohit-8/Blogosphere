import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { postsService } from '../services/postsService';
import { authService } from '../services/authService';
import { BlogPost } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AISummarizer from '../components/AISummarizer';

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [showSummarizer, setShowSummarizer] = useState(false);

  // Check authentication status
  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        const fetchedPost = await postsService.getPost(id);
        setPost(fetchedPost);
        setError(null);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. It may not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  const handleLike = async () => {
    if (!user || !post) return;

    try {
      setLiking(true);
      await postsService.toggleLike(post.id);
      
      // Refetch the post to get updated like count
      const updatedPost = await postsService.getPost(post.id);
      setPost(updatedPost);
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLiking(false);
    }
  };

  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSummarizeClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowSummarizer(true);
  };

  const isAuthor = user && post && user.id === post.authorId;

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} className="text-center">
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Loading post...</span>
            </Spinner>
            <p className="text-muted">Loading post...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger" className="text-center">
              <Alert.Heading>Post Not Found</Alert.Heading>
              <p>{error || 'The requested post could not be found.'}</p>
              <Button variant="primary" onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        {/* Left Sidebar */}
        <Col lg={3} className="d-none d-lg-block post-detail-sidebar">
          <div className="sidebar-sticky">
            {/* Back Button */}
            <div className="mb-3">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="shadow-sm w-100"
              >
                ← Back
              </Button>
            </div>

            {/* Browse More Posts */}
            <Card className="shadow-sm border-0">
              <Card.Body className="p-3 text-center">
                <h6 className="mb-3 text-primary">
                  <i className="bi bi-compass me-2"></i>
                  Discover More
                </h6>
                <p className="small text-muted mb-3">
                  Explore other amazing posts from our community
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/')}
                  className="w-100"
                >
                  <i className="bi bi-grid me-2"></i>
                  Browse Posts
                </Button>
              </Card.Body>
            </Card>
          </div>
        </Col>

        {/* Main Content */}
        <Col lg={6}>

          {/* Main Post Card */}
          <Card className="post-detail-main">
            <Card.Body className="p-4 p-md-5">
              {/* Post Header */}
              <div className="mb-4">
                <h1 className="post-detail-title">{post.title}</h1>
                
                {/* Author and Date Info */}
                <div className="d-flex flex-wrap align-items-center post-meta-icons mb-3">
                  <div className="me-4 mb-2">
                    <i className="bi bi-person-circle"></i>
                    <span>By {post.authorName}</span>
                  </div>
                  <div className="me-4 mb-2">
                    <i className="bi bi-calendar3"></i>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="me-4 mb-2">
                    <i className="bi bi-eye"></i>
                    <span>{post.views} views</span>
                  </div>
                  <div className="mb-2">
                    <i className="bi bi-heart"></i>
                    <span>{post.likes} likes</span>
                  </div>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mb-3">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-2 mb-1">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Content (rendered as Markdown) */}
              <div className="post-detail-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
              </div>

              {/* Action Buttons */}
              <div className="post-actions d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex flex-wrap gap-2">
                  {user && (
                    <>
                      <Button
                        variant={post.likes > 0 ? "danger" : "outline-danger"}
                        size="sm"
                        onClick={handleLike}
                        disabled={liking}
                      >
                        {liking ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <>
                            <i className="bi bi-heart me-1"></i>
                            {post.likes > 0 ? `Liked (${post.likes})` : 'Like'}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleSummarizeClick}
                      >
                        <i className="fas fa-compress-alt me-1"></i>
                        Summarize with AI
                      </Button>
                    </>
                  )}
                  
                  {!user && (
                    <>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate('/login')}
                      >
                        <i className="bi bi-heart me-1"></i>
                        Login to Like
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleSummarizeClick}
                      >
                        <i className="fas fa-compress-alt me-1"></i>
                        Summarize with AI
                      </Button>
                    </>
                  )}
                </div>

                <div className="d-lg-none">
                  {isAuthor && (
                    <>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/edit/${post.id}`)}
                        className="me-2"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate(`/profile/${post.authorId}`)}
                  >
                    <i className="bi bi-person me-1"></i>
                    View Author
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

        </Col>

        {/* Right Sidebar */}
        <Col lg={3} className="d-none d-lg-block post-detail-sidebar">
          <div className="sidebar-sticky">
            {/* About this post Card */}
            <Card className="shadow-sm border-0">
              <Card.Body className="p-3">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  About this post
                </h6>
                <div className="mb-3">
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-calendar3 me-2"></i>
                    <strong>Created:</strong><br/>
                    {formatDate(post.createdAt)}
                  </small>
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-pencil me-2"></i>
                    <strong>Last updated:</strong><br/>
                    {formatDate(post.updatedAt)}
                  </small>
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-eye me-2"></i>
                    <strong>Views:</strong> {post.views}
                  </small>
                  <small className="text-muted d-block">
                    <i className="bi bi-heart me-2"></i>
                    <strong>Likes:</strong> {post.likes}
                  </small>
                </div>
                
                {/* Quick Actions */}
                <div className="d-grid gap-2">
                  {isAuthor && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/edit/${post.id}`)}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Edit Post
                    </Button>
                  )}
                  
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate(`/profile/${post.authorId}`)}
                  >
                    <i className="bi bi-person me-1"></i>
                    View Author
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>

        {/* Mobile Actions - Show on smaller screens */}
        <Col xs={12} className="d-lg-none mt-3">
          <div className="d-flex gap-2 mb-3">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="flex-fill"
            >
              ← Back
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => navigate('/')}
              className="flex-fill"
            >
              <i className="bi bi-grid me-1"></i>
              Browse Posts
            </Button>
          </div>
        </Col>
      </Row>

      {/* AI Summarizer Modal */}
      {post && (
        <AISummarizer
          show={showSummarizer}
          onHide={() => setShowSummarizer(false)}
          content={post.content}
          postTitle={post.title}
        />
      )}
    </Container>
  );
};

export default PostDetailPage;