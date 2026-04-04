export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export type Visibility = 'public' | 'private';

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  visibility: Visibility;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  replies?: Comment[];
  parentCommentId?: string;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface LikeToggleResponse {
  isLiked: boolean;
  likeCount: number;
}

export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}

export type LikeTarget = {
  id: string;
  type: 'post' | 'comment';
};

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface PostPayload {
  content: string;
  image?: File;
  visibility: Visibility;
}

export interface CommentPayload {
  content: string;
  parentComment?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface RefreshResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}
