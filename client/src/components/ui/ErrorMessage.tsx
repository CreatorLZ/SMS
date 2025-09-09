import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  Server,
} from "lucide-react";

interface ErrorMessageProps {
  error?: Error | string | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  type?: "network" | "server" | "auth" | "generic";
  className?: string;
  showDetails?: boolean;
}

export function ErrorMessage({
  error,
  title,
  message,
  onRetry,
  showRetry = true,
  type = "generic",
  className = "",
  showDetails = false,
}: ErrorMessageProps) {
  const getErrorConfig = () => {
    switch (type) {
      case "network":
        return {
          icon: <WifiOff className="h-8 w-8 text-red-500" />,
          title: title || "Connection Error",
          message:
            message ||
            "Unable to connect to the server. Please check your internet connection.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      case "server":
        return {
          icon: <Server className="h-8 w-8 text-orange-500" />,
          title: title || "Server Error",
          message:
            message ||
            "The server is temporarily unavailable. Please try again later.",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
        };
      case "auth":
        return {
          icon: <AlertCircle className="h-8 w-8 text-yellow-500" />,
          title: title || "Authentication Error",
          message: message || "Your session has expired. Please log in again.",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      default:
        return {
          icon: <AlertTriangle className="h-8 w-8 text-gray-500" />,
          title: title || "Something went wrong",
          message: message || "An unexpected error occurred. Please try again.",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const config = getErrorConfig();

  // Extract error message if error object is provided
  const errorMessage = error
    ? typeof error === "string"
      ? error
      : error.message
    : null;

  // Log full error for debugging in non-production
  if (error && process.env.NODE_ENV !== "production") {
    console.debug("Error details:", error);
  }

  const shouldShowDetails =
    showDetails || process.env.NODE_ENV === "development";

  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          {config.icon}
          <span>{config.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">{config.message}</p>

        {errorMessage && shouldShowDetails && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-600">
              Error Details
            </summary>
            <p className="mt-2 text-xs font-mono bg-white p-2 rounded border">
              {errorMessage}
            </p>
          </details>
        )}

        {showRetry && onRetry && (
          <div className="flex space-x-3 pt-2">
            <Button
              onClick={onRetry}
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized error components
export function NetworkErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      type="network"
      onRetry={onRetry}
      message="Please check your internet connection and try again."
    />
  );
}

export function ServerErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      type="server"
      onRetry={onRetry}
      message="Our servers are experiencing issues. Please try again in a few minutes."
    />
  );
}

export function AuthErrorMessage() {
  return (
    <ErrorMessage
      type="auth"
      showRetry={false}
      message="Please log in again to continue."
    />
  );
}

// Inline error component for forms and small spaces
export function InlineErrorMessage({
  error,
  className = "",
  showDetails = false,
}: {
  error?: string | Error;
  className?: string;
  showDetails?: boolean;
}) {
  if (!error) return null;

  const fullMessage = typeof error === "string" ? error : error.message;
  const shouldShowDetails =
    showDetails || process.env.NODE_ENV === "development";
  const message = shouldShowDetails
    ? fullMessage
    : "An error occurred. Please try again.";

  // Log full error for debugging in non-production
  if (error && process.env.NODE_ENV !== "production") {
    console.debug("Inline error details:", error);
  }

  return (
    <div
      className={`flex items-center space-x-2 text-red-600 text-sm ${className}`}
    >
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}
