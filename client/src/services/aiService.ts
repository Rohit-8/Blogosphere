import api from './api';

export interface GenerateContentRequest {
  topic: string;
  wordCount: number;
}

export interface SummarizeRequest {
  content: string;
}

class AIService {
  /**
   * Generate blog post content using AI
   * Returns an async generator that yields content chunks
   */
  async *generateContent(request: GenerateContentRequest): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${api.defaults.baseURL}/ai/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blogosphere_token')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate content');
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                yield parsed.content;
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error: any) {
      console.error('AI Generate Content Error:', error);
      throw error;
    }
  }

  /**
   * Summarize blog post content using AI
   * Returns an async generator that yields summary chunks
   */
  async *summarizeContent(request: SummarizeRequest): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${api.defaults.baseURL}/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blogosphere_token')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to summarize content');
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                yield parsed.content;
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error: any) {
      console.error('AI Summarize Error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
export default aiService;
