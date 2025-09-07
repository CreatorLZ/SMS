import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export interface AuditLog {
  _id: string;
  userId: User | string;
  actionType: string;
  description: string;
  targetId?: string;
  timestamp: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useAuditLogsQuery = (
  search?: string,
  userId?: string,
  actionType?: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 10
) => {
  return useQuery<AuditLogsResponse>({
    queryKey: [
      "audit-logs",
      search,
      userId,
      actionType,
      startDate,
      endDate,
      page,
      limit,
    ],
    queryFn: async (): Promise<AuditLogsResponse> => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (userId) params.append("userId", userId);
      if (actionType) params.append("actionType", actionType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get(`/admin/logs?${params.toString()}`);
      return response.data as AuditLogsResponse;
    },
  });
};

export function useFetchAuditLogs() {
  return async () => {
    const res = await api.get("/admin/logs");
    return res.data;
  };
}
