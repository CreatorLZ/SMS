import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

interface SchoolDaysData {
  classroomId: string;
  term: {
    name: string;
    year: number;
    startDate: string;
    endDate: string;
  };
  schoolDays: number;
  totalTermDays: number;
}

export function useSchoolDays(classroomId: string) {
  return useQuery<SchoolDaysData>({
    queryKey: ["school-days", classroomId],
    queryFn: async (): Promise<SchoolDaysData> => {
      const response = await api.get(
        `/admin/classrooms/${classroomId}/school-days`
      );
      return response.data as SchoolDaysData;
    },
    enabled: !!classroomId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
