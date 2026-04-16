import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosInstance,
} from "axios";
import { useAuthStore } from "@/store/useAuthStore";

// ---------------------------------------------------------------------------
// Cookie Helpers
// ---------------------------------------------------------------------------
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document !== "undefined") {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }
};

export const removeCookie = (name: string) => {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ✅ Fix Bug 3: dùng startsWith thay vì includes để tránh false positive
const AUTH_ENDPOINTS = ["auth/login", "auth/register", "auth/refresh-token"];

// ---------------------------------------------------------------------------
// Instances
// ---------------------------------------------------------------------------
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

const refreshAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ---------------------------------------------------------------------------
// ✅ Fix Bug 1: handleLogout KHÔNG xóa refreshToken
// refreshToken chỉ bị xóa sau khi refresh thất bại thực sự,
// hoặc khi user logout chủ động qua clearAxiosState().
// ---------------------------------------------------------------------------
const handleLogout = () => {
  removeCookie("accessToken");
  useAuthStore.getState().logout();
};

// ---------------------------------------------------------------------------
// Token refresh queue
// ---------------------------------------------------------------------------
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

export const clearAxiosState = () => {
  isRefreshing = false;
  failedQueue.forEach((p) => p.reject(new Error("Logout interrupted")));
  failedQueue = [];
  // Khi logout CHỦ ĐỘNG mới xóa cả hai token
  removeCookie("accessToken");
  removeCookie("refreshToken");
};

// ---------------------------------------------------------------------------
// Request Interceptor
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Response Interceptor
// ---------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) return Promise.reject(error);

    // ✅ Fix Bug 3: dùng pathname tách biệt để check endpoint chính xác hơn
    const requestPath = originalRequest.url?.split("?")[0] ?? "";
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
      requestPath === ep || requestPath.endsWith(`/${ep}`)
    );

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

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
      isRefreshing = false;
      processQueue(error, null);
      handleLogout();
      return Promise.reject(error);
    }

    try {
      const { data } = await refreshAxios.post("auth/refresh-token", {
        refreshToken,
      });

      // ✅ Fix Bug 2: log rõ để debug field name backend trả về
      console.debug("[refresh response]", data);

      // ✅ Mở rộng fallback — cover nhiều naming convention của backend hơn
      const newAccessToken =
        data?.accessToken ??
        data?.token ??
        data?.data?.accessToken ??
        data?.data?.token;

      const newRefreshToken =
        data?.refreshToken ??
        data?.newRefreshToken ??
        data?.data?.refreshToken;

      if (!newAccessToken) {
        // Backend trả 200 nhưng không parse được token
        // → log để biết backend đang trả field gì
        console.error("[refresh] Unexpected response shape:", data);
        throw new Error("No access token in refresh response");
      }

      setCookie("accessToken", newAccessToken);
      if (newRefreshToken) {
        setCookie("refreshToken", newRefreshToken);
      }

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);

    } catch (refreshErr) {
      // Chỉ đến đây mới xóa refreshToken (refresh thực sự thất bại)
      removeCookie("refreshToken");
      processQueue(refreshErr as AxiosError, null);
      handleLogout();
      return Promise.reject(refreshErr);

    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;