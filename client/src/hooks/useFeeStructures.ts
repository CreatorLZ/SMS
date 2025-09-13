import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/api";
import { useFeeStore } from "../store/feeStore";

export const useFeeStructures = () => {
  const {
    feeStructures,
    isLoadingFeeStructures,
    feeStructuresError,
    setFeeStructures,
    setLoadingFeeStructures,
    setFeeStructuresError,
  } = useFeeStore();

  const queryClient = useQueryClient();

  // Fetch fee structures
  const { refetch, data, error, isLoading } = useQuery({
    queryKey: ["feeStructures"],
    queryFn: async () => {
      const response = await axios.get("/admin/fees/structures");
      return response.data;
    },
    enabled: true, // Enable automatic fetching
  });

  // Update store when data changes
  React.useEffect(() => {
    if (data) {
      setFeeStructures(data as any[]);
      setLoadingFeeStructures(false);
      setFeeStructuresError(null);
    }
  }, [data, setFeeStructures, setLoadingFeeStructures, setFeeStructuresError]);

  // Handle errors
  React.useEffect(() => {
    if (error) {
      setFeeStructuresError(
        (error as any).response?.data?.message ||
          "Failed to fetch fee structures"
      );
      setLoadingFeeStructures(false);
    }
  }, [error, setFeeStructuresError, setLoadingFeeStructures]);

  // Create fee structure
  const createMutation = useMutation({
    mutationFn: async (data: {
      classroomId: string;
      termId: string;
      amount: number;
    }) => {
      const response = await axios.post("/admin/fees/structures", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feeStructures"] });
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
    },
  });

  // Update fee structure
  const updateMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const response = await axios.put(`/admin/fees/structures/${id}`, {
        amount,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feeStructures"] });
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
    },
  });

  // Delete fee structure
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/admin/fees/structures/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feeStructures"] });
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
    },
  });

  // Preview delete
  const previewDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.get(
        `/admin/fees/structures/${id}/preview-delete`
      );
      return response.data;
    },
  });

  // Confirm delete
  const confirmDeleteMutation = useMutation({
    mutationFn: async ({ id, confirm }: { id: string; confirm: boolean }) => {
      const response = await axios.post(
        `/admin/fees/structures/${id}/confirm-delete`,
        { confirm }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feeStructures"] });
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
    },
  });

  return {
    feeStructures,
    isLoadingFeeStructures,
    feeStructuresError,
    refetchFeeStructures: refetch,
    createFeeStructure: createMutation.mutateAsync,
    updateFeeStructure: updateMutation.mutateAsync,
    deleteFeeStructure: deleteMutation.mutateAsync,
    previewDeleteFeeStructure: previewDeleteMutation.mutateAsync,
    confirmDeleteFeeStructure: confirmDeleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
