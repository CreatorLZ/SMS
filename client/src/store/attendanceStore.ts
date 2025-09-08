import { create } from "zustand";

export interface AttendanceEntry {
  date: string;
  status: "present" | "absent" | "late";
}

export interface AttendanceRecord {
  _id: string;
  classroomId: string;
  date: string;
  records: {
    studentId: string;
    status: "present" | "absent" | "late";
  }[];
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAttendance {
  _id: string;
  fullName: string;
  studentId: string;
  status: "present" | "absent" | "late";
}

interface AttendanceState {
  attendance: AttendanceEntry[];
  attendanceRecords: AttendanceRecord[];
  selectedClass: string;
  selectedDate: string;
  filters: {
    classroomId: string;
    studentId: string;
    startDate: string;
    endDate: string;
  };
  setAttendance: (attendance: AttendanceEntry[]) => void;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  setSelectedClass: (classId: string) => void;
  setSelectedDate: (date: string) => void;
  setFilters: (filters: Partial<AttendanceState["filters"]>) => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  attendanceRecords: [],
  selectedClass: "",
  selectedDate: "",
  filters: {
    classroomId: "",
    studentId: "",
    startDate: "",
    endDate: "",
  },
  setAttendance: (attendance) => set({ attendance }),
  setAttendanceRecords: (attendanceRecords) => set({ attendanceRecords }),
  setSelectedClass: (selectedClass) => set({ selectedClass }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
}));
