"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/react-query-client";
import { ReactNode } from "react";
import AuthInitializer from "@/components/AuthInitializer";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthInitializer />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
