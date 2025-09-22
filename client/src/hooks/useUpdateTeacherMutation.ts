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
    onSuccess: (result, { id }) => {
      // Invalidate teacher-related queries
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });

      // Invalidate user-related queries since teachers are also users
      // This ensures ViewUserModal updates when teacher data changes
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] }); // Individual user cache
    },
  });
};
