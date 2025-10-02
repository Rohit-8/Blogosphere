export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  status: 'draft' | 'published';
  published?: boolean; // Legacy field for backward compatibility
  authorId: string;
  authorName: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  views: number;
  likes: number;
  imageUrl?: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  excerpt?: string;
  tags: string[];
  category: string;
  status: 'draft' | 'published';
  imageUrl?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PostsResponse {
  posts: BlogPost[];
  pagination: PaginationInfo;
}

