import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: () => {
      // Invalidate and refetch classroom data
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      // Invalidate timetable data
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
  });
}

export function useGetTimetable() {
  return useMutation({
    mutationFn: async (classroomId: string) => {
      const response = await api.get(`/admin/timetable/${classroomId}`);
      return response.data;
    },
  });
}

export function useGetAllTimetables() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get("/admin/timetable");
      return response.data;
    },
  });
}
