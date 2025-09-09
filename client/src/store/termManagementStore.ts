import { create } from "zustand";

interface TermManagementState {
  // Modal states
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;

  // Data states
  selectedTerm: any | null;
  termToDelete: any | null;

  // Filter states
  searchQuery: string;
  statusFilter: string;
  yearFilter: string;

  // UI states
  currentPage: number;

  // Actions
  setCreateModalOpen: (open: boolean) => void;
  setEditModalOpen: (open: boolean, term?: any) => void;
  setDeleteModalOpen: (open: boolean, term?: any) => void;
  setSelectedTerm: (term: any | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setYearFilter: (filter: string) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
}

export const useTermManagementStore = create<TermManagementState>(
  (set, get) => ({
    // Modal states
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,

    // Data states
    selectedTerm: null,
    termToDelete: null,

    // Filter states
    searchQuery: "",
    statusFilter: "",
    yearFilter: "",

    // UI states
    currentPage: 1,

    // Actions
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setEditModalOpen: (open, term) =>
      set({
        isEditModalOpen: open,
        selectedTerm: term || null,
      }),
    setDeleteModalOpen: (open, term) =>
      set({
        isDeleteModalOpen: open,
        termToDelete: term || null,
      }),
    setSelectedTerm: (term) => set({ selectedTerm: term }),
    setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
    setStatusFilter: (filter) => set({ statusFilter: filter, currentPage: 1 }),
    setYearFilter: (filter) => set({ yearFilter: filter, currentPage: 1 }),
    setCurrentPage: (page) => set({ currentPage: page }),
    resetFilters: () =>
      set({
        searchQuery: "",
        statusFilter: "",
        yearFilter: "",
        currentPage: 1,
      }),
  })
);
