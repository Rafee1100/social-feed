import http from "./httpServices";
import type { LikeToggleResponse, User } from "../types";
import { normalizeUser, type ApiUser } from "./normalizers";

const API_ENDPOINT = "/comments";

type LikesApiResponse = { likes: ApiUser[] };

type MessageResponse = { message: string };

export const likeComment = (commentId: string): Promise<LikeToggleResponse> =>
  http.patch<LikeToggleResponse>(`${API_ENDPOINT}/${commentId}/like`);

export const getCommentLikes = async (commentId: string): Promise<User[]> => {
  const data = await http.get<LikesApiResponse>(`${API_ENDPOINT}/${commentId}/likes`);
  return data.likes.map(normalizeUser);
};

export const deleteComment = (commentId: string): Promise<MessageResponse> =>
  http.delete<MessageResponse>(`${API_ENDPOINT}/${commentId}`);
