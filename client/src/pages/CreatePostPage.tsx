import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsService } from '../services/postsService';
import { CATEGORIES } from '../components/Navbar';

const CreatePostPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    category: 'technology',
    imageUrl: '',
    published: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        published: formData.published
      };
      
      const newPost = await postsService.createPost(postData);
      navigate(`/post/${newPost.id}`);
    } catch (error: any) {
      setError('Failed to create post. Please try again.');
      console.error('Create post error:', error);
    } finally {
      setLoading(false);
    }
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
                    <i className="fas fa-heading me-2"></i>
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
                  <Form.Label className="fw-bold">
                    <i className="fas fa-align-left me-2"></i>
                    Content *
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={12}
                    name="content"
                    placeholder="Write your post content here... You can use Markdown formatting!"
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

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    name="published"
                    label={
                      <span>
                        <i className="fas fa-globe me-2"></i>
                        <strong>Publish immediately</strong>
                        <br />
                        <small className="text-muted">
                          Uncheck to save as draft (you can publish later)
                        </small>
                      </span>
                    }
                    checked={formData.published}
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
                    type="submit"
                    className="btn-gradient"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {formData.published ? 'Publishing...' : 'Saving Draft...'}
                      </>
                    ) : (
                      <>
                        <i className={`fas ${formData.published ? 'fa-paper-plane' : 'fa-save'} me-2`}></i>
                        {formData.published ? 'Publish Post' : 'Save as Draft'}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreatePostPage;