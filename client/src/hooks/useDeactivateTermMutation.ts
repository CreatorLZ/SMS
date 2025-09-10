import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useDeactivateTermMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (termId: string) => {
      const response = await api.patch(`/admin/terms/${termId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    },
  });
};
