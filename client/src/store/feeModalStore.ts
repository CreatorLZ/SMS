import { create } from "zustand";

interface FeeModalState {
  isMarkPaidModalOpen: boolean;
  selectedStudent: any;
  selectedFee: any;
  onPaymentSuccess: (() => void) | null;
  isClosing: boolean;
  openMarkPaidModal: (student: any, fee: any, onSuccess?: () => void) => void;
  closeMarkPaidModal: () => void;
}

export const useFeeModalStore = create<FeeModalState>((set, get) => ({
  isMarkPaidModalOpen: false,
  selectedStudent: null,
  selectedFee: null,
  onPaymentSuccess: null,
  isClosing: false,
  openMarkPaidModal: (student, fee, onSuccess) => {
    set({
      isMarkPaidModalOpen: true,
      selectedStudent: student,
      selectedFee: fee,
      onPaymentSuccess: onSuccess || null,
    });
  },
  closeMarkPaidModal: () => {
    if (get().isClosing) return; // Prevent re-entrant calls
    set({ isClosing: true });
    const { onPaymentSuccess } = get();
    try {
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } finally {
      set({
        isMarkPaidModalOpen: false,
        selectedStudent: null,
        selectedFee: null,
        onPaymentSuccess: null,
        isClosing: false,
      });
    }
  },
}));
