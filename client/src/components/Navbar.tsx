import React, { useState, useEffect } from 'react';
import { Navbar as BSNavbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export const CATEGORIES = [
  { id: 'daily-news', name: 'Daily News', icon: 'fas fa-newspaper' },
  { id: 'stock-market', name: 'Stock Market', icon: 'fas fa-chart-line' },
  { id: 'ai', name: 'AI & ML', icon: 'fas fa-robot' },
  { id: 'technology', name: 'Technology', icon: 'fas fa-microchip' },
  { id: 'business', name: 'Business', icon: 'fas fa-briefcase' }
];

const Navbar: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getUser();
      setUser(currentUser);
    };
    
    checkAuth();
    
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blogosphere_user' || e.key === 'blogosphere_token') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    try {
      authService.logout();
      setUser(null);
      navigate('/');
      window.location.reload(); // Refresh to update app state
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <BSNavbar expand="lg" className="shadow-sm navbar-modern">
      <Container fluid className="px-4">
        {/* Logo Section */}
        <BSNavbar.Brand as={Link} to="/" className="brand-logo">
          <div className="logo-container">
            <i className="fas fa-blog logo-icon"></i>
            <span className="brand-text">Blogosphere</span>
          </div>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="navbar-nav" className="ms-auto" />
        
        <BSNavbar.Collapse id="navbar-nav">
          {/* Left side - empty for spacing */}
          <Nav className="me-auto">
            {user && (
              <Nav.Link as={Link} to="/create" className="nav-item-modern">
                <i className="fas fa-plus me-1"></i>
                Write
              </Nav.Link>
            )}
          </Nav>

          {/* Right side - Home, Categories, Theme, Auth */}
          <Nav className="navbar-right ms-auto">
            <Nav.Link as={Link} to="/" className="nav-item-modern">
              <i className="fas fa-home me-1"></i>
              Home
            </Nav.Link>
            
            <NavDropdown 
              title={
                <span>
                  <i className="fas fa-list me-1"></i>
                  Categories
                </span>
              } 
              id="categories-dropdown"
              className="nav-item-modern"
            >
              <NavDropdown.Item 
                as={Link} 
                to="/explore"
                className="category-item"
              >
                <i className="fas fa-th-large me-2"></i>
                All Categories
              </NavDropdown.Item>
              <NavDropdown.Divider />
              {CATEGORIES.map(category => (
                <NavDropdown.Item 
                  key={category.id}
                  as={Link} 
                  to={`/explore?category=${category.id}`}
                  className="category-item"
                >
                  <i className={`${category.icon} me-2`}></i>
                  {category.name}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
            
            {/* Theme Toggle */}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleTheme}
              className="theme-toggle-modern me-2"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <i className="fas fa-sun"></i>
              ) : (
                <i className="fas fa-moon"></i>
              )}
            </Button>

            {user ? (
              <>
                <NavDropdown 
                  title={
                    <span>
                      <i className="fas fa-user me-1"></i>
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || user.email?.split('@')[0] || 'Profile'}
                    </span>
                  } 
                  id="user-dropdown"
                  className="user-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    <i className="fas fa-user me-2"></i>Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/my-posts">
                    <i className="fas fa-file-alt me-2"></i>My Posts
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <div className="auth-buttons">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2 login-btn"
                  onClick={() => navigate('/login')}
                >
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="signup-btn"
                  onClick={() => navigate('/register')}
                >
                  <i className="fas fa-user-plus me-1"></i>
                  Sign Up
                </Button>
              </div>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;