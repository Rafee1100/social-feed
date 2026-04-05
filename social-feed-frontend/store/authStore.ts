import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isLoading: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface LikesModalState {
  isOpen: boolean;
  target: { id: string; type: "post" | "comment" } | null;
}

interface UIState {
  likesModal: LikesModalState;
  openLikesModal: (target: { id: string; type: "post" | "comment" }) => void;
  closeLikesModal: () => void;
  expandedCommentPostId: string | null;
  toggleComments: (postId: string) => void;
  closeComments: () => void;

  imagePreviewUrl: string | null;
  openImagePreview: (url: string) => void;
  closeImagePreview: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  likesModal: { isOpen: false, target: null },

  openLikesModal: (target) => set({ likesModal: { isOpen: true, target } }),

  closeLikesModal: () => set({ likesModal: { isOpen: false, target: null } }),

  expandedCommentPostId: null,

  toggleComments: (postId) =>
    set((state) => ({
      expandedCommentPostId:
        state.expandedCommentPostId === postId ? null : postId,
    })),

  closeComments: () => set({ expandedCommentPostId: null }),

  imagePreviewUrl: null,
  openImagePreview: (url) => set({ imagePreviewUrl: url }),
  closeImagePreview: () => set({ imagePreviewUrl: null }),
}));
