import { StateCreator, create } from "zustand";

export interface TimetableEntry {
  day: string;
  subject: string;
  time: string;
}

interface TimetableState {
  timetable: TimetableEntry[];
  setTimetable: (timetable: TimetableEntry[]) => void;
}

export const useTimetableStore = create<TimetableState>((set) => ({
  timetable: [],
  setTimetable: (timetable) => set({ timetable }),
}));
