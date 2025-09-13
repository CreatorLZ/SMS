"use client";

import React, { Suspense } from "react";
import ErrorBoundary from "../ErrorBoundary";

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

export function SuspenseWrapper({
  children,
  fallback = <DefaultFallback />,
}: SuspenseWrapperProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// Hook for creating suspense-enabled data fetching
export function useSuspenseQuery(
  queryKey: any[],
  queryFn: () => Promise<any>,
  options = {}
) {
  const { useSuspenseQuery } = require("@tanstack/react-query");
  return useSuspenseQuery(queryKey, queryFn, {
    suspense: true,
    ...options,
  });
}
