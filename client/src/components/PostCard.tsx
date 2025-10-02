import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { BlogPost } from '../types';
import { CATEGORIES } from './Navbar';

interface PostCardProps {
  post: BlogPost;
  showFullContent?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, showFullContent = false }) => {
  const navigate = useNavigate();

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (showFullContent || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const category = CATEGORIES.find(cat => cat.id === post.category);

  return (
    <Card className="modern-post-card h-100">
      {/* Consistent Image Section */}
      <div className="post-image-wrapper">
        {post.imageUrl ? (
          <Card.Img 
            variant="top" 
            src={post.imageUrl} 
            className="post-image"
            alt={post.title}
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.parentElement?.querySelector('.post-image-placeholder') as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className="post-image-placeholder" 
          style={{ display: post.imageUrl ? 'none' : 'flex' }}
        >
          <i className={category?.icon || 'fas fa-file-alt'}></i>
        </div>
      </div>

      {/* Card Body */}
      <Card.Body className="d-flex flex-column">
        {/* Post Meta */}
        <div className="post-meta mb-3">
          <Badge bg="primary" className="category-badge">
            <i className={`${category?.icon || 'fas fa-tag'} me-1`}></i>
            {category?.name || 'General'}
          </Badge>
          <span className="read-time ms-2">
            <i className="fas fa-clock me-1"></i>
            {calculateReadTime(post.content)} min read
          </span>
        </div>
        
        {/* Post Title */}
        <Card.Title className="post-title mb-3">
          <Link to={`/post/${post.id}`} className="text-decoration-none">
            {post.title}
          </Link>
        </Card.Title>
        
        {/* Post Excerpt */}
        <Card.Text className="post-excerpt flex-grow-1">
          {truncateContent(post.excerpt || post.content)}
        </Card.Text>
        
        {/* Post Footer */}
        <div className="post-footer mt-auto">
          {/* Author Info */}
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
          
          {/* Stats and Read More */}
          <div className="d-flex justify-content-between align-items-center">
            <div className="post-stats">
              <span className="stat-item me-3">
                <i className="fas fa-eye me-1"></i>
                {post.views || 0}
              </span>
              <span className="stat-item">
                <i className="fas fa-heart me-1"></i>
                {post.likes || 0}
              </span>
            </div>
            
            <Link 
              to={`/post/${post.id}`}
              className="btn btn-primary btn-sm read-more-btn"
            >
              Read More
              <i className="fas fa-arrow-right ms-1"></i>
            </Link>
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags mt-2">
              {post.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} bg="secondary" className="me-1">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default PostCard;