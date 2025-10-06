import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { Subject } from "./useSubjectsQuery";

export interface ClassroomSubjectsResponse {
  classroom: {
    _id: string;
    name: string;
  };
  subjects: Subject[];
}

export const useClassroomSubjectsQuery = (classroomId: string) => {
  return useQuery({
    queryKey: ["classroom-subjects", classroomId],
    queryFn: async () => {
      const response = await api.get(
        `/admin/classrooms/${classroomId}/subjects`
      );
      return response.data as ClassroomSubjectsResponse;
    },
    enabled: !!classroomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAvailableSubjectsQuery = (classroomId: string) => {
  return useQuery({
    queryKey: ["available-subjects", classroomId],
    queryFn: async () => {
      const response = await api.get(
        `/admin/classrooms/${classroomId}/available-subjects`
      );
      return (response.data as any).availableSubjects as Subject[];
    },
    enabled: !!classroomId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeacherClassroomSubjectsQuery = (classroomId: string) => {
  return useQuery({
    queryKey: ["teacher-classroom-subjects", classroomId],
    queryFn: async () => {
      const response = await api.get(
        `/teacher/classrooms/${classroomId}/subjects`
      );
      return response.data as ClassroomSubjectsResponse;
    },
    enabled: !!classroomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
