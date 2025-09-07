import { create } from "zustand";

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

interface StudentState {
  profile: StudentProfile | null;
  setProfile: (profile: StudentProfile) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
