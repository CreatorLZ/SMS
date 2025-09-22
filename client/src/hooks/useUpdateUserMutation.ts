import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  phone?: string;
  linkedStudentIds?: string[];
  subjectSpecialization?: string;
  assignedClassId?: string;
  passportPhoto?: string;
}

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await api.patch(`/admin/users/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["users"] });

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: ["users"],
      });

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ["users"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((user: any) =>
            user._id === id
              ? { ...user, ...data, updatedAt: new Date().toISOString() }
              : user
          ),
        };
      });

      // Also update individual user query if it exists
      queryClient.setQueryData(["user", id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            ...data,
            updatedAt: new Date().toISOString(),
          },
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
    },
    onSuccess: (result: any) => {
      // Update the cache with the actual server response for consistency
      queryClient.setQueryData(["user", result.data._id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: result.data,
        };
      });

      // Invalidate users queries to ensure consistency across all filtered views
      queryClient.invalidateQueries({
        queryKey: ["users"],
        refetchType: "none", // Prevent automatic refetch since we updated optimistically
      });
    },
  });
};
