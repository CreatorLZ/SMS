import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateTeacherData {
  name: string;
  email: string;
  password: string;
  subjectSpecialization?: string;
  assignedClassId?: string;
}

export const useCreateTeacherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherData: CreateTeacherData) => {
      const response = await api.post("/admin/teachers", teacherData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });
};
