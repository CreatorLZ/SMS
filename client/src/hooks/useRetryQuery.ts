import { useQuery, useQueryClient, QueryKey } from "@tanstack/react-query";
import { useCallback } from "react";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: (attemptIndex: number) => number;
  onRetry?: (failureCount: number, error: Error) => void;
}

export function useRetryQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    retryOptions?: RetryOptions;
  } = {}
) {
  const { retryOptions, ...queryOptions } = options;
  const { maxRetries = 3, retryDelay, onRetry } = retryOptions || {};

  return useQuery({
    queryKey,
    queryFn,
    retry: maxRetries,
    retryDelay:
      retryDelay ||
      ((attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)),
    ...queryOptions,
  });
}

// Hook for manual retry functionality
export function useManualRetry() {
  const queryClient = useQueryClient();

  const retryQuery = useCallback(
    (queryKey: QueryKey) => {
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  const retryAllQueries = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return { retryQuery, retryAllQueries };
}
