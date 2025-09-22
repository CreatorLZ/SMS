import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "superadmin" | "admin" | "teacher" | "student" | "parent";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  linkedStudentIds?: {
    _id: string;
    fullName: string;
    studentId: string;
  }[]; // Populated student data for parent users
  assignedClassId?: {
    _id: string;
    name: string;
  }; // Populated classroom data for teachers
  subjectSpecialization?: string;
  subjectSpecializations?: string[]; // For backward compatibility
  passportPhoto?: string;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UserResponse {
  success: boolean;
  data: User;
}

export const useUsersQuery = (filters?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<UsersResponse>({
    queryKey: ["users", filters],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams();
      if (filters?.role && filters.role !== "all")
        params.append("role", filters.role);
      if (filters?.status && filters.status !== "all")
        params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(`/admin/users?${params.toString()}`);
      return response.data as UsersResponse;
    },
  });
};

export const useUserQuery = (userId: string | null) => {
  return useQuery<UserResponse>({
    queryKey: ["user", userId],
    queryFn: async (): Promise<UserResponse> => {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data as UserResponse;
    },
    enabled: !!userId,
  });
};
