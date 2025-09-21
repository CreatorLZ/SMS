"use client";

import { useState, useRef, useCallback } from "react";
import { UploadButton } from "@uploadthing/react";
import { usePassportUpload } from "@/hooks/usePassportUpload";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Upload, Loader2 } from "lucide-react";

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

  return (
    <div
      className={`w-full h-full absolute inset-0 z-10 ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Upload Button Container */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <UploadButton<OurFileRouter, "passportUploader">
            endpoint="passportUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onUploadBegin={handleUploadBegin}
            disabled={isUploading}
            content={{
              button: ({
                ready,
                isUploading: uploadButtonUploading,
                uploadProgress,
              }) => {
                if (uploadButtonUploading || isUploading) {
                  return (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">UPLOADING...</span>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2 opacity-0">
                    <Upload className="w-4 h-4" />
                    <span className="text-xs">SELECT FILE</span>
                  </div>
                );
              },
              allowedContent: ({
                ready,
                fileTypes,
                isUploading: uploadButtonUploading,
              }) => {
                // Hide the default allowed content
                return null;
              },
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Invisible overlay to ensure click area */}
          {(isHovering || isUploading) && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg pointer-events-none">
              <div className="text-center">
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-green-400 animate-spin" />
                    <div className="text-xs text-green-300">
                      uploading photo...
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <div className="text-xs text-green-300">
                      click to change
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
