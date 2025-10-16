import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  subjectSpecializations?: string[];
  subjectSpecialization?: string; // Keep for backward compatibility
  assignedClasses?: {
    _id: string;
    name: string;
  }[];
  createdAt: string;
}

export const useTeachersQuery = () => {
  return useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: async (): Promise<Teacher[]> => {
      const response = await api.get("/admin/teachers");
      return response.data as Teacher[];
    },
  });
};
