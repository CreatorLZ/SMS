import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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

export const useClassroomsQuery = () => {
  return useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: async (): Promise<Classroom[]> => {
      const response = await api.get("/admin/classrooms");
      return response.data as Classroom[];
    },
  });
};
