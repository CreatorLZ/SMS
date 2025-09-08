import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

interface AttendanceReport {
  totalDays: number;
  averageAttendance: number;
  attendanceTrend: number;
  topPerformers: Array<{ name: string; rate: number }>;
  lowPerformers: Array<{ name: string; rate: number }>;
}

interface StudentReport {
  totalStudents: number;
  activeStudents: number;
  newEnrollments: number;
  studentGrowth: number;
}

interface TeacherReport {
  totalTeachers: number;
  activeTeachers: number;
  averageWorkload: number;
  teacherUtilization: number;
}

interface ClassroomReport {
  totalClasses: number;
  averageClassSize: number;
  utilizationRate: number;
  scheduleEfficiency: number;
}

interface OverallReport {
  attendance: AttendanceReport;
  students: StudentReport;
  teachers: TeacherReport;
  classes: ClassroomReport;
}

export function useAttendanceReport(
  classroomId?: string,
  period: "week" | "month" | "quarter" | "year" = "month"
) {
  return useQuery({
    queryKey: ["reports", "attendance", classroomId, period],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (classroomId) params.append("classroomId", classroomId);

      const response = await api.get(`/api/admin/reports/attendance?${params}`);
      return response.data as AttendanceReport;
    },
    enabled: true,
  });
}

export function useStudentReport(
  classroomId?: string,
  period: "week" | "month" | "quarter" | "year" = "month"
) {
  return useQuery({
    queryKey: ["reports", "students", classroomId, period],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (classroomId) params.append("classroomId", classroomId);

      const response = await api.get(`/api/admin/reports/students?${params}`);
      return response.data as StudentReport;
    },
    enabled: true,
  });
}

export function useTeacherReport(
  period: "week" | "month" | "quarter" | "year" = "month"
) {
  return useQuery({
    queryKey: ["reports", "teachers", period],
    queryFn: async () => {
      const response = await api.get(
        `/api/admin/reports/teachers?period=${period}`
      );
      return response.data as TeacherReport;
    },
    enabled: true,
  });
}

export function useClassroomReport(
  classroomId?: string,
  period: "week" | "month" | "quarter" | "year" = "month"
) {
  return useQuery({
    queryKey: ["reports", "classrooms", classroomId, period],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (classroomId) params.append("classroomId", classroomId);

      const response = await api.get(`/api/admin/reports/classrooms?${params}`);
      return response.data as ClassroomReport;
    },
    enabled: true,
  });
}

export function useOverallReport(
  period: "week" | "month" | "quarter" | "year" = "month"
) {
  return useQuery({
    queryKey: ["reports", "overall", period],
    queryFn: async () => {
      const response = await api.get(
        `/api/admin/reports/overall?period=${period}`
      );
      return response.data as OverallReport;
    },
    enabled: true,
  });
}
