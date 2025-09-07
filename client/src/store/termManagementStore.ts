import { create } from "zustand";

interface TermManagementState {
  isCreateModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
}

export const useTermManagementStore = create<TermManagementState>((set) => ({
  isCreateModalOpen: false,
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
}));
