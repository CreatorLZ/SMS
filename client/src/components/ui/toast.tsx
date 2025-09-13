import React from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const textColor = "text-white";

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center justify-between p-4 rounded-md shadow-lg ${bgColor} ${textColor} max-w-sm`}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 hover:opacity-75 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}
