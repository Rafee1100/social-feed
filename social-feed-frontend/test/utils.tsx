import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export const renderHookWithClient0 = <TResult,>(
  hook: () => TResult,
  queryClient: QueryClient = createTestQueryClient(),
) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const render = renderHook(hook, { wrapper });
  return { ...render, queryClient };
};

export const renderHookWithClient = <TProps, TResult,>(
  hook: (props: TProps) => TResult,
  props: TProps,
  queryClient: QueryClient = createTestQueryClient(),
) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const render = renderHook(hook, { wrapper, initialProps: props });
  return { ...render, queryClient };
};
