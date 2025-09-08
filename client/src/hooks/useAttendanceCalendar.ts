import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

interface CalendarAttendanceData {
  [date: string]: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

export function useAttendanceCalendar(
  classroomId: string,
  month: number,
  year: number
) {
  return useQuery({
    queryKey: ["attendance-calendar", classroomId, month, year],
    queryFn: async () => {
      const response = await api.get(
        `/api/admin/attendance/calendar/${classroomId}?month=${month}&year=${year}`
      );
      return response.data as CalendarAttendanceData;
    },
    enabled: !!classroomId,
  });
}
