import { QueryClient } from '@tanstack/react-query';

/**
 * Query Client Singleton
 *
 * Single instance của React Query client cho toàn bộ app.
 * Cấu hình default options cho caching và refetching.
 *
 * USAGE:
 * ```tsx
 * // In providers/query-provider.tsx
 * import { getQueryClient } from '@/lib/query-client';
 *
 * export function QueryProvider({ children }) {
 *   const queryClient = getQueryClient();
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       {children}
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */

let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          // Cache data for 1 minute
          staleTime: 60 * 1000,
          // Keep unused data in cache for 5 minutes
          gcTime: 5 * 60 * 1000,
          // Retry failed requests 1 time
          retry: 1,
          // Refetch on window focus (good for stale data)
          refetchOnWindowFocus: true,
          // Don't refetch on mount if data is fresh
          refetchOnMount: false,
        },
        mutations: {
          // Retry mutations 0 times (mutations should not auto-retry)
          retry: 0,
        },
      },
    });
  }
  return queryClientInstance;
}

/**
 * Reset query client (useful for testing or logout)
 */
export function resetQueryClient(): void {
  if (queryClientInstance) {
    queryClientInstance.clear();
  }
}
