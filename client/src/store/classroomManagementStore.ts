import { create } from "zustand";

interface ClassroomManagementState {
  isCreateModalOpen: boolean;
  isAssignModalOpen: boolean;
  selectedClassroomId: string | null;
  viewMode: "list" | "detail";
  selectedClassroomForDetail: string | null;
  setCreateModalOpen: (open: boolean) => void;
  setAssignModalOpen: (open: boolean, classroomId?: string | null) => void;
  setViewMode: (mode: "list" | "detail") => void;
  setSelectedClassroomForDetail: (classroomId: string | null) => void;
}

export const useClassroomManagementStore = create<ClassroomManagementState>(
  (set) => ({
    isCreateModalOpen: false,
    isAssignModalOpen: false,
    selectedClassroomId: null,
    viewMode: "list",
    selectedClassroomForDetail: null,
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setAssignModalOpen: (open, classroomId = null) =>
      set({
        isAssignModalOpen: open,
        selectedClassroomId: classroomId,
      }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedClassroomForDetail: (classroomId) =>
      set({
        selectedClassroomForDetail: classroomId,
        viewMode: classroomId ? "detail" : "list",
      }),
  })
);
