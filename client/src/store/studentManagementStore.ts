import { create } from "zustand";

interface StudentManagementState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedStudentId: string | null;
  searchQuery: string;
  classFilter: string;
  currentPage: number;
  setCreateModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean, studentId?: string | null) => void;
  setSearchQuery: (query: string) => void;
  setClassFilter: (classId: string) => void;
  setCurrentPage: (page: number) => void;
}

export const useStudentManagementStore = create<StudentManagementState>(
  (set) => ({
    isCreateModalOpen: false,
    isEditModalOpen: false,
    selectedStudentId: null,
    searchQuery: "",
    classFilter: "",
    currentPage: 1,
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setEditModalOpen: (open, studentId = null) =>
      set({
        isEditModalOpen: open,
        selectedStudentId: studentId,
      }),
    setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
    setClassFilter: (classId) => set({ classFilter: classId, currentPage: 1 }),
    setCurrentPage: (page) => set({ currentPage: page }),
  })
);
