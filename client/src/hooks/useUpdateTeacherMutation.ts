import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface UpdateTeacherData {
  name: string;
  email: string;
  subjectSpecializations?: string[];
  subjectSpecialization?: string; // Keep for backward compatibility
  assignedClassId?: string;
}

export const useUpdateTeacherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...teacherData
    }: { id: string } & UpdateTeacherData) => {
      const response = await api.put(`/admin/teachers/${id}`, teacherData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });
};
