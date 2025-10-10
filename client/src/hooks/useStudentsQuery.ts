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
  relationshipToStudent?:
    | "Father"
    | "Mother"
    | "Guardian"
    | "Uncle"
    | "Aunt"
    | "Grandparent"
    | "Other";
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
