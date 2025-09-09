import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface RemoveStudentsData {
  studentIds: string[];
}

export const useRemoveStudentsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: RemoveStudentsData;
    }) => {
      const response = await api.post(
        `/admin/classrooms/${classroomId}/students/remove`,
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
