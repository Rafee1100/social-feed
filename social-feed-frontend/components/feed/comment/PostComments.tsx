"use client";

import type { Comment } from "@/types";
import { useComments } from "@/hooks/useComments";
import CommentComposer from "./CommentComposer";
import styles from "./PostComments.module.css";
import CommentItem from "./CommentItem";

type PostCommentsProps = {
  postId: string;
  open: boolean;
};

const PostComments = ({ postId, open }: PostCommentsProps) => {
  const { data, isLoading, isError } = useComments(postId, open);

  if (!open) return null;

  const comments: Comment[] = data ?? [];

  return (
    <>
      <div className={styles.commentArea}>
        <CommentComposer postId={postId} />
      </div>
      <div className={styles.thread}>
        {!isLoading && !isError && comments.length > 0 && (
          <>
            {comments.length > 1 && (
              <div className={styles.previousComment}>
                <button type="button" className={styles.previousCommentButton}>
                  View {comments.length - 1} previous comments
                </button>
              </div>
            )}

            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                postId={postId}
                comment={comment}
                depth={0}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default PostComments;
