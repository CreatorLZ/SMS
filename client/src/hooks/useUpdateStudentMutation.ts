import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface UpdateStudentData {
  firstName: string;
  lastName: string;
  studentId: string;
  currentClass: string;
  parentId?: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  location: string;
  parentName: string;
  parentPhone: string;
  relationshipToStudent: string;
  admissionDate: string;
}

export const useUpdateStudentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStudentData;
    }) => {
      const response = await api.put(`/admin/students/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["students"] });

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: ["students"],
      });

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ["students"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          students: oldData.students.map((student: any) =>
            student._id === id
              ? {
                  ...student,
                  ...data,
                  fullName: `${data.firstName} ${data.lastName}`,
                  updatedAt: new Date().toISOString(),
                  isOptimistic: true, // Flag to identify optimistic updates for UI feedback
                }
              : student
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousQueries, id };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, rollback by restoring the previous queries
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Failed to update student after auto-retry:", err);
      // Error state will be handled by component for user feedback
    },
    onSuccess: (result: any, { id }) => {
      // Update the cache with the actual server response for consistency
      queryClient.setQueriesData({ queryKey: ["students"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          students: oldData.students.map((student: any) =>
            student._id === result._id
              ? { ...result, isOptimistic: false }
              : student
          ),
        };
      });

      // Invalidate students queries to ensure consistency across all filtered views
      queryClient.invalidateQueries({
        queryKey: ["students"],
        refetchType: "none", // Prevent automatic refetch since we updated optimistically
      });

      // Also invalidate individual student query so ViewStudentModal updates
      queryClient.invalidateQueries({
        queryKey: ["student", id],
        refetchType: "none",
      });

      // Invalidate the optimized studentsQuery as well
      queryClient.invalidateQueries({
        queryKey: ["studentsQuery"],
        refetchType: "none",
      });
    },
  });
};
