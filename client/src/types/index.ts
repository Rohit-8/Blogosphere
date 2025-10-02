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
  published: boolean;
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
  published: boolean;
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

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, photoURL?: string) => Promise<void>;
}