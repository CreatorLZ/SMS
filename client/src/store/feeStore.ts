import { create } from "zustand";

export interface FeeStructure {
  _id: string;
  classroomId: {
    _id: string;
    name: string;
  };
  termId: {
    _id: string;
    name: string;
    year: number;
  };
  amount: number;
  createdBy: {
    _id: string;
    name: string;
  };
  updatedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudentFee {
  _id: string;
  fullName: string;
  studentId: string;
  currentClass: string;
  classroom: string;
  termFees: Array<{
    term: "1st" | "2nd" | "3rd";
    session: string;
    paid: boolean;
    pinCode: string;
    viewable: boolean;
    amount: number;
    amountPaid: number;
    paymentHistory: Array<{
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      receiptNumber?: string;
      updatedBy?: string;
    }>;
    paymentDate?: string;
    paymentMethod?: string;
    receiptNumber?: string;
    updatedBy?: string;
  }>;
}

export interface ArrearsData {
  _id: string;
  fullName: string;
  studentId: string;
  currentClass: string;
  classroom: string;
  outstandingFees: Array<{
    term: "1st" | "2nd" | "3rd";
    session: string;
    paid: boolean;
    pinCode: string;
    viewable: boolean;
    amount: number;
    amountPaid: number;
    balance: number;
    paymentDate?: string;
    updatedBy?: string;
  }>;
  totalOutstanding: number;
}

interface FeeState {
  // Fee Structures
  feeStructures: FeeStructure[];
  isLoadingFeeStructures: boolean;
  feeStructuresError: string | null;

  // Student Fees
  studentFees: StudentFee | null;
  isLoadingStudentFees: boolean;
  studentFeesError: string | null;

  // Student Fees Pagination
  studentFeesPage: number;
  studentFeesSearch: string;
  studentFeesClassFilter: string;

  // Arrears
  arrears: ArrearsData[];
  isLoadingArrears: boolean;
  arrearsError: string | null;

  // Modals
  isCreateFeeModalOpen: boolean;
  isEditFeeModalOpen: boolean;
  isMarkPaidModalOpen: boolean;
  selectedFeeStructure: FeeStructure | null;
  selectedStudentForPayment: StudentFee | null;

  // Actions
  setFeeStructures: (structures: FeeStructure[]) => void;
  setLoadingFeeStructures: (loading: boolean) => void;
  setFeeStructuresError: (error: string | null) => void;

  setStudentFees: (fees: StudentFee | null) => void;
  setLoadingStudentFees: (loading: boolean) => void;
  setStudentFeesError: (error: string | null) => void;

  setStudentFeesPage: (page: number) => void;
  setStudentFeesSearch: (search: string) => void;
  setStudentFeesClassFilter: (classFilter: string) => void;

  setArrears: (arrears: ArrearsData[]) => void;
  setLoadingArrears: (loading: boolean) => void;
  setArrearsError: (error: string | null) => void;

  // Modal actions
  setCreateFeeModalOpen: (open: boolean) => void;
  setEditFeeModalOpen: (open: boolean, structure?: FeeStructure | null) => void;
  setMarkPaidModalOpen: (open: boolean, student?: StudentFee | null) => void;
  setSelectedStudentForPayment: (student: StudentFee | null) => void;

  // Reset
  resetFeeState: () => void;
}

export const useFeeStore = create<FeeState>((set) => ({
  // Initial state
  feeStructures: [],
  isLoadingFeeStructures: false,
  feeStructuresError: null,

  studentFees: null,
  isLoadingStudentFees: false,
  studentFeesError: null,

  studentFeesPage: 1,
  studentFeesSearch: "",
  studentFeesClassFilter: "",

  arrears: [],
  isLoadingArrears: false,
  arrearsError: null,

  isCreateFeeModalOpen: false,
  isEditFeeModalOpen: false,
  isMarkPaidModalOpen: false,
  selectedFeeStructure: null,
  selectedStudentForPayment: null,

  // Actions
  setFeeStructures: (structures) => set({ feeStructures: structures }),
  setLoadingFeeStructures: (loading) =>
    set({ isLoadingFeeStructures: loading }),
  setFeeStructuresError: (error) => set({ feeStructuresError: error }),

  setStudentFees: (fees) => set({ studentFees: fees }),
  setLoadingStudentFees: (loading) => set({ isLoadingStudentFees: loading }),
  setStudentFeesError: (error) => set({ studentFeesError: error }),

  setStudentFeesPage: (page) => set({ studentFeesPage: page }),
  setStudentFeesSearch: (search) =>
    set({ studentFeesSearch: search, studentFeesPage: 1 }),
  setStudentFeesClassFilter: (classFilter) =>
    set({ studentFeesClassFilter: classFilter, studentFeesPage: 1 }),

  setArrears: (arrears) => set({ arrears }),
  setLoadingArrears: (loading) => set({ isLoadingArrears: loading }),
  setArrearsError: (error) => set({ arrearsError: error }),

  // Modal actions
  setCreateFeeModalOpen: (open) => set({ isCreateFeeModalOpen: open }),
  setEditFeeModalOpen: (open, structure = null) =>
    set({
      isEditFeeModalOpen: open,
      selectedFeeStructure: structure,
    }),
  setMarkPaidModalOpen: (open, student = null) =>
    set({
      isMarkPaidModalOpen: open,
      selectedStudentForPayment: student,
    }),
  setSelectedStudentForPayment: (student) =>
    set({ selectedStudentForPayment: student }),

  // Reset
  resetFeeState: () =>
    set({
      feeStructures: [],
      isLoadingFeeStructures: false,
      feeStructuresError: null,
      studentFees: null,
      isLoadingStudentFees: false,
      studentFeesError: null,
      studentFeesPage: 1,
      studentFeesSearch: "",
      studentFeesClassFilter: "",
      arrears: [],
      isLoadingArrears: false,
      arrearsError: null,
      isCreateFeeModalOpen: false,
      isEditFeeModalOpen: false,
      isMarkPaidModalOpen: false,
      selectedFeeStructure: null,
      selectedStudentForPayment: null,
    }),
}));
