import { useState, useEffect } from "react";
import api from "../lib/api";

interface UseStudentIdPreviewReturn {
  previewId: string | null;
  isLoading: boolean;
  error: string | null;
  generatePreview: (className: string) => Promise<void>;
  clearPreview: () => void;
}

export const useStudentIdPreview = (): UseStudentIdPreviewReturn => {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async (className: string) => {
    if (!className || className.trim() === "") {
      setPreviewId(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/admin/students/preview-id/${encodeURIComponent(className)}`
      );
      const data = response.data as { previewId: string };
      setPreviewId(data.previewId);
    } catch (err: any) {
      console.error("Error generating student ID preview:", err);
      setError(err?.response?.data?.message || "Failed to generate preview ID");
      setPreviewId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearPreview = () => {
    setPreviewId(null);
    setError(null);
  };

  return {
    previewId,
    isLoading,
    error,
    generatePreview,
    clearPreview,
  };
};
