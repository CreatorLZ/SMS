import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export interface StudentResult {
  term: string;
  year: number;
  scores: {
    subject: string;
    assessments: {
      ca1: number;
      ca2: number;
      exam: number;
    };
    totalScore: number;
  }[];
  comment: string;
  updatedBy?: string;
  updatedAt?: string;
}

// Unlock results: expects { studentId, pinCode, term, year }
export function useUnlockResults() {
  return async (
    studentId: string,
    pinCode: string,
    term: string,
    year: number
  ) => {
    const res = await api.post("/student/results/verify", {
      studentId,
      pinCode,
      term,
      year,
    });
    return res.data;
  };
}

// Get student results (for teachers/admins)
export function useStudentResults(studentId: string) {
  // Debug logging
  console.log("useStudentResults called with:", {
    studentId,
    studentIdType: typeof studentId,
    isValidObjectId: /^[0-9a-fA-F]{24}$/.test(studentId),
  });

  return useQuery<StudentResult[]>({
    queryKey: ["student-results", studentId],
    queryFn: async () => {
      // Validate studentId before making API call
      if (
        !studentId ||
        studentId === "students" ||
        !/^[0-9a-fA-F]{24}$/.test(studentId)
      ) {
        console.error(
          "Invalid studentId provided to useStudentResults:",
          studentId
        );
        throw new Error("Invalid student ID format");
      }

      const res = await api.get(`/teacher/results/${studentId}`);
      const data = res.data as { results?: StudentResult[] };
      return data.results || [];
    },
    enabled: !!studentId && /^[0-9a-fA-F]{24}$/.test(studentId),
  });
}

// Teacher submits result
export function useSubmitResult() {
  return async (
    studentId: string,
    result: {
      term: string;
      year: number;
      scores: {
        subject: string;
        assessments: {
          ca1: number;
          ca2: number;
          exam: number;
        };
        totalScore: number;
      }[];
      comment: string;
    }
  ) => {
    const res = await api.post(`/teacher/results`, { studentId, ...result });
    return res.data;
  };
}

// Publish/unpublish results for classroom
export function usePublishResults() {
  return async (
    classroomId: string,
    term: string,
    year: number,
    published: boolean
  ) => {
    const res = await api.patch(
      `/admin/classrooms/${classroomId}/results/publish`,
      {
        term,
        year,
        published,
      }
    );
    return res.data;
  };
}

// Get publication status for classroom results
export function useResultsPublicationStatus(
  classroomId: string,
  term: string,
  year: number
) {
  return useQuery({
    queryKey: ["publication-status", classroomId, term, year],
    queryFn: async () => {
      const res = await api.get(
        `/admin/classrooms/${classroomId}/results/publication-status`,
        {
          params: { term, year },
        }
      );
      return res.data;
    },
    enabled: !!classroomId && !!term && !!year,
  });
}
