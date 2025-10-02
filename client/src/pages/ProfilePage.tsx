import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Nav } from 'react-bootstrap';
import { authService } from '../services/authService';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    profile: {
      bio: '',
      location: '',
      website: ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const result = await authService.getCurrentUser();
      
      if (result.success && result.user) {
        setUser(result.user);
        setFormData({
          firstName: result.user.firstName || '',
          lastName: result.user.lastName || '',
          username: result.user.username || '',
          profile: {
            bio: result.user.profile?.bio || '',
            location: result.user.profile?.location || '',
            website: result.user.profile?.website || ''
          }
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.updateProfile(formData);
      
      if (result.success) {
        setUser(result.user);
        setEditMode(false);
        setSuccess('Profile updated successfully!');
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      
      if (result.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow border-0">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-user me-2"></i>
                My Profile
              </h4>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Navigation Tabs */}
              <Nav variant="tabs" className="px-3 pt-3">
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                    className="text-decoration-none"
                  >
                    <i className="fas fa-user me-1"></i>
                    Profile Info
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'password'}
                    onClick={() => setActiveTab('password')}
                    className="text-decoration-none"
                  >
                    <i className="fas fa-lock me-1"></i>
                    Change Password
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <div className="p-4">
                {error && (
                  <Alert variant="danger" className="mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="mb-3">
                    <i className="fas fa-check-circle me-2"></i>
                    {success}
                  </Alert>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <>
                    {!editMode ? (
                      <div>
                        <div className="mb-4">
                          <h5>Personal Information</h5>
                          <hr />
                        </div>

                        <Row className="mb-3">
                          <Col md={6}>
                            <strong>First Name:</strong>
                            <p>{user?.firstName || 'Not set'}</p>
                          </Col>
                          <Col md={6}>
                            <strong>Last Name:</strong>
                            <p>{user?.lastName || 'Not set'}</p>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={6}>
                            <strong>Username:</strong>
                            <p>{user?.username || 'Not set'}</p>
                          </Col>
                          <Col md={6}>
                            <strong>Email:</strong>
                            <p>{user?.email}</p>
                          </Col>
                        </Row>

                        <div className="mb-4">
                          <h5>Profile Information</h5>
                          <hr />
                        </div>

                        <div className="mb-3">
                          <strong>Bio:</strong>
                          <p>{user?.profile?.bio || 'No bio added yet'}</p>
                        </div>

                        <Row className="mb-3">
                          <Col md={6}>
                            <strong>Location:</strong>
                            <p>{user?.profile?.location || 'Not set'}</p>
                          </Col>
                          <Col md={6}>
                            <strong>Website:</strong>
                            <p>{user?.profile?.website || 'Not set'}</p>
                          </Col>
                        </Row>

                        <div className="mb-3">
                          <strong>Member Since:</strong>
                          <p>{new Date(user?.createdAt).toLocaleDateString()}</p>
                        </div>

                        <Button
                          variant="primary"
                          onClick={() => setEditMode(true)}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Edit Profile
                        </Button>
                      </div>
                    ) : (
                      <Form onSubmit={handleUpdateProfile}>
                        <div className="mb-4">
                          <h5>Edit Profile Information</h5>
                          <hr />
                        </div>

                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>First Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="Enter your first name"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Last Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Enter your last name"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label>Username</Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Enter your username"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Bio</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="profile.bio"
                            value={formData.profile.bio}
                            onChange={handleInputChange}
                            placeholder="Tell us about yourself..."
                          />
                        </Form.Group>

                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Location</Form.Label>
                              <Form.Control
                                type="text"
                                name="profile.location"
                                value={formData.profile.location}
                                onChange={handleInputChange}
                                placeholder="Your location"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Website</Form.Label>
                              <Form.Control
                                type="url"
                                name="profile.website"
                                value={formData.profile.website}
                                onChange={handleInputChange}
                                placeholder="Your website URL"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <div className="d-flex gap-2">
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-1"
                                />
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save me-1"></i>
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setEditMode(false);
                              setError('');
                              setSuccess('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </Form>
                    )}
                  </>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <Form onSubmit={handleChangePassword}>
                    <div className="mb-4">
                      <h5>Change Password</h5>
                      <hr />
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your new password"
                        minLength={6}
                        required
                      />
                      <Form.Text className="text-muted">
                        Password must be at least 6 characters with uppercase, lowercase, and number.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm your new password"
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-1"
                          />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-key me-1"></i>
                          Change Password
                        </>
                      )}
                    </Button>
                  </Form>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;