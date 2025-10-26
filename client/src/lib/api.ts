import { useAuthStore } from "@/store/authStore";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });

  failedQueue = [];
};

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get the token from the Zustand store
    const token = useAuthStore.getState().token;

    // If the token exists, add it to the Authorization header
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh is already in progress, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const refreshResponse = await api.post<{ accessToken: string }>(
          "/auth/refresh"
        );
        const newToken = refreshResponse.data.accessToken;

        // Update the token in the store
        useAuthStore.getState().refreshToken(newToken);

        // Process queued requests
        processQueue(null, newToken);

        // Retry the original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed, logout user
        processQueue(refreshError, null);
        useAuthStore.getState().logout();

        // Provide better error messages based on failure reason
        let errorMessage = "Session expired. Please log in again.";

        if (refreshError.response?.data?.message) {
          const serverMessage = refreshError.response.data.message;
          if (serverMessage.includes("Refresh token not found")) {
            errorMessage = "Your session has expired. Please log in again.";
          } else if (serverMessage.includes("Invalid refresh token")) {
            errorMessage = "Session invalid. Please log in again.";
          }
        }

        // Show user-friendly error (you can integrate with toast notifications)
        console.warn("Authentication error:", errorMessage);

        // Redirect to appropriate login page
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath.startsWith("/admin")) {
            window.location.href = "/admin/login";
          } else if (currentPath.startsWith("/teacher")) {
            window.location.href = "/teacher/login";
          } else if (currentPath.startsWith("/parent")) {
            window.location.href = "/parent/login";
          } else {
            window.location.href = "/admin/login"; // Default fallback
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
