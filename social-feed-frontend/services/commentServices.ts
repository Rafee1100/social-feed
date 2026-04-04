import http from "./httpServices";

const API_ENDPOINT = '/comments'

export const likeComment = (commentId: string) => {
  return http.patch(`${API_ENDPOINT}/${commentId}/like`);
}

export const getCommentLikes = (commentId: string) => {
  return http.get(`${API_ENDPOINT}/${commentId}/likes`);
}

export const deleteComment = (commentId: string) => {
  return http.delete(`${API_ENDPOINT}/${commentId}`);
}