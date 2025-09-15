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

export interface StudentAttendanceRecord {
  _id: string;
  classroomId: string;
  classroomName?: string;
  date: string;
  status: "present" | "absent" | "late";
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAttendanceResponse {
  attendance: StudentAttendanceRecord[];
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
      const response = await api.post(`/admin/attendance/mark`, {
        classroomId,
        date,
        records,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch classroom data
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      // Invalidate all attendance data
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      // Invalidate attendance history
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
    },
  });
}

export function useGetClassAttendance(
  classroomId: string,
  date: string,
  debug = false
) {
  return useQuery({
    queryKey: ["attendance", "class", classroomId, date],
    queryFn: async (): Promise<AttendanceResponse | { message: string }> => {
      // 🔧 Enhanced validation and debugging
      if (!classroomId || !date) {
        console.warn("useGetClassAttendance: Missing required parameters", {
          classroomId,
          date,
          hasClassroomId: !!classroomId,
          hasDate: !!date,
        });
        throw new Error("Missing classroomId or date parameter");
      }

      if (debug) {
        console.log("Fetching attendance:", { classroomId, date });
      }

      try {
        const response = await api.get(
          `/admin/attendance/class/${classroomId}/${date}`
        );

        // Handle the case where attendance doesn't exist for the date
        if (
          response.status === 200 &&
          (response.data as any)?.message &&
          !(response.data as any)?.records
        ) {
          if (debug) {
            console.log("No attendance found for date:", { classroomId, date });
          }
          // Return a consistent structure for "no attendance" case
          return { message: (response.data as any).message };
        }

        if (debug) {
          console.log("Attendance fetch successful:", {
            status: response.status,
            dataKeys: response.data ? Object.keys(response.data) : [],
            hasRecords: !!(response.data as any)?.records?.length,
            recordsCount: (response.data as any)?.records?.length ?? 0,
          });
        }

        return response.data as AttendanceResponse;
      } catch (error: any) {
        console.error("Attendance fetch failed:", {
          classroomId,
          date,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });

        // Re-throw with more context
        throw new Error(
          `Failed to fetch attendance: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    },
    enabled: !!classroomId && !!date,
    retry: (failureCount, error) => {
      // Don't retry on 404 (attendance doesn't exist) or 403 (unauthorized)
      if (error?.message?.includes("404") || error?.message?.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useGetStudentAttendance(
  studentId: string,
  filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: ["attendance", "student", studentId, filters],
    queryFn: async (): Promise<StudentAttendanceResponse> => {
      const response = await api.get(`/admin/attendance/student/${studentId}`, {
        params: filters,
      });
      return response.data as StudentAttendanceResponse;
    },
    enabled: !!studentId,
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attendanceId,
      records,
    }: {
      attendanceId: string;
      records: AttendanceRecord[];
    }) => {
      const response = await api.put(
        `/admin/attendance/update/${attendanceId}`,
        {
          records,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all attendance data
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      // Invalidate attendance history
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
    },
  });
}

export function useGetAttendanceHistory(filters?: {
  classroomId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["attendance-history", filters],
    queryFn: async (): Promise<AttendanceHistoryResponse> => {
      try {
        const response = await api.get("/admin/attendance", {
          params: filters,
        });
        return response.data as AttendanceHistoryResponse;
      } catch (error) {
        console.error("Error fetching attendance history:", {
          filters,
          error,
        });
        const normalizedError =
          error instanceof Error ? error : new Error(String(error));
        throw normalizedError;
      }
    },
    enabled: !!filters?.classroomId, // Only run query if classroomId is provided
  });
}
