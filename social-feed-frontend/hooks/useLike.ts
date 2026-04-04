import {
  useMutation,
  useQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import * as commentServices from "@/services/commentServices";
import * as postServices from "@/services/postServices";
import type { FeedPage, Comment, User } from "../types";
import { FEED_KEY } from "./usePosts";
import { COMMENTS_KEY } from "./useComments";

const LIKE_STALE_TIME_MS = 30 * 1000;

const toggleLike = (likedByMe: boolean, likeCount: number) => ({
  likedByMe: !likedByMe,
  likeCount: likedByMe ? likeCount - 1 : likeCount + 1,
});

const updateCommentLikes = (comments: Comment[], targetId: string) => {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return {
        ...comment,
        ...toggleLike(comment.likedByMe, comment.likeCount),
      };
    }
    return {
      ...comment,
      replies: (comment.replies ?? []).map((reply) =>
        reply.id === targetId
          ? { ...reply, ...toggleLike(reply.likedByMe, reply.likeCount) }
          : reply,
      ),
    };
  });
};

export const usePostLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postServices.likePost(postId),

    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: FEED_KEY });
      const previousFeed =
        queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);

      queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) =>
              post.id === postId
                ? { ...post, ...toggleLike(post.likedByMe, post.likeCount) }
                : post,
            ),
          })),
        };
      });

      return { previousFeed };
    },

    onError: (_err, _postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(FEED_KEY, context.previousFeed);
      }
    },
  });
};

export const useCommentLike = (postId: string) => {
  const queryClient = useQueryClient();
  const commentsKey = [COMMENTS_KEY[0], postId] as const;

  return useMutation({
    mutationFn: (commentId: string) => commentServices.likeComment(commentId),

    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const previousComments = queryClient.getQueryData(commentsKey);

      queryClient.setQueryData<Comment[]>(commentsKey, (old) => {
        if (!old) return old;
        return updateCommentLikes(old, commentId);
      });

      return { previousComments };
    },

    onError: (_err, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsKey, context.previousComments);
      }
    },
  });
};

export const usePostLikedBy = (postId: string, enabled: boolean) => {
  return useQuery<User[]>({
    queryKey: ["post-likes", postId],
    queryFn: async () => {
      const { data } = await postServices.getPostLikes(postId);
      return data.likes ?? data;
    },
    enabled,
    staleTime: LIKE_STALE_TIME_MS,
  });
};

export const useCommentLikedBy = (commentId: string, enabled: boolean) => {
  return useQuery<User[]>({
    queryKey: ["comment-likes", commentId],
    queryFn: async () => {
      const { data } = await commentServices.getCommentLikes(commentId);
      return data.likes ?? data;
    },
    enabled,
    staleTime: LIKE_STALE_TIME_MS,
  });
};
