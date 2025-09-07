import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface UpdateStudentData {
  fullName: string;
  studentId: string;
  currentClass: string;
  parentId?: string;
}

export const useUpdateStudentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStudentData;
    }) => {
      const response = await api.put(`/admin/students/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
