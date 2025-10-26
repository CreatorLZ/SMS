"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export default function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  useEffect(() => {
    if (!token) return;

    const checkSessionExpiry = () => {
      try {
        // Decode token to check expiry (simple check, not cryptographically secure)
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry <= 0) {
          // Token already expired, logout will be handled by interceptor
          return;
        }

        if (timeUntilExpiry <= WARNING_TIME) {
          setShowWarning(true);
          setTimeLeft(Math.floor(timeUntilExpiry / 1000 / 60)); // Minutes left
        } else {
          setShowWarning(false);
        }
      } catch (error) {
        console.error("Error checking token expiry:", error);
      }
    };

    // Initial check
    checkSessionExpiry();

    // Set up periodic checks
    const interval = setInterval(checkSessionExpiry, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [token]);

  const extendSession = async () => {
    try {
      const response = await api.post("/auth/refresh");
      const newToken = (response.data as { accessToken: string }).accessToken;
      refreshToken(newToken);
      setShowWarning(false);
    } catch (error) {
      console.error("Failed to extend session:", error);
      // Error will be handled by interceptor
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your session will expire in {timeLeft} minute
                {timeLeft !== 1 ? "s" : ""}. Would you like to extend it?
              </p>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={extendSession}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Extend Session
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="text-yellow-700 hover:text-yellow-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
