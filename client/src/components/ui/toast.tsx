"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Allow animation to complete
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // Auto close after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
        "animate-in slide-in-from-top-2 fade-in",
        type === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-600" />
      )}

      <p className="text-sm font-medium">{message}</p>

      <button
        onClick={handleClose}
        className={cn(
          "ml-2 rounded-full p-1 transition-colors hover:bg-black/10",
          type === "success" ? "text-green-600" : "text-red-600"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
