"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/react-query-client";
import { ReactNode } from "react";
import AuthInitializer from "@/components/AuthInitializer";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
    </QueryClientProvider>
  );
}
