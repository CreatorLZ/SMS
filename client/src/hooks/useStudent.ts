import { useStudentStore } from "../store/studentStore";
import api from "../lib/api";

interface StudentProfile {
  _id: string;
  fullName: string;
  studentId: string;
  currentClass: string;
  termFees: Array<{
    term: "1st" | "2nd" | "3rd";
    year: number;
    paid: boolean;
    pinCode: string;
    viewable: boolean;
  }>;
  attendance: Array<{ date: string; status: "present" | "absent" }>;
  results: Array<{
    term: string;
    year: number;
    scores: { subject: string; score: number }[];
    comment: string;
    updatedBy: string;
    updatedAt: string;
  }>;
}

export function useFetchStudentProfile() {
  const setProfile = useStudentStore((s) => s.setProfile);
  return async (studentId: string) => {
    const res = await api.get(`/student/profile`, { params: { studentId } });
    const data = res.data as StudentProfile;
    setProfile(data);
    return data;
  };
}
