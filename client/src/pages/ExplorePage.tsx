import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { postsService } from '../services/postsService';
import { CATEGORIES } from '../components/Navbar';
import { BlogPost } from '../types';
import CategorySidebar from '../components/CategorySidebar';
import SearchBar from '../components/SearchBar';

const ExplorePage: React.FC = () => {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [displayPosts, setDisplayPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  const postCounts = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      acc[category.id] = allPosts.filter(post => post.category === category.id).length;
      return acc;
    }, {} as Record<string, number>);
  }, [allPosts]);

  useEffect(() => {
    let filtered = allPosts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const contentMatch = post.content.toLowerCase().includes(query);
        const excerptMatch = post.excerpt?.toLowerCase().includes(query);
        const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(query));
        const categoryMatch = CATEGORIES.find(cat => cat.id === post.category)?.name.toLowerCase().includes(query);
        const authorMatch = post.authorName.toLowerCase().includes(query);
        
        return titleMatch || contentMatch || excerptMatch || tagsMatch || categoryMatch || authorMatch;
      });
    }

    setDisplayPosts(filtered);
  }, [allPosts, selectedCategory, searchQuery]);

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
      <Container fluid className="px-0">
        <Row className="g-0">
          <Col 
            md={isSidebarCollapsed ? 1 : 3} 
            lg={isSidebarCollapsed ? 1 : 2} 
            className="sidebar-explore"
          >
            <CategorySidebar
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              postCounts={postCounts}
              totalPosts={allPosts.length}
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onCategoryChange={handleCategoryChange}
            />
          </Col>

          <Col md={isSidebarCollapsed ? 11 : 9} lg={isSidebarCollapsed ? 11 : 10} className="main-content-explore">
            <div className="explore-header-section">
              <Container>
                <div className="text-center mb-2">
                  {selectedCategory === 'all' ? (
                    <>
                      <h1 className="h4 fw-bold mb-2">Explore All Posts</h1>
                      <p className="mb-0 text-muted small">
                        Discover amazing content across all categories
                      </p>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const category = CATEGORIES.find(cat => cat.id === selectedCategory);
                        return category ? (
                          <>
                            <h1 className="h4 fw-bold mb-2">{category.name}</h1>
                            <p className="mb-0 text-muted small">
                              Latest insights and trends in {category.name.toLowerCase()}
                            </p>
                          </>
                        ) : (
                          <h1 className="h4 fw-bold mb-2">Category Not Found</h1>
                        );
                      })()}
                    </>
                  )}
                </div>

                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  resultCount={displayPosts.length}
                />
              </Container>
            </div>

            {/* Posts Grid */}
            <Container className="posts-section pb-4">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : error ? (
                <div className="alert alert-danger mb-4" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              ) : displayPosts.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-blog fa-4x text-muted mb-4"></i>
                  <h3>No posts found</h3>
                  <p className="text-muted mb-4">
                    {searchQuery 
                      ? `No posts match your search "${searchQuery}". Try a different search term.`
                      : 'No posts in this category yet. Be the first to share your insights!'}
                  </p>
                  {searchQuery && (
                    <Button variant="primary" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
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
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ExplorePage;