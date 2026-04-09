'use client';

import useSWR from 'swr';
import { useAuth } from '@/components/auth-provider';
import { swrFetcher } from '@/lib/swr-fetcher';
import type { AssetListItem } from '@/types';

interface AssetsResponse {
  assets: AssetListItem[];
}

export function useAssets(projectId: string) {
  const { token } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<AssetsResponse>(
    token ? `/api/projects/${projectId}/assets` : null,
    swrFetcher
  );

  return {
    assets: data?.assets || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
