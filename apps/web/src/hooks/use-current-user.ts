"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["me"],
    retry: false,
    queryFn: async () => {
      try {
        const data = await api.get<{ user: any }>("/api/auth/me");
        return data.user;
      } catch (err: any) {
        if (err?.status === 401) return null;
        throw err;
      }
    }
  });
};
