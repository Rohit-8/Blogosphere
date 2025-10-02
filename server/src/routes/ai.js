const express = require('express');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI with Nvidia base URL
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Rate limiter for AI routes - configurable via environment variables
const AI_RATE_LIMIT_WINDOW_MS = parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 1000; // default 1 second
const AI_RATE_LIMIT_MAX = parseInt(process.env.AI_RATE_LIMIT_MAX) || 1; // default 1 request per window

const aiRateLimiter = rateLimit({
  windowMs: AI_RATE_LIMIT_WINDOW_MS,
  max: AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'AI service is busy. Please try again in a moment.',
    retryAfter: 1
  },
  // Use a global store that counts all requests
  keyGenerator: () => 'global',
});

// Generate content for blog post
router.post('/generate-content', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { topic, wordCount } = req.body;

    // Validation
    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const requestedWords = parseInt(wordCount) || 500;
    if (requestedWords < 100 || requestedWords > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Word count must be between 100 and 2000'
      });
    }

    console.log(`AI Generate Content - User: ${req.user.email}, Topic: ${topic}, Words: ${requestedWords}`);

    // Create prompt for blog post generation
    const prompt = `Write a comprehensive blog post about "${topic}". 
    
Requirements:
- Target length: approximately ${requestedWords} words
- Use engaging and informative tone
- Include an introduction, main body with key points, and conclusion
- Use Markdown formatting (headers, bold, lists, etc.)
- Make it well-structured and easy to read
- Include relevant examples or insights where appropriate

Please write the blog post now:`;

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-405b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
      max_tokens: 4096,
      stream: true,
    });

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('AI Generate Content Error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate content. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
      res.end();
    }
  }
});

// Summarize blog post content
router.post('/summarize', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { content } = req.body;

    // Validation
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    if (content.length < 100) {
      return res.status(400).json({
        success: false,
        message: 'Content is too short to summarize'
      });
    }

    console.log(`AI Summarize - User: ${req.user.email}, Content length: ${content.length}`);

    // Create prompt for summarization
    const prompt = `Please provide a concise and clear summary of the following blog post content. 
    
The summary should:
- Be significantly shorter than the original (aim for 3-5 sentences)
- Capture the main ideas and key points
- Be easy to understand
- Maintain a professional tone

Content to summarize:
${content}

Please provide the summary now:`;

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-405b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      top_p: 0.7,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 1024,
      stream: true,
    });

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('AI Summarize Error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to summarize content. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Summarization failed' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
