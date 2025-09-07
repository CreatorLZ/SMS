import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface AssignStudentsData {
  studentIds: string[];
}

export const useAssignStudentsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: AssignStudentsData;
    }) => {
      const response = await api.post(
        `/admin/classrooms/${classroomId}/students`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });
};
