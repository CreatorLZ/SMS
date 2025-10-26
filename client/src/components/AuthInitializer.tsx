"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function AuthInitializer() {
  const setLoading = useAuthStore((state) => state.setLoading);
  const logout = useAuthStore((state) => state.logout);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!loading) return;

      // If we have a persisted token, validate it
      if (token) {
        try {
          // Try to validate the current token
          await api.get("/auth/me");
          console.log("Token validated successfully");
        } catch (error: any) {
          console.log("Token validation failed, attempting refresh");

          try {
            // Try to refresh the token
            const refreshResponse = await api.post("/auth/refresh");
            const newToken = (refreshResponse.data as { accessToken: string })
              .accessToken;

            // Update the token in store
            useAuthStore.getState().refreshToken(newToken);
            console.log("Token refreshed successfully");
          } catch (refreshError: any) {
            console.log("Token refresh failed, logging out");

            // Both validation and refresh failed, clear session
            logout();

            // Redirect to login if on protected route
            if (
              typeof window !== "undefined" &&
              window.location.pathname.startsWith("/admin")
            ) {
              window.location.href = "/admin/login";
            }
          }
        }
      }

      // Mark initialization as complete
      setLoading(false);
      console.log("Authentication state initialized.", {
        hasToken: !!token,
        hasUser: !!user,
      });
    };

    initializeAuth();
  }, [setLoading, logout, loading, user, token]);

  return null; // This component doesn't render anything, it's for logic only
}
