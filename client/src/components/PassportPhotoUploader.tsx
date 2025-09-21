"use client";

import { useState, useRef, useCallback } from "react";
import { UploadButton } from "@uploadthing/react";
import { usePassportUpload } from "@/hooks/usePassportUpload";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface PassportPhotoUploaderProps {
  studentId: string;
  currentPhoto?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadBegin?: () => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function PassportPhotoUploader({
  studentId,
  currentPhoto,
  onUploadSuccess,
  onUploadBegin,
  onUploadComplete,
  onUploadError,
  className = "",
}: PassportPhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const {
    onUploadComplete: hookOnUploadComplete,
    onUploadError: hookOnUploadError,
    onUploadBegin: hookOnUploadBegin,
    isUploading: hookIsUploading,
    error,
    clearError,
  } = usePassportUpload({ studentId });

  const handleUploadComplete = async (res: any) => {
    setIsUploading(false);

    if (onUploadComplete) {
      // Use callback from parent component
      await onUploadComplete(res[0]?.url);
      setUploadedUrl(res[0]?.url);
    } else {
      // Fall back to hook logic
      const result = await hookOnUploadComplete(res);
      if (result?.success) {
        const newUrl = res[0]?.url;
        setUploadedUrl(newUrl);
        onUploadSuccess?.(newUrl);
      }
    }
  };

  const handleUploadError = useCallback(
    (error: Error) => {
      setIsUploading(false);
      if (onUploadError) {
        onUploadError(error.message);
      } else {
        hookOnUploadError(error);
      }
    },
    [onUploadError, hookOnUploadError]
  );

  const handleUploadBegin = useCallback(() => {
    setIsUploading(true);
    onUploadBegin?.();
    hookOnUploadBegin?.();
  }, [onUploadBegin, hookOnUploadBegin]);

  const getUploadZoneClasses = () => {
    const baseClasses =
      "relative border-2 border-dashed rounded-lg transition-all duration-200 overflow-hidden";

    if (isUploading) {
      return `${baseClasses} border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed`;
    }

    if (isHovering) {
      return `${baseClasses} border-blue-400 bg-blue-50 hover:scale-[1.01]`;
    }

    return `${baseClasses} border-gray-300 bg-gray-50 hover:border-gray-400`;
  };

  const getInstructionText = () => {
    if (isUploading) return "Uploading...";
    return "Click the button below to upload passport photo";
  };

  const getIcon = () => {
    if (isUploading) return "⏳";
    return "📷";
  };

  return (
    <div
      className={`w-full h-full flex items-center justify-center ${className}`}
    >
      <UploadButton<OurFileRouter, "passportUploader">
        endpoint="passportUploader"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadBegin={handleUploadBegin}
        disabled={isUploading}
      />
    </div>
  );
}
