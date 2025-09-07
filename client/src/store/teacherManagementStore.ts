import { create } from "zustand";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  subjectSpecialization?: string;
  assignedClassId?: {
    _id: string;
    name: string;
  };
}

interface TeacherManagementState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  selectedTeacher: Teacher | null;
  setCreateModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean) => void;
  setSelectedTeacher: (teacher: Teacher | null) => void;
}

export const useTeacherManagementStore = create<TeacherManagementState>(
  (set) => ({
    isCreateModalOpen: false,
    isEditModalOpen: false,
    selectedTeacher: null,
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setEditModalOpen: (open) => set({ isEditModalOpen: open }),
    setSelectedTeacher: (teacher) => set({ selectedTeacher: teacher }),
  })
);
