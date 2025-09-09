import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useDeleteTermMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/terms/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch terms data
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    },
  });
};
