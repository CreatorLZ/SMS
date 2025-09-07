import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface ToggleStudentStatusData {
  isActive: boolean;
}

export const useToggleStudentStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ToggleStudentStatusData;
    }) => {
      const response = await api.patch(`/admin/students/${id}/status`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["students"] });

      // Snapshot the previous value
      const previousStudents = queryClient.getQueriesData({
        queryKey: ["students"],
      });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ["students"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          students: oldData.students?.map((student: any) =>
            student._id === id
              ? { ...student, status: data.isActive ? "active" : "inactive" }
              : student
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousStudents };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStudents) {
        context.previousStudents.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Failed to toggle student status:", err);
      // Don't show alert here - let the component handle it
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
