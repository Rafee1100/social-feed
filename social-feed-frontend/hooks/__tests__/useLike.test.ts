import { act } from "@testing-library/react";
import type { InfiniteData } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { toast } from "react-toastify";

import type { Comment, FeedPage, Post, User } from "@/types";
import { FEED_KEY } from "@/hooks/usePosts";
import { COMMENTS_KEY } from "@/hooks/useComments";
import { useCommentLike, usePostLike } from "@/hooks/useLike";
import { renderHookWithClient0, createTestQueryClient } from "@/test/utils";
import * as postServices from "@/services/postServices";
import * as commentServices from "@/services/commentServices";

vi.mock("@/services/postServices", () => ({
  likePost: vi.fn(),
  getPostLikes: vi.fn(),
  getPostComments: vi.fn(),
  addComment: vi.fn(),
  getPosts: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  getPost: vi.fn(),
}));

vi.mock("@/services/commentServices", () => ({
  likeComment: vi.fn(),
  getCommentLikes: vi.fn(),
  deleteComment: vi.fn(),
}));

const author: User = {
  id: "u1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
});

it("usePostLike applies optimistic toggle and then server result", async () => {
  vi.mocked(postServices.likePost).mockResolvedValueOnce({ isLiked: true, likeCount: 10 });

  const queryClient = createTestQueryClient();
  const postId = "p1";
  const feed: InfiniteData<FeedPage> = {
    pages: [
      {
        posts: [
          {
            id: postId,
            author,
            content: "hi",
            visibility: "public",
            likeCount: 9,
            commentCount: 0,
            likedByMe: false,
            createdAt: new Date().toISOString(),
          } satisfies Post,
        ],
        nextCursor: null,
        hasMore: false,
      },
    ],
    pageParams: [undefined],
  };
  queryClient.setQueryData(FEED_KEY, feed);

  const { result } = renderHookWithClient0(() => usePostLike(), queryClient);

  await act(async () => {
    await result.current.mutateAsync(postId);
  });

  const updated = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(updated?.pages[0]?.posts[0]?.likedByMe).toBe(true);
  expect(updated?.pages[0]?.posts[0]?.likeCount).toBe(10);
  expect(toast.error).not.toHaveBeenCalled();
});

it("useCommentLike updates a comment in the cache using the server result", async () => {
  vi.mocked(commentServices.likeComment).mockResolvedValueOnce({ isLiked: true, likeCount: 2 });

  const queryClient = createTestQueryClient();
  const postId = "p1";
  const commentId = "c1";
  const comments: Comment[] = [
    {
      id: commentId,
      author,
      content: "hey",
      likeCount: 1,
      likedByMe: false,
      createdAt: new Date().toISOString(),
      replies: [],
    },
  ];
  queryClient.setQueryData([...COMMENTS_KEY, postId], comments);

  const { result } = renderHookWithClient0(() => useCommentLike(postId), queryClient);

  await act(async () => {
    await result.current.mutateAsync(commentId);
  });

  const updated = queryClient.getQueryData<Comment[]>([COMMENTS_KEY[0], postId] as const);
  expect(updated?.[0]?.likedByMe).toBe(true);
  expect(updated?.[0]?.likeCount).toBe(2);
});

it("usePostLike rolls back optimistic update on error and shows toast", async () => {
  vi.mocked(postServices.likePost).mockRejectedValueOnce(new Error("fail"));

  const queryClient = createTestQueryClient();
  const postId = "p1";
  queryClient.setQueryData(FEED_KEY, {
    pages: [
      {
        posts: [
          {
            id: postId,
            author,
            content: "hi",
            visibility: "public",
            likeCount: 1,
            commentCount: 0,
            likedByMe: false,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
    ],
    pageParams: [undefined],
  } satisfies InfiniteData<FeedPage>);

  const { result } = renderHookWithClient0(() => usePostLike(), queryClient);

  await act(async () => {
    await expect(result.current.mutateAsync(postId)).rejects.toThrow();
  });

  const updated = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(updated?.pages[0]?.posts[0]?.likedByMe).toBe(false);
  expect(updated?.pages[0]?.posts[0]?.likeCount).toBe(1);
  expect(toast.error).toHaveBeenCalled();
});
