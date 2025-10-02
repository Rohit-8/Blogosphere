import api from './api';
import { BlogPost, CreatePostData, UpdatePostData, PostsResponse } from '../types';

export const postsService = {
  // Get all posts with pagination and filters
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    author?: string;
    tag?: string;
  }): Promise<PostsResponse> => {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  // Get single post by ID
  getPost: async (postId: string): Promise<BlogPost> => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // Create new post
  createPost: async (postData: CreatePostData): Promise<BlogPost> => {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  // Update existing post
  updatePost: async (postId: string, postData: UpdatePostData): Promise<BlogPost> => {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  },

  // Delete post
  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  // Get user's posts
  getUserPosts: async (userId: string, includeUnpublished = false): Promise<{ posts: BlogPost[] }> => {
    const response = await api.get(`/posts/user/${userId}`, {
      params: { includeUnpublished }
    });
    return response.data;
  },

  // Get current user's all posts (both drafts and published)
  getMyPosts: async (): Promise<{ data: { posts: BlogPost[] } }> => {
    const response = await api.get('/posts/my-posts');
    return response.data;
  },

  // Get current user's draft posts
  getMyDrafts: async (): Promise<{ data: { posts: BlogPost[] } }> => {
    const response = await api.get('/posts/my-drafts');
    return response.data;
  },

  // Publish a draft post
  publishPost: async (postId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/posts/${postId}/publish`);
    return response.data;
  },

  // Like/Unlike post
  toggleLike: async (postId: string): Promise<{ liked: boolean; message: string }> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  }
};