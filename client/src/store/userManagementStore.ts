import { create } from "zustand";

interface UserManagementState {
  isCreateModalOpen: boolean;
  roleFilter: string;
  searchQuery: string;
  setCreateModalOpen: (open: boolean) => void;
  setRoleFilter: (role: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useUserManagementStore = create<UserManagementState>((set) => ({
  isCreateModalOpen: false,
  roleFilter: "",
  searchQuery: "",
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
