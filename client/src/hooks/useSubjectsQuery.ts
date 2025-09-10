import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export interface Subject {
  _id: string;
  name: string;
  category:
    | "Core"
    | "Science"
    | "Humanities"
    | "Business"
    | "Trade"
    | "Optional";
  level: "Primary" | "Junior Secondary" | "Senior Secondary";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectsQueryParams {
  category?: string;
  level?: string;
  isActive?: boolean;
  search?: string;
}

export const useSubjectsQuery = (params?: SubjectsQueryParams) => {
  return useQuery({
    queryKey: ["subjects", params],
    queryFn: async () => {
      const response = await api.get("/admin/subjects", { params });
      return response.data as Subject[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubjectByIdQuery = (id: string) => {
  return useQuery({
    queryKey: ["subjects", id],
    queryFn: async () => {
      const response = await api.get(`/admin/subjects/${id}`);
      return response.data as Subject;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
