import { beforeEach, expect, it } from "vitest";
import { useAuthStore, useUIStore } from "@/store/authStore";
import type { User } from "@/types";

const userA: User = {
  id: "u1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
};

const resetAuthStore = () => {
  useAuthStore.setState({ user: null, isLoading: true });
};

const resetUIStore = () => {
  useUIStore.setState({
    likesModal: { isOpen: false, target: null },
    expandedCommentPostId: null,
    imagePreviewUrl: null,
  });
};

beforeEach(() => {
  resetAuthStore();
  resetUIStore();
});

it("authStore: setUser sets user and marks loading false", () => {
  useAuthStore.getState().setUser(userA);
  expect(useAuthStore.getState().user).toEqual(userA);
  expect(useAuthStore.getState().isLoading).toBe(false);
});

it("authStore: clearUser clears user and marks loading false", () => {
  useAuthStore.setState({ user: userA, isLoading: true });
  useAuthStore.getState().clearUser();
  expect(useAuthStore.getState().user).toBeNull();
  expect(useAuthStore.getState().isLoading).toBe(false);
});

it("authStore: setLoading updates loading flag", () => {
  useAuthStore.getState().setLoading(false);
  expect(useAuthStore.getState().isLoading).toBe(false);
  useAuthStore.getState().setLoading(true);
  expect(useAuthStore.getState().isLoading).toBe(true);
});

it("uiStore: openLikesModal/closeLikesModal toggles modal state", () => {
  useUIStore.getState().openLikesModal({ id: "p1", type: "post" });
  expect(useUIStore.getState().likesModal.isOpen).toBe(true);
  expect(useUIStore.getState().likesModal.target).toEqual({ id: "p1", type: "post" });

  useUIStore.getState().closeLikesModal();
  expect(useUIStore.getState().likesModal.isOpen).toBe(false);
  expect(useUIStore.getState().likesModal.target).toBeNull();
});

it("uiStore: toggleComments toggles between post ids and null", () => {
  useUIStore.getState().toggleComments("p1");
  expect(useUIStore.getState().expandedCommentPostId).toBe("p1");

  useUIStore.getState().toggleComments("p2");
  expect(useUIStore.getState().expandedCommentPostId).toBe("p2");

  useUIStore.getState().toggleComments("p2");
  expect(useUIStore.getState().expandedCommentPostId).toBeNull();
});

it("uiStore: closeComments clears expandedCommentPostId", () => {
  useUIStore.setState({ expandedCommentPostId: "p1" });
  useUIStore.getState().closeComments();
  expect(useUIStore.getState().expandedCommentPostId).toBeNull();
});

it("uiStore: openImagePreview/closeImagePreview manages preview url", () => {
  useUIStore.getState().openImagePreview("https://example.com/a.png");
  expect(useUIStore.getState().imagePreviewUrl).toBe("https://example.com/a.png");
  useUIStore.getState().closeImagePreview();
  expect(useUIStore.getState().imagePreviewUrl).toBeNull();
});

