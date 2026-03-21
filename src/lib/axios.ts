import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/useAuthStore";

// --- Helpers Cookie ---
export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const removeCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// --- Khởi tạo Axios ---
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// --- Queue Refresh Token ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// --- Request Interceptor ---
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getCookie("accessToken");
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
// --- Response Interceptor ---
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu là lỗi 401 và KHÔNG PHẢI là request gọi refresh-token
    if (error.response?.status === 401 && !originalRequest.url?.includes("auth/refresh-token") && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getCookie("refreshToken");

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        // Dùng một instance axios MỚI hoàn toàn (không dính interceptor) để refresh
        const { data } = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/refresh-token`, // Nhớ dấu /
          { refreshToken },
          { headers: { Authorization: "" } } // Clear header để tránh lỗi 401 chồng chéo
        );
        
        const newAccessToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken;

        if (newAccessToken) setCookie("accessToken", newAccessToken);
        if (newRefreshToken) setCookie("refreshToken", newRefreshToken);

        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
        
      } catch (err) {
        // Nếu refresh token cũng tèo (401), dọn dẹp và logout luôn
        processQueue(axios.isAxiosError(err) ? err : null, null);
        
        // XOÁ COOKIE THỦ CÔNG NẾU CẦN
        removeCookie("accessToken");
        removeCookie("refreshToken");
        
        useAuthStore.getState().logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);