import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      date,
      records,
    }: {
      classroomId: string;
      date: string;
      records: AttendanceRecord[];
    }) => {
      const response = await api.post(`/admin/attendance/${classroomId}`, {
        date,
        records,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch classroom data
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      // Invalidate attendance data if we have attendance queries
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useGetAttendance() {
  const queryClient = useQueryClient();

  return async ({
    classroomId,
    date,
  }: {
    classroomId: string;
    date: string;
  }) => {
    return queryClient.fetchQuery({
      queryKey: ["attendance", classroomId, date],
      queryFn: async () => {
        const response = await api.get(`/admin/attendance/${classroomId}`, {
          params: { date },
        });
        return response.data;
      },
    });
  };
}

export function useGetAttendanceHistory() {
  const queryClient = useQueryClient();

  return async (filters: {
    classroomId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return queryClient.fetchQuery({
      queryKey: ["attendance-history", filters],
      queryFn: async () => {
        const response = await api.get("/admin/attendance", {
          params: filters,
        });
        return response.data;
      },
    });
  };
}
