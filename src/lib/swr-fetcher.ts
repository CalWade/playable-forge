import { api } from '@/lib/api-client';

/**
 * SWR fetcher that uses the centralized API client.
 * Automatically includes auth headers.
 */
export const swrFetcher = <T = unknown>(url: string): Promise<T> => {
  if (typeof window !== 'undefined') {
    console.log('[swr-fetcher] fetching:', url);
  }
  return api.get<T>(url);
};
