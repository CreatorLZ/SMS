import { create } from "zustand";

interface UserManagementState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isViewModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedUserId: string | null;
  roleFilter: string;
  statusFilter: string;
  searchQuery: string;
  currentPage: number;
  setCreateModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean, userId?: string | null) => void;
  setViewModalOpen: (open: boolean, userId?: string | null) => void;
  setDeleteModalOpen: (open: boolean, userId?: string | null) => void;
  setSelectedUserId: (userId: string | null) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
}

export const useUserManagementStore = create<UserManagementState>((set) => ({
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isViewModalOpen: false,
  isDeleteModalOpen: false,
  selectedUserId: null,
  roleFilter: "all",
  statusFilter: "all",
  searchQuery: "",
  currentPage: 1,
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setEditModalOpen: (open, userId = null) =>
    set({
      isEditModalOpen: open,
      selectedUserId: userId,
    }),
  setViewModalOpen: (open, userId = null) =>
    set({
      isViewModalOpen: open,
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
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
