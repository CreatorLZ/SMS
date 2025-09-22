"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface UseUserPassportUploadProps {
  userId: string;
}

export function useUserPassportUpload({ userId }: UseUserPassportUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  const savePassportPhotoToBackend = async (photoUrl: string) => {
    try {
      setIsUploading(true);
      setError("");

      await api.patch(`/admin/users/${userId}`, {
        passportPhoto: photoUrl,
      });

      // Invalidate user-related queries so ViewUserModal updates
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] }); // In case this affects teacher views too

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
