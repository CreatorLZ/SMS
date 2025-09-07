import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post("/admin/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
