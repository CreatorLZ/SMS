import { create } from "zustand";

interface LinkedStudent {
  _id: string;
  fullName: string;
  studentId: string;
  currentClass: string;
}

interface ParentState {
  children: LinkedStudent[];
  setChildren: (children: LinkedStudent[]) => void;
}

export const useParentStore = create<ParentState>((set) => ({
  children: [],
  setChildren: (children) => set({ children }),
}));
