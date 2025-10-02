import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { postsService } from '../services/postsService';
import { CATEGORIES } from '../components/Navbar';
import AIContentGenerator from '../components/AIContentGenerator';

const CreatePostPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    category: 'technology',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const navigate = useNavigate();

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'published') => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [],
        category: formData.category,
        imageUrl: formData.imageUrl.trim() || undefined,
        status
      };
      
      const newPost = await postsService.createPost(postData);
      
      if (status === 'published') {
        navigate(`/post/${newPost.id}`);
      } else {
        navigate('/my-drafts');
      }
    } catch (error: any) {
      setError('Failed to create post. Please try again.');
      console.error('Create post error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerateClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowAIGenerator(true);
  };

  const handleContentGenerated = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content: content
    }));
  };

  if (!user) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-pen me-2"></i>
                Create New Post
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    {/* <i className="fas fa-heading me-2"></i> */}
                    Post Title *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Enter an engaging title for your post"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    size="lg"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <i className="fas fa-list me-2"></i>
                        Category *
                      </Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        size="lg"
                      >
                        {CATEGORIES.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        <i className="fas fa-image me-2"></i>
                        Featured Image URL <span className="text-muted fw-normal">(optional)</span>
                      </Form.Label>
                      <Form.Control
                        type="url"
                        name="imageUrl"
                        placeholder="https://example.com/image.jpg"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        disabled={loading}
                        size="lg"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="fw-bold mb-0">
                      <i className="fas fa-align-left me-2"></i>
                      Content *
                    </Form.Label>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleAIGenerateClick}
                      disabled={loading}
                      className="d-flex align-items-center"
                    >
                      <i className="fas fa-magic me-2"></i>
                      Generate with AI
                    </Button>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={12}
                    name="content"
                    placeholder="Write your post content here... You can use Markdown formatting! Or click 'Generate with AI' to let AI help you."
                    value={formData.content}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    <i className="fab fa-markdown me-1"></i>
                    Markdown formatting supported
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-quote-left me-2"></i>
                    Excerpt <span className="text-muted fw-normal">(optional)</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="excerpt"
                    placeholder="Write a brief summary of your post (will be auto-generated if left empty)"
                    value={formData.excerpt}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <i className="fas fa-tags me-2"></i>
                    Tags <span className="text-muted fw-normal">(optional)</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    placeholder="Enter tags separated by commas (e.g., technology, javascript, tutorial)"
                    value={formData.tags}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/')}
                    disabled={loading}
                    className="me-md-2"
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </Button>
                  
                  <Button
                    variant="outline-primary"
                    onClick={(e) => handleSubmit(e, 'draft')}
                    disabled={loading}
                    className="me-md-2"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save as Draft
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={(e) => handleSubmit(e, 'published')}
                    disabled={loading}
                    className="btn-gradient"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Publish Post
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* AI Content Generator Modal */}
          <AIContentGenerator
            show={showAIGenerator}
            onHide={() => setShowAIGenerator(false)}
            onContentGenerated={handleContentGenerated}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default CreatePostPage;