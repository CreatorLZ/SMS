import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface Student {
  _id: string;
  fullName: string;
  studentId: string;
  currentClass: string;
  classroomId?: string;
  status: "active" | "inactive" | "graduated" | "transferred";
  createdAt: string;
  updatedAt?: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: Date | string;
  address?: string;
  location?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  relationshipToStudent?: "Father" | "Mother" | "Guardian";
  email?: string;
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  enrollmentDate?: Date | string;
  admissionDate?: Date | string;
  passportPhoto?: string;
}

export function useStudents(classroomId?: string) {
  return useQuery({
    queryKey: ["students", classroomId],
    queryFn: async () => {
      const params = classroomId ? `?classroomId=${classroomId}` : "";
      const response = await api.get(`/admin/students${params}`);
      return response.data as Student[];
    },
    enabled: true,
  });
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const response = await api.get(`/admin/students/${studentId}`);
      return response.data as Student;
    },
    enabled: !!studentId,
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      data,
    }: {
      studentId: string;
      data: Partial<Student>;
    }) => {
      const response = await api.put(`/admin/students/${studentId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
  });
}

export function useStudentAttendance(
  studentId: string,
  period: "week" | "month" | "quarter" | "year" = "month"
) {
  return useQuery({
    queryKey: ["student-attendance", studentId, period],
    queryFn: async () => {
      const response = await api.get(
        `/admin/attendance?studentId=${studentId}&period=${period}`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
}
