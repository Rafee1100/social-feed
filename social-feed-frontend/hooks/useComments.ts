import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as commentService from '@/services/commentServices';
import * as postServices from '@/services/postServices';
import type { Comment, CommentPayload } from '../types';

export const COMMENTS_KEY = ['comments'] as const;

export const useComments = (postId: string, enabled: boolean) => {
  return useQuery<Comment[]>({
    queryKey: [...COMMENTS_KEY, postId],
    queryFn: async () => {
      const { data } = await postServices.getPostComments(postId);
      return data.comments ?? data;
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
      const { data } = await postServices.createPostComment(postId, payload);
      return data.comment ?? data;
    },

    onSuccess: (newComment: Comment) => {
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

      queryClient.setQueryData<Comment[]>(commentsKey, (old = []) =>
        old
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== commentId) ?? [],
          }))
      );

      return { previous };
    },

    onError: (_err, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentsKey, context.previous);
      }
      toast.error('Failed to delete comment.');
    },
  });
};
