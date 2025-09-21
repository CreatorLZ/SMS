import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateStudentData {
  firstName: string;
  lastName: string;
  studentId: string;
  currentClass: string;
  parentId?: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  location: string;
  parentName: string;
  parentPhone: string;
  relationshipToStudent: string;
  admissionDate: string;
}

export const useCreateStudentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentData) => {
      const response = await api.post("/admin/students", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all student queries with any parameters
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      console.error("Failed to create student:", error);
      // Don't show alert here - let the component handle it
    },
  });
};
