"use client";

import type { User } from "@/types";
import { ThumbsUp } from "lucide-react";
import styles from "./PostLikesModal.module.css";

type LikesModalProps = {
  open: boolean;
  onClose: () => void;
  users: User[];
  isLoading: boolean;
  error: string | null;
  ariaLabel?: string;
};

const LikesModal = ({
  open,
  onClose,
  users,
  isLoading,
  error,
  ariaLabel = "Likes",
}: LikesModalProps) => {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Likes</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {isLoading && <div className={styles.state}>Loading...</div>}
          {!!error && <div className={styles.state}>{error}</div>}
          {!isLoading && !error && users.length === 0 && (
            <div className={styles.state}>No likes yet.</div>
          )}

          {!isLoading && !error && users.length > 0 && (
            <ul className={styles.list}>
              {users.map((user) => {
                const fullName = `${user.firstName} ${user.lastName}`.trim();
                return (
                  <li className={styles.item} key={user.id}>
                    <ThumbsUp color="#0d6efd" height={16} className={styles.likeIcon} />
                    <span className={styles.name}>{fullName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;

