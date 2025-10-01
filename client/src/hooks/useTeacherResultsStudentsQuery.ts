import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Student } from "./useResultsStudentsQuery";

interface TeacherStudentsResponse {
  students: Student[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useTeacherResultsStudentsQuery = (
  session: string,
  term: string,
  classId: string,
  search: string,
  page: number,
  options?: { enabled?: boolean }
) => {
  return useQuery<TeacherStudentsResponse>({
    queryKey: [
      "teacher-results-students",
      session,
      term,
      classId,
      search,
      page,
    ],
    queryFn: async (): Promise<TeacherStudentsResponse> => {
      const params = new URLSearchParams({
        classId,
        search,
        page: page.toString(),
        limit: "10",
      });
      const response = await api.get(
        `/teacher/results/students?${params.toString()}`
      );
      return response.data as TeacherStudentsResponse;
    },
    enabled: (options?.enabled ?? true) && !!classId,
  });
};
