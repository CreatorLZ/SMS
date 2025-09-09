import { useState, useEffect } from "react";

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  effectiveType: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture the connection object once
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    // Check connection quality if available
    const updateConnectionInfo = () => {
      if (connection) {
        setConnectionType(connection.type || null);
        setEffectiveType(connection.effectiveType || null);

        // Consider 2G and slow-2g as slow connections
        const slowTypes = ["slow-2g", "2g"];
        setIsSlowConnection(
          connection.effectiveType &&
            slowTypes.includes(connection.effectiveType.toLowerCase())
        );
      }
    };

    updateConnectionInfo();

    // Listen for connection changes using the same connection reference
    if (connection) {
      connection.addEventListener("change", updateConnectionInfo);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (connection) {
        connection.removeEventListener("change", updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    isSlowConnection,
    connectionType,
    effectiveType,
  };
}

// Hook for handling network-dependent operations
export function useNetworkAwareQuery() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const shouldRetry = (failureCount: number, error: any) => {
    // Don't retry if offline
    if (!isOnline) return false;

    // Retry up to 3 times for network errors
    if (
      error?.message?.includes("network") ||
      error?.code === "NETWORK_ERROR"
    ) {
      return failureCount < 3;
    }

    // Retry once for other errors
    return failureCount < 1;
  };

  const getRetryDelay = (attemptIndex: number) => {
    // Longer delays for slow connections
    const baseDelay = isSlowConnection ? 2000 : 1000;
    return Math.min(baseDelay * 2 ** attemptIndex, 30000);
  };

  return {
    shouldRetry,
    getRetryDelay,
    isOnline,
    isSlowConnection,
  };
}
