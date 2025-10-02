import React from 'react';
import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <BSNavbar expand="lg" className="shadow-sm navbar">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold text-primary">
          <i className="fas fa-blog me-2"></i>
          Blogosphere
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              <i className="fas fa-home me-1"></i>
              Home
            </Nav.Link>
            
            {user && (
              <Nav.Link as={Link} to="/create">
                <i className="fas fa-plus me-1"></i>
                Write
              </Nav.Link>
            )}
          </Nav>
          
          <Nav className="ms-auto d-flex align-items-center">
            {/* Theme Toggle Button */}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleTheme}
              className="theme-toggle me-2"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <i className="fas fa-sun"></i>
              ) : (
                <i className="fas fa-moon"></i>
              )}
              <span className="d-none d-md-inline ms-1">
                {isDarkMode ? 'Light' : 'Dark'}
              </span>
            </Button>

            {user ? (
              <>
                <Nav.Link as={Link} to="/profile">
                  <i className="fas fa-user me-1"></i>
                  {user.displayName || 'Profile'}
                </Nav.Link>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="ms-2"
                >
                  <i className="fas fa-sign-out-alt me-1"></i>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Login
                </Nav.Link>
                <Button
                  variant="primary"
                  size="sm"
                  className="ms-2"
                  onClick={() => navigate('/register')}
                >
                  <i className="fas fa-user-plus me-1"></i>
                  Sign Up
                </Button>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;