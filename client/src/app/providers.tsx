"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/react-query-client";
import { ReactNode } from "react";
import AuthInitializer from "@/components/AuthInitializer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthInitializer />
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
