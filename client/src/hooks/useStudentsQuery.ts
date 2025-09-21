import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Keep for backward compatibility
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
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  enrollmentDate?: Date | string;
  admissionDate?: Date | string;
  passportPhoto?: string;
}

export interface StudentsResponse {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useStudentsQuery = (
  search?: string,
  classId?: string,
  page = 1,
  limit = 10
) => {
  return useQuery<StudentsResponse>({
    queryKey: ["students", search, classId, page, limit],
    queryFn: async (): Promise<StudentsResponse> => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (classId) params.append("classId", classId);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get(`/admin/students?${params.toString()}`);
      return response.data as StudentsResponse;
    },
  });
};
