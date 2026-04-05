import { act, waitFor } from "@testing-library/react";
import type { InfiniteData } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { toast } from "react-toastify";

import type { Comment, FeedPage, User } from "@/types";
import { FEED_KEY } from "@/hooks/usePosts";
import { COMMENTS_KEY, useComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { renderHookWithClient, renderHookWithClient0 } from "@/test/utils";
import * as postServices from "@/services/postServices";
import * as commentServices from "@/services/commentServices";

vi.mock("@/services/postServices", () => ({
  getPosts: vi.fn(),
  createPost: vi.fn(),
  deletePost: vi.fn(),
  updatePost: vi.fn(),
  getPost: vi.fn(),
  getPostComments: vi.fn(),
  addComment: vi.fn(),
  getPostLikes: vi.fn(),
  likePost: vi.fn(),
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

it("useComments fetches comments when enabled", async () => {
  const postId = "p1";
  const comments: Comment[] = [
    {
      id: "c1",
      author,
      content: "hello",
      likeCount: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
      replies: [],
    },
  ];
  vi.mocked(postServices.getPostComments).mockResolvedValueOnce(comments);

  const { result } = renderHookWithClient(
    ({ enabled }) => useComments(postId, enabled),
    { enabled: true },
  );

  await waitFor(() => {
    expect(result.current.data).toEqual(comments);
  });
});

it("useComments does not fetch when disabled", async () => {
  const postId = "p1";
  vi.mocked(postServices.getPostComments).mockResolvedValueOnce([]);

  renderHookWithClient(({ enabled }) => useComments(postId, enabled), { enabled: false });
  expect(postServices.getPostComments).not.toHaveBeenCalled();
});

it("useCreateComment bumps feed commentCount for a top-level comment", async () => {
  const postId = "p1";

  vi.mocked(postServices.addComment).mockResolvedValueOnce({
    id: "cNew",
    author,
    content: "new comment",
    likeCount: 0,
    likedByMe: false,
    createdAt: new Date().toISOString(),
    replies: [],
  });

  const { result, queryClient } = renderHookWithClient0(() => useCreateComment(postId));

  const feed: InfiniteData<FeedPage> = {
    pages: [
      {
        posts: [
          {
            id: postId,
            author,
            content: "post",
            visibility: "public",
            likeCount: 0,
            commentCount: 1,
            likedByMe: false,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
    ],
    pageParams: [undefined],
  };
  queryClient.setQueryData(FEED_KEY, feed);

  await act(async () => {
    await result.current.mutateAsync({ content: "new comment" });
  });

  const updated = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(updated?.pages[0]?.posts[0]?.commentCount).toBe(2);
  expect(toast.error).not.toHaveBeenCalled();
});

it("useCreateComment does not bump feed commentCount for a reply", async () => {
  const postId = "p1";
  vi.mocked(postServices.addComment).mockResolvedValueOnce({
    id: "cReply",
    author,
    content: "reply",
    likeCount: 0,
    likedByMe: false,
    createdAt: new Date().toISOString(),
    parentCommentId: "c1",
    replies: [],
  });

  const { result, queryClient } = renderHookWithClient0(() => useCreateComment(postId));

  const feed: InfiniteData<FeedPage> = {
    pages: [
      {
        posts: [
          {
            id: postId,
            author,
            content: "post",
            visibility: "public",
            likeCount: 0,
            commentCount: 5,
            likedByMe: false,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
    ],
    pageParams: [undefined],
  };
  queryClient.setQueryData(FEED_KEY, feed);

  await act(async () => {
    await result.current.mutateAsync({ content: "reply", parentComment: "c1" });
  });

  const updated = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(updated?.pages[0]?.posts[0]?.commentCount).toBe(5);
});

it("useCreateComment shows error toast on failure", async () => {
  const postId = "p1";
  vi.mocked(postServices.addComment).mockRejectedValueOnce(new Error("fail"));

  const { result } = renderHookWithClient0(() => useCreateComment(postId));
  await act(async () => {
    await expect(result.current.mutateAsync({ content: "x" })).rejects.toThrow();
  });
  expect(toast.error).toHaveBeenCalled();
});

it("useDeleteComment optimistically removes comment and bumps feed count; rolls back on error", async () => {
  const postId = "p1";
  vi.mocked(commentServices.deleteComment).mockRejectedValueOnce(new Error("no"));

  const { result, queryClient } = renderHookWithClient0(() => useDeleteComment(postId));

  const feed: InfiniteData<FeedPage> = {
    pages: [
      {
        posts: [
          {
            id: postId,
            author,
            content: "post",
            visibility: "public",
            likeCount: 0,
            commentCount: 1,
            likedByMe: false,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
    ],
    pageParams: [undefined],
  };
  queryClient.setQueryData(FEED_KEY, feed);

  const comments: Comment[] = [
    {
      id: "c1",
      author,
      content: "top",
      likeCount: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
      replies: [],
    },
  ];
  queryClient.setQueryData([...COMMENTS_KEY, postId], comments);

  await act(async () => {
    await expect(result.current.mutateAsync("c1")).rejects.toThrow();
  });

  const after = queryClient.getQueryData<Comment[]>([COMMENTS_KEY[0], postId] as const);
  expect(after?.length).toBe(1);
  const updatedFeed = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(updatedFeed?.pages[0]?.posts[0]?.commentCount).toBe(1);
  expect(toast.error).toHaveBeenCalled();
});
