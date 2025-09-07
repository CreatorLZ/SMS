import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateTermData {
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

export const useCreateTermMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTermData) => {
      const response = await api.post("/admin/terms", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    },
  });
};
