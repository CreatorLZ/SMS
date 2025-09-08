import { create } from "zustand";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuditLogsState {
  searchQuery: string;
  userId: User | string;
  actionType: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  setSearchQuery: (query: string) => void;
  setUserId: (userId: User | string) => void;
  setActionType: (actionType: string) => void;
  setStartDate: (startDate: string) => void;
  setEndDate: (endDate: string) => void;
  setCurrentPage: (page: number) => void;
  clearFilters: () => void;
}

export const useAuditLogsStore = create<AuditLogsState>((set) => ({
  searchQuery: "",
  userId: "",
  actionType: "",
  startDate: "",
  endDate: "",
  currentPage: 1,
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setUserId: (userId) => set({ userId, currentPage: 1 }),
  setActionType: (actionType) => set({ actionType, currentPage: 1 }),
  setStartDate: (startDate) => set({ startDate, currentPage: 1 }),
  setEndDate: (endDate) => set({ endDate, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  clearFilters: () =>
    set({
      searchQuery: "",
      userId: "",
      actionType: "",
      startDate: "",
      endDate: "",
      currentPage: 1,
    }),
}));
