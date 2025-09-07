import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateClassroomData {
  name: string;
  teacherId: string;
}

export const useCreateClassroomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClassroomData) => {
      const response = await api.post("/admin/classrooms", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });
};
