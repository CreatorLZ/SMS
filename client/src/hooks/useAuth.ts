import { useAuthStore } from "../store/authStore";
import api from "../lib/api";

interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    linkedStudentIds?: string[];
    assignedClassId?: string;
  };
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data as LoginResponse;
    setAuth(data.token, {
      ...data.user,
      role: data.user.role as import("../store/authStore").UserRole,
    });
    return data;
  };
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return () => logout();
}

export function useRefreshToken() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return (newToken: string) => refreshToken(newToken);
}
