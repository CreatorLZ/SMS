import api from "../lib/api";

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

// Teacher submits result
export function useSubmitResult() {
  return async (
    studentId: string,
    result: {
      term: string;
      year: number;
      scores: { subject: string; score: number }[];
      comment: string;
    }
  ) => {
    const res = await api.post(`/teacher/results`, { studentId, ...result });
    return res.data;
  };
}
