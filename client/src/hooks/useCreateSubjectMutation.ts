import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Subject } from "./useSubjectsQuery";

interface CreateSubjectData {
  name: string;
  category:
    | "Core"
    | "Science"
    | "Humanities"
    | "Business"
    | "Trade"
    | "Optional";
  level: "Primary" | "Junior Secondary" | "Senior Secondary";
}

export const useCreateSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubjectData) => {
      const response = await api.post("/admin/subjects", data);
      return response.data as Subject;
    },
    onSuccess: () => {
      // Invalidate and refetch subjects queries
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};
