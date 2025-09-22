"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";

interface UseUserPassportUploadProps {
  userId: string;
}

export function useUserPassportUpload({ userId }: UseUserPassportUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");

  const savePassportPhotoToBackend = async (photoUrl: string) => {
    try {
      setIsUploading(true);
      setError("");

      await api.patch(`/admin/users/${userId}`, {
        passportPhoto: photoUrl,
      });

      setIsUploading(false);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save photo";
      console.error("Error saving to backend:", error);
      setError(errorMessage);
      setIsUploading(false);
      return { success: false, error: errorMessage };
    }
  };

  const onUploadComplete = useCallback(
    async (res: any) => {
      if (res && res[0]) {
        const url = res[0].url;
        return await savePassportPhotoToBackend(url);
      }
    },
    [userId]
  );

  const onUploadError = useCallback((error: Error) => {
    setError(`Upload failed: ${error.message}`);
    setIsUploading(false);
  }, []);

  const onUploadBegin = useCallback(() => {
    setIsUploading(true);
    setError("");
  }, []);

  return {
    onUploadComplete,
    onUploadError,
    onUploadBegin,
    isUploading,
    error,
    clearError: () => setError(""),
  };
}
