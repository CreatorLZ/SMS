import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
  } | null;
}

interface RecentActivityData {
  classroomId: string;
  activities: ActivityItem[];
  total: number;
}

export function useRecentActivity(classroomId: string, limit: number = 10) {
  return useQuery<RecentActivityData>({
    queryKey: ["recent-activity", classroomId, limit],
    queryFn: async (): Promise<RecentActivityData> => {
      const response = await api.get(
        `/admin/classrooms/${classroomId}/recent-activity?limit=${limit}`
      );
      return response.data as RecentActivityData;
    },
    enabled: !!classroomId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
