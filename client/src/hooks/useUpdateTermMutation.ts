import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface UpdateTermData {
  name: "1st" | "2nd" | "3rd";
  year: number;
  startDate: string;
  endDate: string;
  holidays?: {
    name: string;
    startDate: string;
    endDate: string;
  }[];
}

export const useUpdateTermMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTermData }) => {
      const response = await api.put(`/admin/terms/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch terms data
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    },
  });
};
