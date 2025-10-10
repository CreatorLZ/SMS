import { create } from "zustand";

interface FeeModalState {
  isMarkPaidModalOpen: boolean;
  selectedStudent: any;
  selectedFee: any;
  onPaymentSuccess: (() => void) | null;
  openMarkPaidModal: (student: any, fee: any, onSuccess?: () => void) => void;
  closeMarkPaidModal: () => void;
}

export const useFeeModalStore = create<FeeModalState>((set, get) => ({
  isMarkPaidModalOpen: false,
  selectedStudent: null,
  selectedFee: null,
  onPaymentSuccess: null,
  openMarkPaidModal: (student, fee, onSuccess) => {
    set({
      isMarkPaidModalOpen: true,
      selectedStudent: student,
      selectedFee: fee,
      onPaymentSuccess: onSuccess || null,
    });
  },
  closeMarkPaidModal: () => {
    const { onPaymentSuccess } = get();
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
    set({
      isMarkPaidModalOpen: false,
      selectedStudent: null,
      selectedFee: null,
      onPaymentSuccess: null,
    });
  },
}));
