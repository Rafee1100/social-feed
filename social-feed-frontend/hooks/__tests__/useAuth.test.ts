import { act, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { toast } from "react-toastify";

import { renderHookWithClient0 } from "@/test/utils";
import { useAuthStore } from "@/store/authStore";
import { useAuth, useLogin, useLogout, useRegister } from "@/hooks/useAuth";
import * as authService from "@/services/authServices";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/services/authServices", () => ({
  login: vi.fn(),
  registerUser: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  getMe: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, isLoading: false });
});

it("useAuth sets user from getMe result", async () => {
  vi.mocked(authService.getMe).mockResolvedValueOnce({
    user: { id: "u1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
  });

  renderHookWithClient0(() => useAuth());

  await waitFor(() => {
    expect(useAuthStore.getState().user?.id).toBe("u1");
  });
});

it("useLogin sets the user, shows success toast, and redirects to /feed", async () => {
  vi.mocked(authService.login).mockResolvedValueOnce({
    message: "ok",
    user: {
      id: "u1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    },
  });

  const { result } = renderHookWithClient0(() => useLogin());

  await act(async () => {
    await result.current.mutateAsync({ email: "ada@example.com", password: "pass" });
  });

  expect(useAuthStore.getState().user?.id).toBe("u1");
  expect(toast.success).toHaveBeenCalled();
  expect(pushMock).toHaveBeenCalledWith("/feed");
});

it("useRegister sets the user and redirects to /feed", async () => {
  vi.mocked(authService.registerUser).mockResolvedValueOnce({
    message: "ok",
    user: {
      id: "u2",
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
    },
  });

  const { result } = renderHookWithClient0(() => useRegister());

  await act(async () => {
    await result.current.mutateAsync({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      password: "pass",
    });
  });

  expect(useAuthStore.getState().user?.id).toBe("u2");
  expect(pushMock).toHaveBeenCalledWith("/feed");
});

it("useLogout clears user and redirects to /auth/login", async () => {
  vi.mocked(authService.logout).mockResolvedValueOnce({ message: "ok" });
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    },
    isLoading: false,
  });

  const { result } = renderHookWithClient0(() => useLogout());

  await act(async () => {
    await result.current.mutateAsync();
  });

  expect(useAuthStore.getState().user).toBeNull();
  expect(pushMock).toHaveBeenCalledWith("/auth/login");
  expect(toast.success).toHaveBeenCalled();
});
