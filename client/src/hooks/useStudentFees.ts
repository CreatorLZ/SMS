import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "../lib/api";
import { useFeeStore } from "../store/feeStore";

interface FeeSummary {
  studentId: string;
  fullName: string;
  totalPaidAmount: number;
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

      const totalPaidAmount = termFees.reduce(
        (sum: number, fee: any) => sum + (fee.amountPaid || 0),
        0
      );
      const unpaidFees = termFees.filter((fee: any) => !fee.paid).length;
      const totalAmount = termFees.reduce(
        (sum: number, fee: any) => sum + (fee.amount || 0),
        0
      );

      return {
        studentId,
        fullName,
        totalPaidAmount,
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
  const {
    setStudentFees,
    setLoadingStudentFees,
    setStudentFeesError,
    studentFees,
  } = useFeeStore();

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
      paymentAmount,
      paymentMethod,
      receiptNumber,
    }: {
      studentId: string;
      term: string;
      session: string;
      paymentAmount: number;
      paymentMethod?: string;
      receiptNumber?: string;
    }) => {
      const response = await axios.post(
        `/admin/fees/students/${studentId}/pay`,
        {
          term,
          session,
          paymentAmount,
          paymentMethod,
          receiptNumber,
        }
      );
      return response.data;
    },
    onSuccess: (data: any, variables) => {
      // Optimistically update the fee store if the student is currently loaded
      if (studentFees && studentFees._id === variables.studentId) {
        const updatedTermFees = studentFees.termFees.map((fee) => {
          if (
            fee.term === variables.term &&
            fee.session === variables.session
          ) {
            // Update the fee with the new data from backend
            if (!data.termFee) return fee;
            return {
              ...fee,
              ...data.termFee,
            };
          }
          return fee;
        });

        // Update the store with the new fee data
        setStudentFees({
          ...studentFees,
          termFees: updatedTermFees,
        });
      }

      // Refresh queries as fallback
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "studentFeeSummary",
      });
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
      queryClient.invalidateQueries({ queryKey: ["feeStructures"] });
    },
  });

  return {
    getStudentFees: getStudentFeesMutation.mutateAsync,
    markFeePaid: markFeePaidMutation.mutateAsync,
    isLoadingFees: getStudentFeesMutation.isPending,
    isMarkingPaid: markFeePaidMutation.isPending,
  };
};
