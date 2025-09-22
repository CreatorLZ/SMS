import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    },
    onMutate: async (deletedId: string) => {
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
          data: oldData.data.filter((user: any) => user._id !== deletedId),
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total - 1,
          },
        };
      });

      // Return a context object with the snapshotted value
      return { previousQueries };
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, rollback by restoring the previous queries
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: ["users"],
        refetchType: "none", // Prevent automatic refetch since we updated optimistically
      });
    },
  });
};
