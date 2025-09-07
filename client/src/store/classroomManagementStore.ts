import { create } from "zustand";

interface ClassroomManagementState {
  isCreateModalOpen: boolean;
  isAssignModalOpen: boolean;
  selectedClassroomId: string | null;
  setCreateModalOpen: (open: boolean) => void;
  setAssignModalOpen: (open: boolean, classroomId?: string | null) => void;
}

export const useClassroomManagementStore = create<ClassroomManagementState>(
  (set) => ({
    isCreateModalOpen: false,
    isAssignModalOpen: false,
    selectedClassroomId: null,
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setAssignModalOpen: (open, classroomId = null) =>
      set({
        isAssignModalOpen: open,
        selectedClassroomId: classroomId,
      }),
  })
);
