"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AuthInitializer() {
  const setLoading = useAuthStore((state) => state.setLoading);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // This effect runs once on the client side after the app has hydrated
    // and the persisted store has been loaded.
    if (loading) {
      // Auth state is considered initialized when:
      // 1. We have a token (user is logged in), OR
      // 2. We have no token and user is null (user is not logged in)
      // This handles both authenticated and unauthenticated states
      setLoading(false);
      console.log("Authentication state initialized.", {
        hasToken: !!token,
        hasUser: !!user,
      });
    }
  }, [setLoading, loading, user, token]);

  return null; // This component doesn't render anything, it's for logic only
}
