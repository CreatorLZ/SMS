import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "../lib/api";

export const useEnqueueFeeSync = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { classroomId?: string }) => {
      const response = await axios.post(`/admin/fees/sync-all`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      // data: sync result
      qc.invalidateQueries({ queryKey: ["feeStructures"] });
      qc.invalidateQueries({ queryKey: ["studentFees"] });
      qc.invalidateQueries({ queryKey: ["arrears"] });
    },
  });
};

export const useFeeOperation = (operationId?: string) => {
  return useQuery({
    queryKey: ["feeOperation", operationId],
    queryFn: async () => {
      const response = await axios.get(`/admin/fees/operations/${operationId}`);
      return response.data;
    },
    enabled: !!operationId,
    refetchInterval: 3000,
  });
};
