import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  subjectSpecialization?: string;
  assignedClassId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export function useTeachersBySubject(subject?: string) {
  return useQuery<Teacher[]>({
    queryKey: ["teachers", "by-subject", subject],
    queryFn: async (): Promise<Teacher[]> => {
      const response = await api.get("/admin/teachers");
      const teachers = response.data as Teacher[];

      // Filter teachers by subject if specified
      if (subject && subject !== "") {
        return teachers.filter((teacher) =>
          teacher.subjectSpecialization
            ?.toLowerCase()
            .includes(subject.toLowerCase())
        );
      }

      return teachers;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
