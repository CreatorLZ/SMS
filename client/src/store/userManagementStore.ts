import { create } from "zustand";

interface UserManagementState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedUserId: string | null;
  roleFilter: string;
  statusFilter: string;
  searchQuery: string;
  setCreateModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean, userId?: string | null) => void;
  setDeleteModalOpen: (open: boolean, userId?: string | null) => void;
  setSelectedUserId: (userId: string | null) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useUserManagementStore = create<UserManagementState>((set) => ({
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedUserId: null,
  roleFilter: "all",
  statusFilter: "all",
  searchQuery: "",
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setEditModalOpen: (open, userId = null) =>
    set({
      isEditModalOpen: open,
      selectedUserId: userId,
    }),
  setDeleteModalOpen: (open, userId = null) =>
    set({
      isDeleteModalOpen: open,
      selectedUserId: userId,
    }),
  setSelectedUserId: (userId) => set({ selectedUserId: userId }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
