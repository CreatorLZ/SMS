import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post("/admin/users", data);
      return response.data;
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["users"] });

      // Create a temporary optimistic user with a temp ID
      const tempId = `temp-${Date.now()}`;
      const optimisticUser = {
        _id: tempId,
        ...data,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOptimistic: true, // Flag to identify optimistic updates
      };

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: ["users"],
      });

      // Optimistically update the cache by adding the new user
      queryClient.setQueriesData({ queryKey: ["users"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: [optimisticUser, ...oldData.data],
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total + 1,
          },
        };
      });

      // Return context for potential rollback
      return { previousQueries, tempId };
    },
    onError: (err, data, context) => {
      // If the mutation fails, rollback by restoring the previous queries
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (result: any, variables, context) => {
      // Replace the optimistic user with the real server response
      queryClient.setQueriesData({ queryKey: ["users"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((user: any) =>
            user._id === context?.tempId ? result.data : user
          ),
        };
      });

      // Invalidate to ensure all queries are consistent (especially filtered ones)
      queryClient.invalidateQueries({
        queryKey: ["users"],
        refetchType: "none", // Prevent automatic refetch since we updated optimistically
      });
    },
  });
};
