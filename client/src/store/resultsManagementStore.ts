import { create } from "zustand";

interface ResultsManagementState {
  // Modal state
  isEntryModalOpen: boolean;
  selectedStudentId: string | null;

  // Selection state
  selectedSession: string;
  selectedTerm: string;
  selectedClass: string;

  // Search and pagination state
  searchQuery: string;
  currentPage: number;

  // Actions
  setEntryModalOpen: (isOpen: boolean, studentId?: string | null) => void;
  setSelection: (session: string, term: string, classId: string) => void;
  setSelectedSession: (session: string) => void;
  setSelectedTerm: (term: string) => void;
  setSelectedClass: (classId: string) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  resetSelection: () => void;
}

export const useResultsManagementStore = create<ResultsManagementState>(
  (set) => ({
    // Initial state
    isEntryModalOpen: false,
    selectedStudentId: null,
    selectedSession: "",
    selectedTerm: "",
    selectedClass: "",
    searchQuery: "",
    currentPage: 1,

    // Actions
    setEntryModalOpen: (isOpen: boolean, studentId?: string | null) =>
      set({
        isEntryModalOpen: isOpen,
        selectedStudentId: studentId || null,
      }),

    setSelection: (session: string, term: string, classId: string) =>
      set({
        selectedSession: session,
        selectedTerm: term,
        selectedClass: classId,
      }),

    setSelectedSession: (session: string) =>
      set({
        selectedSession: session,
      }),

    setSelectedTerm: (term: string) =>
      set({
        selectedTerm: term,
      }),

    setSelectedClass: (classId: string) =>
      set({
        selectedClass: classId,
      }),

    setSearchQuery: (query: string) =>
      set({
        searchQuery: query,
      }),

    setCurrentPage: (page: number) =>
      set({
        currentPage: page,
      }),

    resetSelection: () =>
      set({
        selectedSession: "",
        selectedTerm: "",
        selectedClass: "",
        searchQuery: "",
        currentPage: 1,
        isEntryModalOpen: false,
        selectedStudentId: null,
      }),
  })
);
