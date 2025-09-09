import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export const useRemoveStudentFromClassroom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      studentId,
    }: {
      classroomId: string;
      studentId: string;
    }) => {
      const response = await api.delete(
        `/admin/classrooms/${classroomId}/students/${studentId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate classroom queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      // Invalidate student queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // Invalidate attendance data since removing a student affects attendance
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
    },
    onError: (error: any) => {
      console.error("Failed to remove student from classroom:", error);
    },
  });
};
