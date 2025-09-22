import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateStudentData {
  firstName: string;
  lastName: string;
  studentId: string;
  currentClass: string;
  parentId?: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  location: string;
  parentName: string;
  parentPhone: string;
  relationshipToStudent: string;
  admissionDate: string;
}

export const useCreateStudentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentData) => {
      const response = await api.post("/admin/students", data);
      return response.data;
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["students"] });

      // Create a temporary optimistic student with a temp ID
      const tempId = `temp-student-${Date.now()}`;
      const optimisticStudent = {
        _id: tempId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        studentId: data.studentId || "Generating...",
        currentClass: data.currentClass,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        location: data.location,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        relationshipToStudent: data.relationshipToStudent,
        admissionDate: data.admissionDate,
        isOptimistic: true, // Flag to identify optimistic updates for UI feedback
      };

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({
        queryKey: ["students"],
      });

      // Optimistically update the cache by adding the new student
      queryClient.setQueriesData({ queryKey: ["students"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          students: [optimisticStudent, ...oldData.students],
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total + 1,
          },
        };
      });

      // Return context for potential rollback
      return { previousQueries, tempId };
    },
    onError: (err, data, context) => {
      // If the mutation fails, rollback by restoring the previous queries
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Failed to create student after auto-retry:", err);
      // Error state will be handled by component for user feedback
    },
    onSuccess: (result: any, variables, context) => {
      // Replace the optimistic student with the real server response
      queryClient.setQueriesData({ queryKey: ["students"] }, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          students: oldData.students.map((student: any) =>
            student._id === context?.tempId ? result : student
          ),
        };
      });

      // Invalidate to ensure all queries are consistent (especially filtered ones)
      queryClient.invalidateQueries({
        queryKey: ["students"],
        refetchType: "none", // Prevent automatic refetch since we updated optimistically
      });
    },
  });
};
