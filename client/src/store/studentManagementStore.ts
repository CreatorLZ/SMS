import { create } from "zustand";

interface StudentManagementState {
  isCreateModalOpen: boolean;
  isViewModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedStudentId: string | null;
  searchQuery: string;
  classFilter: string;
  currentPage: number;
  classroomId?: string;
  classroomName?: string;
  onStudentCreated?: () => void;
  setCreateModalOpen: (open: boolean) => void;
  setViewModalOpen: (open: boolean, studentId?: string | null) => void;
  setEditModalOpen: (open: boolean, studentId?: string | null) => void;
  setSearchQuery: (query: string) => void;
  setClassFilter: (classId: string) => void;
  setCurrentPage: (page: number) => void;
  setCreateModalContext: (
    classroomId?: string,
    classroomName?: string,
    onStudentCreated?: () => void
  ) => void;
  closeAllModals: () => void;
}

export const useStudentManagementStore = create<StudentManagementState>(
  (set) => ({
    isCreateModalOpen: false,
    isViewModalOpen: false,
    isEditModalOpen: false,
    selectedStudentId: null,
    searchQuery: "",
    classFilter: "",
    currentPage: 1,
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setViewModalOpen: (open, studentId = null) =>
      set({
        isViewModalOpen: open,
        selectedStudentId: studentId,
      }),
    setEditModalOpen: (open, studentId = null) => {
      console.log("setEditModalOpen called with:", {
        open,
        studentId,
        studentIdType: typeof studentId,
      });
      set({
        isEditModalOpen: open,
        selectedStudentId: studentId,
      });
    },
    setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
    setClassFilter: (classId) => set({ classFilter: classId, currentPage: 1 }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setCreateModalContext: (classroomId, classroomName, onStudentCreated) =>
      set({
        classroomId,
        classroomName,
        onStudentCreated,
      }),
    closeAllModals: () =>
      set({
        isCreateModalOpen: false,
        isViewModalOpen: false,
        isEditModalOpen: false,
        selectedStudentId: null,
      }),
  })
);
