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
  // Debug logging
  console.log("useTeacherResultsStudentsQuery called with:", {
    session,
    term,
    classId,
    classIdType: typeof classId,
    search,
    page,
    enabled: (options?.enabled ?? true) && !!classId,
  });

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

      const fullUrl = `/teacher/results/students?${params.toString()}`;
      console.log("DEBUG: Making API request to:", fullUrl);
      console.log("DEBUG: Parameters:", {
        classId,
        classIdType: typeof classId,
        classIdLength: classId?.length,
        search,
        page,
        session,
        term,
      });

      try {
        const response = await api.get(fullUrl);
        console.log("DEBUG: API response received:", response.data);
        return response.data as TeacherStudentsResponse;
      } catch (error: any) {
        console.error("DEBUG: API request failed:", {
          url: fullUrl,
          error: error.response?.data || error.message,
          status: error.response?.status,
        });
        throw error;
      }
    },
    enabled: (options?.enabled ?? true) && !!classId,
  });
};

export const useTeacherResultsStudentsWithResultsQuery = (
  session: string,
  term: string,
  classId: string,
  search: string,
  page: number,
  year: number,
  options?: { enabled?: boolean }
) => {
  // Debug logging
  console.log("useTeacherResultsStudentsWithResultsQuery called with:", {
    session,
    term,
    classId,
    classIdType: typeof classId,
    search,
    page,
    enabled: (options?.enabled ?? true) && !!classId,
  });

  return useQuery<TeacherStudentsResponse>({
    queryKey: [
      "teacher-results-students-with-results",
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
        hasResults: "true",
        term,
        year: year.toString(),
      });

      const fullUrl = `/teacher/results/students?${params.toString()}`;
      console.log("DEBUG: Making API request to:", fullUrl);

      try {
        const response = await api.get(fullUrl);
        console.log("DEBUG: API response received:", response.data);
        return response.data as TeacherStudentsResponse;
      } catch (error: any) {
        console.error("DEBUG: API request failed:", {
          url: fullUrl,
          error: error.response?.data || error.message,
          status: error.response?.status,
        });
        throw error;
      }
    },
    enabled: (options?.enabled ?? true) && !!classId,
  });
};

export const useTeacherResultsStudentsWithoutResultsQuery = (
  session: string,
  term: string,
  classId: string,
  search: string,
  page: number,
  year: number,
  options?: { enabled?: boolean }
) => {
  // Debug logging
  console.log("useTeacherResultsStudentsWithoutResultsQuery called with:", {
    session,
    term,
    classId,
    classIdType: typeof classId,
    search,
    page,
    enabled: (options?.enabled ?? true) && !!classId,
  });

  return useQuery<TeacherStudentsResponse>({
    queryKey: [
      "teacher-results-students-without-results",
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
        hasResults: "false",
        term,
        year: year.toString(),
      });

      const fullUrl = `/teacher/results/students?${params.toString()}`;
      console.log("DEBUG: Making API request to:", fullUrl);

      try {
        const response = await api.get(fullUrl);
        console.log("DEBUG: API response received:", response.data);
        return response.data as TeacherStudentsResponse;
      } catch (error: any) {
        console.error("DEBUG: API request failed:", {
          url: fullUrl,
          error: error.response?.data || error.message,
          status: error.response?.status,
        });
        throw error;
      }
    },
    enabled: (options?.enabled ?? true) && !!classId,
  });
};
