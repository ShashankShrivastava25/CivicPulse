'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { authService } from '@/services/authService';
import type { User } from '@/types';

export function useAuth() {
  const qc = useQueryClient();
  const q = useQuery<User | null>({
    queryKey: ['me'], staleTime: 60_000, retry: false,
    queryFn: async () => {
      try { return await authService.me(); }
      catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
    },
  });
  return {
    user: q.data ?? null, isLoading: q.isLoading, error: q.error as Error | null, refetch: q.refetch,
    setUser: (u: User | null) => qc.setQueryData(['me'], u),
  };
}
