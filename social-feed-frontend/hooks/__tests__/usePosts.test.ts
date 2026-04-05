import { act } from "@testing-library/react";
import type { InfiniteData } from "@tanstack/react-query";
import { expect, it, vi, beforeEach } from "vitest";
import { toast } from "react-toastify";

import type { FeedPage, Post, PostPayload, User } from "@/types";
import { FEED_KEY, useCreatePost, useDeletePost, useUpdatePost } from "@/hooks/usePosts";
import { renderHookWithClient0 } from "@/test/utils";
import * as postService from "@/services/postServices";

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

const author: User = {
  id: "u1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
};

const makePost = (id: string, overrides: Partial<Post> = {}): Post => ({
  id,
  author,
  content: `post-${id}`,
  visibility: "public",
  likeCount: 0,
  commentCount: 0,
  likedByMe: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const makeInfiniteFeed = (posts: Post[]): InfiniteData<FeedPage> => ({
  pages: [
    {
      posts,
      nextCursor: null,
      hasMore: false,
    },
  ],
  pageParams: [undefined],
});

beforeEach(() => {
  vi.clearAllMocks();
});

it("useCreatePost prepends the created post to the first feed page and shows success toast", async () => {
  const newPost = makePost("new");
  vi.mocked(postService.createPost).mockResolvedValueOnce(newPost);

  const { result, queryClient } = renderHookWithClient0(() => useCreatePost());
  queryClient.setQueryData(FEED_KEY, makeInfiniteFeed([makePost("old")]));

  const payload: PostPayload = { content: "hello", visibility: "public" };

  await act(async () => {
    await result.current.mutateAsync(payload);
  });

  const data = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(data?.pages[0]?.posts[0]?.id).toBe("new");
  expect(toast.success).toHaveBeenCalled();
});

it("useCreatePost works when feed cache is missing (still shows toast)", async () => {
  const newPost = makePost("new");
  vi.mocked(postService.createPost).mockResolvedValueOnce(newPost);

  const { result } = renderHookWithClient0(() => useCreatePost());

  await act(async () => {
    await result.current.mutateAsync({ content: "x", visibility: "public" });
  });

  expect(toast.success).toHaveBeenCalled();
});

it("useDeletePost rolls back optimistic update when delete fails and shows error toast", async () => {
  vi.mocked(postService.deletePost).mockRejectedValueOnce(new Error("boom"));

  const { result, queryClient } = renderHookWithClient0(() => useDeletePost());
  queryClient.setQueryData(FEED_KEY, makeInfiniteFeed([makePost("p1"), makePost("p2")]));

  await act(async () => {
    await expect(result.current.mutateAsync("p1")).rejects.toThrow();
  });

  const data = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(data?.pages[0]?.posts.map((p) => p.id)).toEqual(["p1", "p2"]);
  expect(toast.error).toHaveBeenCalled();
});

it("useUpdatePost applies optimistic update and rolls back on error", async () => {
  vi.mocked(postService.updatePost).mockRejectedValueOnce(new Error("fail"));

  const { result, queryClient } = renderHookWithClient0(() => useUpdatePost());
  queryClient.setQueryData(FEED_KEY, makeInfiniteFeed([makePost("p1", { content: "old" })]));

  await act(async () => {
    await expect(
      result.current.mutateAsync({ postId: "p1", payload: { content: "new", visibility: "public" } }),
    ).rejects.toThrow();
  });

  const data = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(data?.pages[0]?.posts[0]?.content).toBe("old");
  expect(toast.error).toHaveBeenCalled();
});

it("useUpdatePost replaces the post with server version and shows success toast", async () => {
  const serverPost = makePost("p1", { content: "server" });
  vi.mocked(postService.updatePost).mockResolvedValueOnce(serverPost);

  const { result, queryClient } = renderHookWithClient0(() => useUpdatePost());
  queryClient.setQueryData(FEED_KEY, makeInfiniteFeed([makePost("p1", { content: "old" })]));

  await act(async () => {
    await result.current.mutateAsync({ postId: "p1", payload: { content: "new", visibility: "public" } });
  });

  const data = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
  expect(data?.pages[0]?.posts[0]?.content).toBe("server");
  expect(toast.success).toHaveBeenCalled();
});
