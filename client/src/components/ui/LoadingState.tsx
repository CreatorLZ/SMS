import React from "react";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

interface LoadingStateProps {
  type?: "skeleton" | "spinner" | "pulse";
  message?: string;
  className?: string;
  showMessage?: boolean;
}

export function LoadingState({
  type = "skeleton",
  message = "Loading...",
  className = "",
  showMessage = true,
}: LoadingStateProps) {
  if (type === "spinner") {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 ${className}`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        {showMessage && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    );
  }

  if (type === "pulse") {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 ${className}`}
      >
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-8 w-8"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
        {showMessage && <p className="text-sm text-gray-600 mt-4">{message}</p>}
      </div>
    );
  }

  // Default skeleton loading
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="animate-pulse space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      {showMessage && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
}

// Specialized loading components for different use cases
export function CardLoadingState({
  message = "Loading data...",
}: {
  message?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <LoadingState type="skeleton" message={message} />
      </CardContent>
    </Card>
  );
}

export function TableLoadingState({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="animate-pulse flex space-x-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={`h-4 ${colIndex === 0 ? "w-1/4" : "w-1/6"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsLoadingState({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
