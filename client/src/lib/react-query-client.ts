import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes (reduces API calls)
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache data for 10 minutes (gcTime in v4+, was cacheTime in v3)
      gcTime: 1000 * 60 * 10, // 10 minutes

      // Retry failed requests 2 times with exponential backoff
      retry: (failureCount, error) => {
        if (failureCount < 2 && !error?.message?.includes("404")) {
          return true;
        }
        return false;
      },

      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus for admin pages (improves UX)
      refetchOnWindowFocus: false,

      // Don't refetch on reconnect automatically
      refetchOnReconnect: true,

      // Show background refetches without loading states
      refetchOnMount: "always",
    },

    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Network mode for offline support
      networkMode: "online",
    },
  },
});
