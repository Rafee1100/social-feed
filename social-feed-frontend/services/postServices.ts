import http from "./httpServices";
import type {
  Comment,
  CommentPayload,
  FeedPage,
  LikeToggleResponse,
  Post,
  PostPayload,
  User,
} from "../types";
import {
  normalizeComment,
  normalizePost,
  normalizeUser,
  type ApiComment,
  type ApiPost,
  type ApiUser,
} from "./normalizers";

const API_ENDPOINT = "/posts";

type FeedApiResponse = { posts: ApiPost[]; nextCursor: string | null; hasMore: boolean };
type PostApiResponse = { post: ApiPost };
type CommentsApiResponse = { comments: ApiComment[] };
type CommentApiResponse = { comment: ApiComment };
type LikesApiResponse = { likes: ApiUser[] };

export const getPosts = async (cursor?: string): Promise<FeedPage> => {
  const data = await http.get<FeedApiResponse>(API_ENDPOINT, {
    params: cursor ? { cursor } : undefined,
  });

  return {
    posts: data.posts.map(normalizePost),
    nextCursor: data.nextCursor,
    hasMore: data.hasMore,
  };
};

export const createPost = async (postData: PostPayload): Promise<Post> => {
  const formData = new FormData();
  formData.append("content", postData.content);
  formData.append("visibility", postData.visibility);
  if (postData.image) {
    formData.append("image", postData.image);
  }

  const data = await http.post<PostApiResponse, FormData>(API_ENDPOINT, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return normalizePost(data.post);
};

export const deletePost = (postId: string) =>
  http.delete<{ message: string }>(`${API_ENDPOINT}/${postId}`);

export const getPost = async (postId: string): Promise<Post> => {
  const data = await http.get<PostApiResponse>(`${API_ENDPOINT}/${postId}`);
  return normalizePost(data.post);
};

export const getPostComments = async (postId: string): Promise<Comment[]> => {
  const data = await http.get<CommentsApiResponse>(`${API_ENDPOINT}/${postId}/comments`);
  return data.comments.map(normalizeComment);
};

export const createPostComment = async (
  postId: string,
  commentData: CommentPayload
): Promise<Comment> => {
  const data = await http.post<CommentApiResponse, CommentPayload>(
    `${API_ENDPOINT}/${postId}/comments`,
    commentData
  );
  return normalizeComment(data.comment);
};

export const getPostLikes = async (postId: string): Promise<User[]> => {
  const data = await http.get<LikesApiResponse>(`${API_ENDPOINT}/${postId}/likes`);
  return data.likes.map(normalizeUser);
};

export const likePost = (postId: string): Promise<LikeToggleResponse> =>
  http.patch<LikeToggleResponse>(`${API_ENDPOINT}/${postId}/like`);
