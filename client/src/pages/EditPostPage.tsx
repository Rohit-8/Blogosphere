import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { postsService } from '../services/postsService';
import { CATEGORIES } from '../components/Navbar';

const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    category: 'technology',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // user state removed - authentication check is done in effect

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // authenticated - continue

    const loadPost = async () => {
      if (!id) {
        setError('Missing post id');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const post = await postsService.getPost(id);
        setFormData({
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          tags: (post.tags || []).join(', '),
          category: post.category || 'technology',
          imageUrl: post.imageUrl || ''
        });
      } catch (err: any) {
        console.error('Failed to load post:', err);
        setError(err?.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'published') => {
    e.preventDefault();

    if (!id) {
      setError('Missing post id');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setError('');
      setSaving(true);

      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        category: formData.category,
        imageUrl: formData.imageUrl.trim() || undefined,
        status
      } as any;

      const updated = await postsService.updatePost(id, updateData);

      if (status === 'published') {
        navigate(`/post/${updated.id}`);
      } else {
        navigate('/my-drafts');
      }
    } catch (err: any) {
      console.error('Update post error:', err);
      setError(err?.message || 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
                Edit Post
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
                  <Form.Label className="fw-bold">Post Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Enter an engaging title for your post"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    size="lg"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Category *</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={saving}
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
                      <Form.Label className="fw-bold">Featured Image URL <span className="text-muted fw-normal">(optional)</span></Form.Label>
                      <Form.Control
                        type="url"
                        name="imageUrl"
                        placeholder="https://example.com/image.jpg"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        disabled={saving}
                        size="lg"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Content *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={12}
                    name="content"
                    placeholder="Write your post content here... You can use Markdown formatting!"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    disabled={saving}
                  />
                  <Form.Text className="text-muted">
                    <i className="fab fa-markdown me-1"></i>
                    Markdown formatting supported
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Excerpt <span className="text-muted fw-normal">(optional)</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="excerpt"
                    placeholder="Write a brief summary of your post (will be auto-generated if left empty)"
                    value={formData.excerpt}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Tags <span className="text-muted fw-normal">(optional)</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    placeholder="Enter tags separated by commas (e.g., technology, javascript, tutorial)"
                    value={formData.tags}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </Form.Group>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={saving}
                    className="me-md-2"
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </Button>

                  <Button
                    variant="outline-primary"
                    onClick={(e) => handleSubmit(e, 'draft')}
                    disabled={saving}
                    className="me-md-2"
                  >
                    {saving ? (
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
                    disabled={saving}
                    className="btn-gradient"
                  >
                    {saving ? (
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
        </Col>
      </Row>
    </Container>
  );
};

export default EditPostPage;