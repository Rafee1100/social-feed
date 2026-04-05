"use client";

import type { Comment } from "@/types";
import styles from "./CommentItem.module.css";
import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCommentLike, useCommentLikedBy } from "@/hooks/useLike";
import Image from "next/image";
import Link from "next/link";
import { Heart, ThumbsUp } from "lucide-react";
import CommentComposer from "./CommentComposer";
import LikesModal from "../likes/LikesModal";

type CommentItemProps = {
  postId: string;
  comment: Comment;
  depth: 0 | 1;
};

function formatTimeStamp(createdAt: string) {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt;
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / (1000 * 60)));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const onActivate =
  (fn: () => void) =>
  (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

const CommentItem = ({ postId, comment, depth }: CommentItemProps) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const canReply = depth === 0;
  const commentLike = useCommentLike(postId);
  const likedByQuery = useCommentLikedBy(comment.id, likesOpen);

  const authorName = useMemo(
    () => `${comment.author.firstName} ${comment.author.lastName}`.trim(),
    [comment.author.firstName, comment.author.lastName]
  );
  const timeLabel = useMemo(() => formatTimeStamp(comment.createdAt), [comment.createdAt]);

  const toggleReply = () => setReplyOpen((v) => !v);
  const like = () => commentLike.mutate(comment.id);
  const openLikes = () => setLikesOpen(true);

  return (
    <div className={`${styles.root} ${depth === 1 ? styles.replyIndent : ""}`}>
      <div className={styles.commentMain}>
        <div className={styles.commentImage}>
          <Link href="#0" className={styles.commentImageLink} aria-label="View profile">
            <Image
              src="/assets/images/txt_img.png"
              alt=""
              width={20}
              height={20}
              className={styles.commentImageInner}
            />
          </Link>
        </div>

        <div className={styles.commentBody}>
          <div className={styles.commentDetails}>
            <div className={styles.commentDetailsTop}>
              <div className={styles.commentName}>
                <Link href="#0">
                  <h4 className={styles.commentNameTitle}>{authorName}</h4>
                </Link>
              </div>
            </div>

            <div className={styles.commentStatus}>
              <p className={styles.commentStatusText}>
                <span>{comment.content}</span>
              </p>
            </div>

            <button
              type="button"
              className={styles.totalReactions}
              onClick={openLikes}
              onKeyDown={onActivate(openLikes)}
              aria-label="View comment likes"
            >
              <div className={styles.totalReact}>
                <span className={styles.reactionLike}>
                  <ThumbsUp color="blue" height={15} />
                </span>
                <span className={styles.reactionHeart}>
                  <Heart color="red" height={15} />
                </span>
              </div>
              <span className={styles.total}>{comment.likeCount}</span>
            </button>

            <div className={styles.commentReply}>
              <div className={styles.commentReplyNum}>
                <ul className={styles.commentReplyList}>
                  <li>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-pressed={comment.likedByMe}
                      className={comment.likedByMe ? styles.replyActionActive : undefined}
                      onClick={like}
                      onKeyDown={onActivate(like)}
                    >
                      {comment.likedByMe ? "Liked." : "Like."}
                    </span>
                  </li>
                  <li>
                    {canReply ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={toggleReply}
                        onKeyDown={onActivate(toggleReply)}
                      >
                        Reply.
                      </span>
                    ) : (
                      <span>Reply.</span>
                    )}
                  </li>
                  <li>
                    <span>Share</span>
                  </li>
                  <li>
                    <span className={styles.timeLink}>.{timeLabel}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {canReply && replyOpen && (
            <CommentComposer
              postId={postId}
              parentCommentId={comment.id}
              placeholder="Write a comment"
              onSubmitted={() => setReplyOpen(false)}
            />
          )}

          {!!(comment.replies ?? []).length && (
            <div className={styles.replies}>
              {(comment.replies ?? []).map((reply) => (
                <CommentItem key={reply.id} postId={postId} comment={reply} depth={1} />
              ))}
            </div>
          )}
        </div>
      </div>

      <LikesModal
        open={likesOpen}
        onClose={() => setLikesOpen(false)}
        users={likedByQuery.data ?? []}
        isLoading={likedByQuery.isLoading}
        error={likedByQuery.error instanceof Error ? likedByQuery.error.message : null}
        ariaLabel="Comment likes"
      />
    </div>
  );
};

export default CommentItem;
