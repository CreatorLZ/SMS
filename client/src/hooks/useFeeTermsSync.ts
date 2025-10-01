import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useToast } from "../components/ui/use-toast";

interface SyncTermResult {
  message: string;
  term: {
    _id: string;
    name: string;
    session: string;
  };
  stats: {
    totalFeeStructures: number;
    syncedClassrooms: number;
    syncedStudents: number;
    totalFeesProcessed: number;
    totalErrors: number;
    duration: string;
  };
  classroomResults: Array<{
    classroomId: string;
    students: number;
    feesProcessed: number;
    errors: number;
  }>;
}

/**
 * Hook for syncing fees for a specific term
 */
export const useFeeTermsSync = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (termId: string): Promise<SyncTermResult> => {
      const response = await api.post(`/admin/fees/terms/${termId}/sync`);
      return response.data as SyncTermResult;
    },
    onSuccess: (data: SyncTermResult) => {
      toast({
        title: "✅ Term Fee Sync Complete",
        description: `${data.term.name} ${data.term.session}: ${data.stats.syncedStudents} students synced`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["feeStructures"] });
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Term fee sync failed";
      toast({
        title: "❌ Term Fee Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for getting sync operation status
 */
export const useFeeSyncOperation = (operationId?: string) => {
  return useQuery({
    queryKey: ["feeOperation", operationId],
    queryFn: async () => {
      const response = await api.get(`/admin/fees/operations/${operationId}`);
      return response.data;
    },
    enabled: !!operationId,
    refetchInterval: 3000, // Poll every 3 seconds
  });
};
