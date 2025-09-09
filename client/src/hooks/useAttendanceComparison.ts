import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

interface AttendanceComparisonData {
  classroomId: string;
  currentMonth: {
    month: number;
    year: number;
    attendanceRate: number;
    totalDays: number;
  };
  previousMonth: {
    month: number;
    year: number;
    attendanceRate: number;
    totalDays: number;
  };
  comparison: {
    change: number;
    changePercent: number;
    trend: "up" | "down" | "stable";
  };
}

export function useAttendanceComparison(classroomId: string) {
  return useQuery<AttendanceComparisonData>({
    queryKey: ["attendance-comparison", classroomId],
    queryFn: async (): Promise<AttendanceComparisonData> => {
      const response = await api.get(
        `/admin/classrooms/${classroomId}/attendance-comparison`
      );
      return response.data as AttendanceComparisonData;
    },
    enabled: !!classroomId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
