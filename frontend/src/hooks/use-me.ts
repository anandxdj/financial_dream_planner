"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/api";
import { getMe } from "@/services/auth.service";

import type { User } from "@/types/auth";

export const DEFAULT_USER: User = {
  id: "73b1fdfb-0a47-4e07-a7a9-fa28b08f5a5f",
  email: "testuser@example.com",
  displayName: "Test User",
  avatarUrl: null,
  status: "active",
  emailVerifiedAt: new Date().toISOString(),
  roles: ["owner"],
};

export function useMe() {
  const query = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: getMe,
    retry: false,
  });

  return {
    ...query,
    data: query.data ?? DEFAULT_USER,
  };
}
