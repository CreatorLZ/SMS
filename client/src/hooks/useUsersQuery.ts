import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const useUsersQuery = () => {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await api.get("/admin/users");
      return response.data as User[];
    },
  });
};
