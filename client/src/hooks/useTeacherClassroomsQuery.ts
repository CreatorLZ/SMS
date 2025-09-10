import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export interface Classroom {
  _id: string;
  name: string;
  teacherId: {
    _id: string;
    name: string;
    email: string;
  };
  students: {
    _id: string;
    fullName: string;
    studentId: string;
  }[];
  createdAt: string;
}

export const useTeacherClassroomsQuery = () => {
  return useQuery<Classroom[]>({
    queryKey: ["teacher-classrooms"],
    queryFn: async (): Promise<Classroom[]> => {
      const response = await api.get("/teacher/classrooms");
      return response.data as Classroom[];
    },
  });
};

// Hook to get students for a specific classroom (teacher access)
export const useTeacherClassroomStudents = (classroomId: string) => {
  return useQuery({
    queryKey: ["teacher-classroom-students", classroomId],
    queryFn: async () => {
      const response = await api.get(
        `/admin/classrooms/${classroomId}/students`
      );
      return response.data;
    },
    enabled: !!classroomId,
  });
};
