import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface AddStudentsData {
  studentIds: string[];
}

export const useAddStudentsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: AddStudentsData;
    }) => {
      const response = await api.post(
        `/admin/classrooms/${classroomId}/students/add`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
