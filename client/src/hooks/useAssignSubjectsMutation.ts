import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface AssignSubjectsData {
  subjectIds: string[];
}

interface AssignSubjectsResponse {
  message: string;
  classroom: {
    _id: string;
    name: string;
    subjects: string[];
  };
}

export const useAssignSubjectsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      data,
    }: {
      classroomId: string;
      data: AssignSubjectsData;
    }) => {
      const response = await api.post(
        `/admin/classrooms/${classroomId}/subjects`,
        data
      );
      return response.data as AssignSubjectsResponse;
    },
    onSuccess: (data, variables) => {
      // Immediate refetch for real-time updates
      queryClient.refetchQueries({
        queryKey: ["classroom-subjects", variables.classroomId],
      });

      queryClient.refetchQueries({
        queryKey: ["available-subjects", variables.classroomId],
      });

      // Invalidate with immediate refetch for active queries only
      queryClient.invalidateQueries({
        queryKey: ["classrooms"],
        refetchType: "active",
      });
    },
    onError: (error, variables) => {
      // Revert any optimistic updates on error
      queryClient.invalidateQueries({
        queryKey: ["classroom-subjects", variables.classroomId],
      });

      queryClient.invalidateQueries({
        queryKey: ["available-subjects", variables.classroomId],
      });
    },
  });
};

export const useRemoveSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      subjectId,
    }: {
      classroomId: string;
      subjectId: string;
    }) => {
      const response = await api.delete(
        `/admin/classrooms/${classroomId}/subjects/${subjectId}`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate classroom subjects queries
      queryClient.invalidateQueries({
        queryKey: ["classroom-subjects", variables.classroomId],
      });

      // Invalidate available subjects for this classroom
      queryClient.invalidateQueries({
        queryKey: ["available-subjects", variables.classroomId],
      });

      // Invalidate classrooms list to update any cached classroom data
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });
};
