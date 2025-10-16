import { create } from "zustand";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  subjectSpecializations?: string[];
  subjectSpecialization?: string; // Keep for backward compatibility
  assignedClasses?: {
    _id: string;
    name: string;
  }[];
}

interface TeacherManagementState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isViewModalOpen: boolean;
  selectedTeacher: Teacher | null;
  selectedTeacherId: string | null;
  setCreateModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean) => void;
  setViewModalOpen: (open: boolean, teacherId?: string | null) => void;
  setSelectedTeacher: (teacher: Teacher | null) => void;
  setSelectedTeacherId: (teacherId: string | null) => void;
}

export const useTeacherManagementStore = create<TeacherManagementState>(
  (set) => ({
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isViewModalOpen: false,
    selectedTeacher: null,
    selectedTeacherId: null,
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setEditModalOpen: (open) => set({ isEditModalOpen: open }),
    setViewModalOpen: (open, teacherId) =>
      set({
        isViewModalOpen: open,
        selectedTeacherId: teacherId || null,
      }),
    setSelectedTeacher: (teacher) => set({ selectedTeacher: teacher }),
    setSelectedTeacherId: (teacherId) => set({ selectedTeacherId: teacherId }),
  })
);
