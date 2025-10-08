import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "../lib/api";
import { useFeeStore } from "../store/feeStore";

interface FeeSummary {
  studentId: string;
  fullName: string;
  paidFees: number;
  unpaidFees: number;
  totalAmount: number;
}

export const useStudentFeeSummary = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["studentFeeSummary", studentId],
    queryFn: async (): Promise<FeeSummary> => {
      if (!studentId) throw new Error("Student ID required");

      const response = await axios.get(
        `/admin/fees/students/${studentId}/fees`
      );
      const { termFees, fullName } = response.data as any;

      const paidFees = termFees.filter((fee: any) => fee.paid).length;
      const unpaidFees = termFees.filter((fee: any) => !fee.paid).length;
      const totalAmount = termFees.reduce(
        (sum: number, fee: any) => sum + (fee.amount || 0),
        0
      );

      return {
        studentId,
        fullName,
        paidFees,
        unpaidFees,
        totalAmount,
      };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentFees = () => {
  const queryClient = useQueryClient();
  const { setStudentFees, setLoadingStudentFees, setStudentFeesError } =
    useFeeStore();

  // Get student fees
  const getStudentFeesMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await axios.get(
        `/admin/fees/students/${studentId}/fees`
      );
      return response.data;
    },
    onSuccess: (data) => {
      setStudentFees(data as any);
      setLoadingStudentFees(false);
      setStudentFeesError(null);
    },
    onError: (error: any) => {
      setStudentFeesError(
        error.response?.data?.message || "Failed to load student fees"
      );
      setLoadingStudentFees(false);
    },
  });

  // Mark fee as paid
  const markFeePaidMutation = useMutation({
    mutationFn: async ({
      studentId,
      term,
      session,
      paymentMethod,
      receiptNumber,
    }: {
      studentId: string;
      term: string;
      session: string;
      paymentMethod?: string;
      receiptNumber?: string;
    }) => {
      const response = await axios.post(
        `/admin/fees/students/${studentId}/pay`,
        {
          term,
          session,
          paymentMethod,
          receiptNumber,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Refresh student fees after payment
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
    },
  });

  return {
    getStudentFees: getStudentFeesMutation.mutateAsync,
    markFeePaid: markFeePaidMutation.mutateAsync,
    isLoadingFees: getStudentFeesMutation.isPending,
    isMarkingPaid: markFeePaidMutation.isPending,
  };
};
