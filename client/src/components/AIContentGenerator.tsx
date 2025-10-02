import React, { useState } from 'react';
import { Modal, Form, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { aiService } from '../services/aiService';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

interface AIContentGeneratorProps {
  show: boolean;
  onHide: () => void;
  onContentGenerated: (content: string) => void;
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  show,
  onHide,
  onContentGenerated,
}) => {
  const { isDarkMode } = useTheme();
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState(500);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    const user = authService.getUser();
    if (!user) {
      setError('Please login to use AI features');
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    if (wordCount < 100 || wordCount > 2000) {
      setError('Word count must be between 100 and 2000');
      return;
    }

    try {
      setError('');
      setGenerating(true);
      setGeneratedContent('');
      setProgress(0);

      let content = '';
      const generator = aiService.generateContent({ topic, wordCount });

      for await (const chunk of generator) {
        content += chunk;
        setGeneratedContent(content);
        
        // Estimate progress based on expected word count
        const currentWords = content.split(/\s+/).length;
        const estimatedProgress = Math.min(95, (currentWords / wordCount) * 100);
        setProgress(estimatedProgress);
      }

      setProgress(100);
    } catch (err: any) {
      console.error('Generate error:', err);
      setError(err.message || 'Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent);
      handleClose();
    }
  };

  const handleClose = () => {
    setTopic('');
    setWordCount(500);
    setGeneratedContent('');
    setError('');
    setProgress(0);
    onHide();
  };

  // Theme-aware styles
  const previewStyles = {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f9fa',
    color: isDarkMode ? '#e0e0e0' : '#212529',
    border: isDarkMode ? '1px solid #444' : '1px solid #dee2e6'
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static" keyboard={!generating}>
      <Modal.Header closeButton={!generating}>
        <Modal.Title>
          <i className="fas fa-magic me-2"></i>
          AI Content Generator
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="d-flex align-items-center" dismissible onClose={() => setError('')}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {!generating && !generatedContent && (
          <>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <i className="fas fa-lightbulb me-2"></i>
                Topic *
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="E.g., The Future of Artificial Intelligence"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                autoFocus
              />
              <Form.Text className="text-muted">
                Enter the topic you want to write about
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <i className="fas fa-text-width me-2"></i>
                Target Word Count: {wordCount}
              </Form.Label>
              <Form.Range
                min={100}
                max={2000}
                step={50}
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
              />
              <Form.Text className="text-muted">
                Adjust the slider to set your desired word count (100-2000 words)
              </Form.Text>
            </Form.Group>

            <Alert variant="info" className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1"></i>
              <div>
                <strong>How it works:</strong>
                <ul className="mb-0 mt-2">
                  <li>AI will generate a complete blog post based on your topic</li>
                  <li>You can review and edit the generated content</li>
                  <li>Content will be formatted with Markdown</li>
                  <li>Rate limited to 1 request per second for all users</li>
                </ul>
              </div>
            </Alert>
          </>
        )}

        {generating && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5 className="mb-3">Generating your content...</h5>
            <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
            <div 
              className="generated-content-preview p-3 rounded text-start"
              style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                ...previewStyles
              }}
            >
              <pre className="mb-0" style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'inherit',
                color: isDarkMode ? '#e0e0e0' : '#212529',
                backgroundColor: 'transparent'
              }}>
                {generatedContent || 'Waiting for AI response...'}
              </pre>
            </div>
          </div>
        )}

        {!generating && generatedContent && (
          <>
            <Alert variant="success" className="d-flex align-items-center">
              <i className="fas fa-check-circle me-2"></i>
              Content generated successfully! Review it below and click "Use This Content" to add it to your post.
            </Alert>
            <div 
              className="generated-content-preview p-3 rounded"
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                ...previewStyles
              }}
            >
              <pre className="mb-0" style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'inherit',
                color: isDarkMode ? '#e0e0e0' : '#212529',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                backgroundColor: 'transparent'
              }}>
                {generatedContent}
              </pre>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} disabled={generating}>
          {generatedContent ? 'Cancel' : 'Close'}
        </Button>
        
        {!generating && !generatedContent && (
          <Button 
            variant="primary" 
            onClick={handleGenerate}
            disabled={!topic.trim()}
          >
            <i className="fas fa-magic me-2"></i>
            Generate Content
          </Button>
        )}
        
        {!generating && generatedContent && (
          <>
            <Button 
              variant="outline-primary" 
              onClick={() => {
                setGeneratedContent('');
                setProgress(0);
              }}
            >
              <i className="fas fa-redo me-2"></i>
              Generate Again
            </Button>
            <Button variant="primary" onClick={handleUseContent}>
              <i className="fas fa-check me-2"></i>
              Use This Content
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AIContentGenerator;
