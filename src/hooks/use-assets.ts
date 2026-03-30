'use client';

import useSWR from 'swr';
import { useAuth } from '@/components/auth-provider';

export function useAssets(projectId: string) {
  const { token } = useAuth();

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR(
    token ? `/api/projects/${projectId}/assets` : null,
    fetcher
  );

  return {
    assets: data?.assets || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
