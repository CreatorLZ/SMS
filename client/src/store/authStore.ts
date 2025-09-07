// store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole =
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "superadmin";

interface AuthState {
  token: string | null;
  user: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    linkedStudentIds?: string[];
    assignedClassId?: string;
  } | null;
  loading: boolean; // Added for initialization
  setAuth: (token: string, user: AuthState["user"]) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void; // Action to update loading state
  refreshToken: (newToken: string) => void; // Method to update token during refresh
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial State
      token: null,
      user: null,
      loading: true, // Start in a loading state

      // Actions
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setLoading: (loading) => set({ loading }),
      refreshToken: (newToken) => set((state) => ({ token: newToken })),
    }),
    {
      name: "auth-store",
      // Only persist the token and user, not the loading state
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
