"use client";

import { trpc } from "@/shared/api/trpc";
import { useMemo } from "react";
import type { LoginInput } from "@core/shared";

export const useAuth = () => {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
  } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data: any) => {
      utils.auth.me.setData(undefined, data.user);
    },
    onError: () => {
      // Intentionally suppressing login errors to prevent Next.js Error Overlay
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const isAuthenticated = useMemo(() => !!user, [user]);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login: (dto: LoginInput) => loginMutation.mutate(dto),
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
