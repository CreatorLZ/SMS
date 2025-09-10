import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Subject } from "./useSubjectsQuery";

interface UpdateSubjectData {
  name?: string;
  category?:
    | "Core"
    | "Science"
    | "Humanities"
    | "Business"
    | "Trade"
    | "Optional";
  level?: "Primary" | "Junior Secondary" | "Senior Secondary";
  isActive?: boolean;
}

export const useUpdateSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSubjectData;
    }) => {
      const response = await api.put(`/admin/subjects/${id}`, data);
      return response.data as Subject;
    },
    onSuccess: (data, variables) => {
      // Update the specific subject in cache
      queryClient.setQueryData(["subjects", variables.id], data);

      // Invalidate subjects list to refetch
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-subjects"] });
    },
  });
};

export const useDeactivateSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/subjects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate subjects queries to refetch
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-subjects"] });
    },
  });
};

export const useActivateSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/admin/subjects/${id}/activate`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate subjects queries to refetch
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-subjects"] });
    },
  });
};
