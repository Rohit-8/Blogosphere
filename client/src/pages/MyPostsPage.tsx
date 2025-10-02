import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { postsService } from '../services/postsService';
import { BlogPost } from '../types';

const MyPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'published', 'drafts'
  const navigate = useNavigate();

  useEffect(() => {
    loadMyPosts();
  }, []);

  const loadMyPosts = async () => {
    try {
      setLoading(true);
      const response = await postsService.getMyPosts();
      setPosts(response.data.posts || []);
    } catch (error: any) {
      setError(error.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await postsService.deletePost(postId);
      // Remove the deleted post from the list
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error: any) {
      setError(error.message || 'Failed to delete post');
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      await postsService.publishPost(postId);
      // Update the post status in the list
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, status: 'published', published: true }
          : post
      ));
    } catch (error: any) {
      setError(error.message || 'Failed to publish post');
    }
  };

  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'published':
        return posts.filter(post => post.status === 'published' || post.published === true);
      case 'drafts':
        return posts.filter(post => post.status === 'draft' || post.published === false);
      default:
        return posts;
    }
  };

  const filteredPosts = getFilteredPosts();
  const publishedCount = posts.filter(post => post.status === 'published' || post.published === true).length;
  const draftCount = posts.filter(post => post.status === 'draft' || post.published === false).length;

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading your posts...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">
            <i className="fas fa-file-alt me-2 text-primary"></i>
            My Posts
          </h1>
          <p className="text-muted mb-0">Manage your published posts and drafts</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/create-post')}
          className="text-decoration-none"
        >
          <i className="fas fa-plus me-2"></i>
          Create New Post
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex align-items-center mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Nav variant="pills" className="mb-4">
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className="d-flex align-items-center"
          >
            <i className="fas fa-list me-2"></i>
            All Posts ({posts.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'published'}
            onClick={() => setActiveTab('published')}
            className="d-flex align-items-center"
          >
            <i className="fas fa-globe me-2"></i>
            Published ({publishedCount})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === 'drafts'}
            onClick={() => setActiveTab('drafts')}
            className="d-flex align-items-center"
          >
            <i className="fas fa-edit me-2"></i>
            Drafts ({draftCount})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {filteredPosts.length === 0 ? (
        <Card className="text-center py-5 shadow-sm">
          <Card.Body>
            <div className="mb-4">
              <i className="fas fa-file-alt fa-4x text-muted"></i>
            </div>
            <h4 className="text-muted mb-3">
              {activeTab === 'published' 
                ? 'No Published Posts Found'
                : activeTab === 'drafts'
                ? 'No Drafts Found'
                : 'No Posts Found'
              }
            </h4>
            <p className="text-muted mb-4">
              {activeTab === 'published'
                ? 'You haven\'t published any posts yet. Share your thoughts with the world!'
                : activeTab === 'drafts'
                ? 'You don\'t have any draft posts. Start writing your next blog post!'
                : 'You don\'t have any posts yet. Start writing your first blog post!'
              }
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/create-post')}
              className="text-decoration-none"
            >
              <i className="fas fa-plus me-2"></i>
              Create Your First Post
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {filteredPosts.map((post) => (
            <Col key={post.id} lg={6}>
              <Card className="h-100 shadow-sm post-card">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <Badge 
                      bg={post.status === 'published' || post.published ? 'success' : 'warning'}
                      className="d-flex align-items-center"
                    >
                      <i className={`fas ${post.status === 'published' || post.published ? 'fa-globe' : 'fa-edit'} me-1`}></i>
                      {post.status === 'published' || post.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <Card.Title className="h5 mb-2">
                    <Link
                      to={`/edit-post/${post.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {post.title}
                    </Link>
                  </Card.Title>

                  <Card.Text className="text-muted small mb-2 flex-grow-1">
                    {post.excerpt || post.content.substring(0, 150) + '...'}
                  </Card.Text>

                  <div className="mb-3">
                    {post.tags.length > 0 && (
                      <div className="mb-2">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            bg="light"
                            text="dark"
                            className="me-1 mb-1"
                          >
                            #{tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge bg="light" text="dark" className="me-1">
                            +{post.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-muted small mb-3">
                    <div>
                      <i className="fas fa-calendar me-1"></i>
                      Created: {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    {post.updatedAt !== post.createdAt && (
                      <div>
                        <i className="fas fa-edit me-1"></i>
                        Updated: {new Date(post.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <div className="post-stats small text-muted">
                      <span className="me-3">
                        <i className="fas fa-eye me-1"></i>
                        {post.views || 0}
                      </span>
                      <span>
                        <i className="fas fa-heart me-1"></i>
                        {post.likes || 0}
                      </span>
                    </div>

                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/edit-post/${post.id}`)}
                        className="text-decoration-none"
                      >
                        <i className="fas fa-edit me-1"></i>
                        Edit
                      </Button>
                      {(post.status === 'draft' || post.published === false) && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handlePublishPost(post.id)}
                        >
                          <i className="fas fa-globe me-1"></i>
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <i className="fas fa-trash me-1"></i>
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
  );
};

export default MyPostsPage;