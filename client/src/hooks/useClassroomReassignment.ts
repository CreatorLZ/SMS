import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface ReassignTeacherData {
  teacherId?: string;
}

export const useReassignTeacherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: ReassignTeacherData;
    }) => {
      const response = await api.put(
        `/admin/classrooms/${classroomId}/reassign-teacher`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate classroom-related queries
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });

      // Invalidate attendance queries since teacher changes affect attendance permissions
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};
