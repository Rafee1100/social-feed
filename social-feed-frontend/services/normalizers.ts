import type { Comment, Post, User } from "../types";

export type ApiUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
};

export type ApiPost = {
  _id: string;
  author: ApiUser;
  content?: string;
  text?: string;
  imageUrl?: string | null;
  visibility: "public" | "private";
  likeCount?: number;
  isLiked?: boolean;
  commentCount?: number;
  createdAt: string;
};

export type ApiComment = {
  _id: string;
  author: ApiUser;
  content?: string;
  text?: string;
  likeCount?: number;
  isLiked?: boolean;
  createdAt: string;
  replies?: ApiComment[];
  parentComment?: string | null;
};

export const mapToUserModel = (user: ApiUser): User => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatarUrl: user.avatarUrl,
});

export const mapToPostModel = (post: ApiPost): Post => ({
  id: post._id,
  author: mapToUserModel(post.author),
  content: post.content ?? post.text ?? "",
  imageUrl: post.imageUrl ?? undefined,
  visibility: post.visibility,
  likeCount: post.likeCount ?? 0,
  commentCount: post.commentCount ?? 0,
  likedByMe: post.isLiked ?? false,
  createdAt: post.createdAt,
});

export const mapToCommentModel = (comment: ApiComment): Comment => ({
  id: comment._id,
  author: mapToUserModel(comment.author),
  content: comment.content ?? comment.text ?? "",
  likeCount: comment.likeCount ?? 0,
  likedByMe: comment.isLiked ?? false,
  createdAt: comment.createdAt,
  replies: comment.replies?.map(mapToCommentModel) ?? [],
  parentCommentId: comment.parentComment ?? undefined,
});
