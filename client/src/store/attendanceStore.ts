import { create } from "zustand";

export interface AttendanceEntry {
  date: string;
  status: "present" | "absent";
}

interface AttendanceState {
  attendance: AttendanceEntry[];
  setAttendance: (attendance: AttendanceEntry[]) => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  attendance: [],
  setAttendance: (attendance) => set({ attendance }),
}));
