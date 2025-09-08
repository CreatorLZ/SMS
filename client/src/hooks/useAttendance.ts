import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
}

export interface AttendanceResponse {
  _id: string;
  classroomId: string;
  date: string;
  records: Array<{
    studentId: {
      _id: string;
      fullName: string;
      studentId: string;
    };
    status: "present" | "absent" | "late";
  }>;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceHistoryResponse {
  attendance: AttendanceResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  }): Promise<AttendanceResponse> => {
    return queryClient.fetchQuery({
      queryKey: ["attendance", classroomId, date],
      queryFn: async (): Promise<AttendanceResponse> => {
        const response = await api.get(`/admin/attendance/${classroomId}`, {
          params: { date },
        });
        return response.data as AttendanceResponse;
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
  }): Promise<AttendanceHistoryResponse> => {
    return queryClient.fetchQuery({
      queryKey: ["attendance-history", filters],
      queryFn: async (): Promise<AttendanceHistoryResponse> => {
        const response = await api.get("/admin/attendance", {
          params: filters,
        });
        return response.data as AttendanceHistoryResponse;
      },
    });
  };
}
