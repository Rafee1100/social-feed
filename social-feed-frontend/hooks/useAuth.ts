"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import * as authService from "@/services/authServices";
import type { LoginPayload, RegisterUserPayload } from "../types";

export const AUTH_KEY = ["me"] as const;

export const useAuth = () => {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  const query = useQuery({
    queryKey: AUTH_KEY,
    queryFn: authService.getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data?.user) {
      setUser(query.data.user);
    } else if (query.isError) {
      setLoading(false);
    }
  }, [query.data, query.isError, setLoading, setUser]);

  return { user, isLoading };
};

export const useLogin = () => {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(AUTH_KEY, { user: data.user });
      router.push("/feed");
    },
  });
};

export const useRegister = () => {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterUserPayload) => authService.registerUser(payload),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(AUTH_KEY, { user: data.user });
      router.push("/feed");
    },
  });
};

export const useLogout = () => {
  const { clearUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      router.push("/login");
    },
  });
};
