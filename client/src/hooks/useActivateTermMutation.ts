import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useActivateTermMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (termId: string) => {
      const response = await api.patch(`/admin/terms/${termId}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    },
  });
};
