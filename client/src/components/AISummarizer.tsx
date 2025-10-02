import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { aiService } from '../services/aiService';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

interface AISummarizerProps {
  show: boolean;
  onHide: () => void;
  content: string;
  postTitle?: string;
}

const AISummarizer: React.FC<AISummarizerProps> = ({
  show,
  onHide,
  content,
  postTitle,
}) => {
  const { isDarkMode } = useTheme();
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    const user = authService.getUser();
    if (!user) {
      setError('Please login to use AI features');
      return;
    }

    if (!content || content.trim().length < 100) {
      setError('Content is too short to summarize');
      return;
    }

    try {
      setError('');
      setSummarizing(true);
      setSummary('');

      let summaryText = '';
      const generator = aiService.summarizeContent({ content });

      for await (const chunk of generator) {
        summaryText += chunk;
        setSummary(summaryText);
      }

    } catch (err: any) {
      console.error('Summarize error:', err);
      setError(err.message || 'Failed to summarize content. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleClose = () => {
    setSummary('');
    setError('');
    onHide();
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    // You could add a toast notification here
  };

  // Theme-aware styles
  const cardStyles = {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    color: isDarkMode ? '#e0e0e0' : '#1a1a1a',
    border: isDarkMode ? '2px solid #0d6efd' : '2px solid #0d6efd'
  };

  const previewCardStyles = {
    backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
    color: isDarkMode ? '#b0b0b0' : '#495057',
    border: isDarkMode ? '1px solid #444' : '1px solid #dee2e6'
  };

  const streamingCardStyles = {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    border: isDarkMode ? '1px solid #444' : '1px solid #dee2e6'
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static" keyboard={!summarizing}>
      <Modal.Header closeButton={!summarizing}>
        <Modal.Title>
          <i className="fas fa-compress-alt me-2"></i>
          AI Summarizer
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="d-flex align-items-center" dismissible onClose={() => setError('')}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {postTitle && (
          <div className="mb-3">
            <h5 className="text-muted">
              <i className="fas fa-file-alt me-2"></i>
              {postTitle}
            </h5>
          </div>
        )}

        {!summarizing && !summary && (
          <>
            <Alert variant="info" className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1"></i>
              <div>
                <strong>About AI Summarization:</strong>
                <ul className="mb-0 mt-2">
                  <li>Get a concise summary of this blog post</li>
                  <li>Perfect for quick understanding of the main points</li>
                  <li>Powered by advanced AI technology</li>
                  <li>Rate limited to 1 request per second for all users</li>
                </ul>
              </div>
            </Alert>

            <Card style={previewCardStyles}>
              <Card.Body>
                <h6 style={{ color: isDarkMode ? '#b0b0b0' : '#6c757d' }} className="mb-2">
                  <i className="fas fa-file-alt me-2"></i>
                  Original Content Preview
                </h6>
                <div 
                  className="small"
                  style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    color: isDarkMode ? '#b0b0b0' : '#495057',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  {content.substring(0, 500)}
                  {content.length > 500 && '...'}
                </div>
                <div className="mt-2 text-end">
                  <small style={{ color: isDarkMode ? '#888' : '#6c757d' }}>
                    Content length: {content.length} characters
                  </small>
                </div>
              </Card.Body>
            </Card>
          </>
        )}

        {summarizing && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5 className="mb-3">Summarizing content...</h5>
            {summary && (
              <Card className="text-start" style={streamingCardStyles}>
                <Card.Body>
                  <div style={{ 
                    whiteSpace: 'pre-wrap',
                    color: isDarkMode ? '#e0e0e0' : '#212529',
                    fontSize: '1rem',
                    lineHeight: '1.7',
                    fontWeight: '400'
                  }}>
                    {summary}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}

        {!summarizing && summary && (
          <>
            <Alert variant="success" className="d-flex align-items-center">
              <i className="fas fa-check-circle me-2"></i>
              Summary generated successfully!
            </Alert>
            <Card style={cardStyles}>
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <span>
                  <i className="fas fa-sparkles me-2"></i>
                  Summary
                </span>
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={handleCopyToClipboard}
                  title="Copy to clipboard"
                >
                  <i className="fas fa-copy"></i>
                </Button>
              </Card.Header>
              <Card.Body style={{ padding: '1.5rem' }}>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.8',
                  color: isDarkMode ? '#e0e0e0' : '#1a1a1a',
                  fontSize: '1.05rem',
                  fontWeight: '400'
                }}>
                  {summary}
                </div>
              </Card.Body>
            </Card>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} disabled={summarizing}>
          Close
        </Button>
        
        {!summarizing && !summary && (
          <Button 
            variant="primary" 
            onClick={handleSummarize}
          >
            <i className="fas fa-compress-alt me-2"></i>
            Summarize Now
          </Button>
        )}
        
        {!summarizing && summary && (
          <Button 
            variant="outline-primary" 
            onClick={() => {
              setSummary('');
              handleSummarize();
            }}
          >
            <i className="fas fa-redo me-2"></i>
            Summarize Again
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AISummarizer;
