import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface TimetableEntry {
  _id?: string;
  dayOfWeek: number;
  period: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  classroom: string;
}

// Enhanced error types for better error handling
interface TimetableError {
  message: string;
  code?: string;
  details?: any;
}

// Cache keys for better organization
export const TIMETABLE_KEYS = {
  all: ["timetables"] as const,
  lists: () => [...TIMETABLE_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...TIMETABLE_KEYS.lists(), filters] as const,
  details: () => [...TIMETABLE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...TIMETABLE_KEYS.details(), id] as const,
};

export function useSaveTimetable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      timetable,
    }: {
      classroomId: string;
      timetable: TimetableEntry[];
    }) => {
      const response = await api.post(`/admin/timetable/${classroomId}`, {
        timetable,
      });
      return response.data;
    },
    onMutate: async ({ classroomId, timetable }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: TIMETABLE_KEYS.detail(classroomId),
      });

      // Snapshot the previous value
      const previousTimetable = queryClient.getQueryData(
        TIMETABLE_KEYS.detail(classroomId)
      ) as
        | {
            classroom: { _id: string; name: string };
            timetable: TimetableEntry[];
          }
        | undefined;

      // Optimistically update to the new value
      queryClient.setQueryData(TIMETABLE_KEYS.detail(classroomId), {
        classroom: previousTimetable?.classroom || {
          _id: classroomId,
          name: "",
        },
        timetable: timetable,
      });

      // Return a context object with the snapshotted value
      return { previousTimetable };
    },
    onError: (err, { classroomId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTimetable) {
        queryClient.setQueryData(
          TIMETABLE_KEYS.detail(classroomId),
          context.previousTimetable
        );
      }
    },
    onSuccess: (_, { classroomId }) => {
      // Invalidate and refetch to ensure server state is correct
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({
        queryKey: TIMETABLE_KEYS.detail(classroomId),
      });
      queryClient.invalidateQueries({ queryKey: TIMETABLE_KEYS.all });
    },
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for save operations
      if (failureCount >= 2) return false;

      // Don't retry on validation errors
      if (error?.response?.status === 400) return false;

      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useGetTimetable(classroomId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: TIMETABLE_KEYS.detail(classroomId),
    queryFn: async () => {
      const response = await api.get(`/admin/timetable/${classroomId}`);
      return response.data as {
        classroom: { _id: string; name: string };
        timetable: TimetableEntry[];
      };
    },
    enabled: enabled && !!classroomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000, // Background refetch every 30 seconds for collaborative editing
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    retry: (failureCount, error: any) => {
      // Retry up to 3 times with exponential backoff
      if (failureCount >= 3) return false;

      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }

      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export function useGetAllTimetables() {
  return useQuery({
    queryKey: ["timetables"],
    queryFn: async () => {
      const response = await api.get("/admin/timetable");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateTimetableEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      entryId,
      updateData,
    }: {
      classroomId: string;
      entryId: string;
      updateData: Partial<TimetableEntry>;
    }) => {
      const response = await api.put(
        `/admin/timetable/${classroomId}/${entryId}`,
        updateData
      );
      return response.data;
    },
    onMutate: async ({ classroomId, entryId, updateData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: TIMETABLE_KEYS.detail(classroomId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        TIMETABLE_KEYS.detail(classroomId)
      ) as
        | {
            classroom: { _id: string; name: string };
            timetable: TimetableEntry[];
          }
        | undefined;

      // Optimistically update
      if (previousData) {
        const updatedTimetable = previousData.timetable.map((entry) =>
          entry._id === entryId ? { ...entry, ...updateData } : entry
        );

        queryClient.setQueryData(TIMETABLE_KEYS.detail(classroomId), {
          ...previousData,
          timetable: updatedTimetable,
        });
      }

      return { previousData };
    },
    onError: (err, { classroomId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          TIMETABLE_KEYS.detail(classroomId),
          context.previousData
        );
      }
    },
    onSuccess: (_, { classroomId }) => {
      queryClient.invalidateQueries({
        queryKey: TIMETABLE_KEYS.detail(classroomId),
      });
      queryClient.invalidateQueries({ queryKey: TIMETABLE_KEYS.all });
    },
    retry: (failureCount, error: any) => {
      if (failureCount >= 2) return false;
      if (error?.response?.status === 400) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useDeleteTimetableEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      entryId,
    }: {
      classroomId: string;
      entryId: string;
    }) => {
      const response = await api.delete(
        `/admin/timetable/${classroomId}/${entryId}`
      );
      return response.data;
    },
    onMutate: async ({ classroomId, entryId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: TIMETABLE_KEYS.detail(classroomId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        TIMETABLE_KEYS.detail(classroomId)
      ) as
        | {
            classroom: { _id: string; name: string };
            timetable: TimetableEntry[];
          }
        | undefined;

      // Optimistically remove the entry
      if (previousData) {
        const filteredTimetable = previousData.timetable.filter(
          (entry) => entry._id !== entryId
        );

        queryClient.setQueryData(TIMETABLE_KEYS.detail(classroomId), {
          ...previousData,
          timetable: filteredTimetable,
        });
      }

      return { previousData };
    },
    onError: (err, { classroomId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          TIMETABLE_KEYS.detail(classroomId),
          context.previousData
        );
      }
    },
    onSuccess: (_, { classroomId }) => {
      queryClient.invalidateQueries({
        queryKey: TIMETABLE_KEYS.detail(classroomId),
      });
      queryClient.invalidateQueries({ queryKey: TIMETABLE_KEYS.all });
    },
    retry: (failureCount, error: any) => {
      if (failureCount >= 2) return false;
      if (error?.response?.status === 400) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
