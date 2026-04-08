'use client';

import useSWR from 'swr';
import { swrFetcher } from '@/lib/swr-fetcher';
import type { AssetListItem } from '@/types';

interface AssetsResponse {
  assets: AssetListItem[];
}

export function useAssets(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<AssetsResponse>(
    `/api/projects/${projectId}/assets`,
    swrFetcher
  );

  return {
    assets: data?.assets || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
