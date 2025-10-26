import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ParentDashboardData {
  parent: {
    name: string;
    email: string;
  };
  linkedStudents: {
    id: string;
    name: string;
    grade: string;
    gpa: number;
    attendance: number;
    status: "excellent" | "good" | "needs_attention" | "concerning";
  }[];
  notifications: {
    id: string;
    type: "grade" | "attendance" | "event";
    child: string;
    message: string;
    date: string;
    priority: "normal" | "warning";
  }[];
  upcomingEvents: {
    title: string;
    child: string;
    date: string;
    time: string;
    type: "meeting" | "event" | "academic";
  }[];
}

export const useParentDashboardQuery = () => {
  return useQuery<ParentDashboardData>({
    queryKey: ["parent-dashboard"],
    queryFn: async (): Promise<ParentDashboardData> => {
      const response = await api.get("/parent/dashboard");
      return response.data as ParentDashboardData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection after cache
    refetchOnWindowFocus: true, // Real-time feel when tab gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: (failureCount, error: any) => {
      // Retry up to 3 times with exponential backoff
      if (failureCount >= 3) return false;

      // Don't retry on validation errors (4xx)
      if (
        error?.response?.status &&
        error.response.status >= 400 &&
        error.response.status < 500
      ) {
        return false;
      }

      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
