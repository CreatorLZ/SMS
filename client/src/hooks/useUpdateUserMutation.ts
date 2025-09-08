import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  linkedStudentIds?: string[];
  subjectSpecialization?: string;
  assignedClassId?: string;
}

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await api.patch(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
