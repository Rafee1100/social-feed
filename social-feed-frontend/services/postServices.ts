import http from "./httpServices";

const API_ENDPOINT = "/posts";

export type PostPayload = {
  content: string;
  visibility: string;
  image: string | null;
};

export type CommentPayload = {
  content: string;
  parentComment?: string;
};

export const getPosts = () => {
  return http.get(`${API_ENDPOINT}`);
};

export const createPost = (postData: PostPayload) => {
  return http.post(`${API_ENDPOINT}`, postData);
};

export const deletePost = (postId: string) => {
  return http.delete(`${API_ENDPOINT}/${postId}`);
};

export const getPost = (postId: string) => {
  return http.get(`${API_ENDPOINT}/${postId}`);
};

export const getPostComments = (postId: string) => {
  return http.get(`${API_ENDPOINT}/${postId}/comments`);
};

export const createPostComment = (postId: string, commentData: CommentPayload) => {
  return http.post(`${API_ENDPOINT}/${postId}/comments`, commentData);
}

export const getPostLikes = (postId: string) => {
  return http.get(`${API_ENDPOINT}/${postId}/likes`);
}

export const likePost = (postId: string) => {
  return http.patch(`${API_ENDPOINT}/${postId}/like`);
}
