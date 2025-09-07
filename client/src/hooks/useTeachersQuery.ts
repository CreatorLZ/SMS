import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const useTeachersQuery = () => {
  return useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: async (): Promise<Teacher[]> => {
      const response = await api.get("/admin/users");
      const users = response.data as Teacher[];
      // Filter only teachers
      return users.filter((user) => user.role === "teacher");
    },
  });
};
