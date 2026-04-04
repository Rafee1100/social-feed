import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as postService from "@/services/postServices";
import type { FeedPage, PostPayload } from "../types";

export const FEED_KEY = ["feed"] as const;

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: FEED_KEY,
    queryFn: async ({ pageParam }) => {
      const { data } = await postService.getPosts(pageParam as string | undefined);
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FeedPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 30 * 1000,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PostPayload) => {
      const { data } = await postService.createPost(payload);
      return data.post ?? data;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_KEY, (old) => {
        if (!old) return old;
        if (!old.pages.length) return old;
        const updatedFirstPage: FeedPage = {
          ...old.pages[0],
          posts: [newPost, ...old.pages[0].posts],
        };
        return {
          ...old,
          pages: [updatedFirstPage, ...old.pages.slice(1)],
        };
      });
      toast.success("Post created!");
    },
    onError: () => {
      toast.error("Failed to create post. Please try again.");
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postService.deletePost(postId),

    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: FEED_KEY });
      const previous =
        queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);
      queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => p.id !== postId),
          })),
        };
      });

      return { previous };
    },

    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FEED_KEY, context.previous);
      }
      toast.error("Failed to delete post.");
    },

    onSuccess: () => {
      toast.success("Post deleted.");
    },
  });
};
