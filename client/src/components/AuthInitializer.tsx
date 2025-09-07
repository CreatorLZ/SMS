"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AuthInitializer() {
  const setLoading = useAuthStore((state) => state.setLoading);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // This effect runs once on the client side after the app has hydrated
    // and the persisted store has been loaded.
    if (loading && user !== undefined) {
      setLoading(false);
      console.log("Authentication state initialized.");
    }
  }, [setLoading, loading, user]);

  return null; // This component doesn't render anything, it's for logic only
}
