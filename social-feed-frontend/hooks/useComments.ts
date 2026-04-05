import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as commentService from '@/services/commentServices';
import * as postServices from '@/services/postServices';
import type { Comment, CommentPayload } from '../types';
import type { FeedPage } from '../types';
import type { InfiniteData } from '@tanstack/react-query';
import { FEED_KEY } from './usePosts';

export const COMMENTS_KEY = ['comments'] as const;

const postCommentCount = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  delta: number
) => {
  queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_KEY, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        posts: page.posts.map((post) =>
          post.id === postId
            ? { ...post, commentCount: Math.max(0, post.commentCount + delta) }
            : post
        ),
      })),
    };
  });
};

export const useComments = (postId: string, enabled: boolean) => {
  return useQuery<Comment[]>({
    queryKey: [...COMMENTS_KEY, postId],
    queryFn: async () => {
      return postServices.getPostComments(postId);
    },
    enabled,
    staleTime: 30 * 1000,
  });
};

export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();
  const commentsKey = [...COMMENTS_KEY, postId] as const;

  return useMutation({
    mutationFn: async (payload: CommentPayload) => {
      return postServices.addComment(postId, payload);
    },

    onSuccess: (newComment: Comment) => {
      
      if (!newComment.parentCommentId) {
        postCommentCount(queryClient, postId, 1);
      }
      queryClient.setQueryData<Comment[]>(commentsKey, (old = []) => {
        if (!newComment.replies && !('parentCommentId' in newComment)) {
          return [...old, newComment];
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: commentsKey });
    },

    onError: () => {
      toast.error('Failed to post comment. Please try again.');
    },
  });
};

export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();
  const commentsKey = [...COMMENTS_KEY, postId] as const;

  return useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),

    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const previous = queryClient.getQueryData<Comment[]>(commentsKey);

      
      const wasTopLevel = (previous ?? []).some((c) => c.id === commentId);
      if (wasTopLevel) {
        postCommentCount(queryClient, postId, -1);
      }

      queryClient.setQueryData<Comment[]>(commentsKey, (old = []) =>
        old
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== commentId) ?? [],
          }))
      );

      return { previous, wasTopLevel };
    },

    onError: (_err, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentsKey, context.previous);
      }
      if (context?.wasTopLevel) {
        postCommentCount(queryClient, postId, 1);
      }
      toast.error('Failed to delete comment.');
    },
  });
};
