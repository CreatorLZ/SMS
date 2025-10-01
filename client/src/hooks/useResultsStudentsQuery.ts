import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Student {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  studentId: string;
  gender?: string;
  currentClass?: string;
}

interface StudentsResponse {
  students: Student[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useResultsStudentsQuery = (
  session: string,
  term: string,
  classId: string,
  search: string,
  page: number,
  options?: { enabled?: boolean }
) => {
  return useQuery<StudentsResponse>({
    queryKey: ["results-students", session, term, classId, search, page],
    queryFn: async (): Promise<StudentsResponse> => {
      const params = new URLSearchParams({
        classId,
        search,
        page: page.toString(),
        limit: "10",
      });
      const response = await api.get(`/admin/students?${params.toString()}`);
      return response.data as StudentsResponse;
    },
    enabled: (options?.enabled ?? true) && !!classId,
  });
};
