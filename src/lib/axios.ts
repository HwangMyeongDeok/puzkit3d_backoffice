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

/**
 * Các endpoint xác thực — KHÔNG được trigger refresh-token logic.
 * Thêm vào đây nếu có endpoint auth mới.
 */
const AUTH_ENDPOINTS = ["auth/login", "auth/register", "auth/refresh-token"];

// ---------------------------------------------------------------------------
// Instance CHÍNH — dùng cho toàn bộ app
// ---------------------------------------------------------------------------
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

/**
 * Instance RIÊNG để gọi refresh-token.
 * Tách biệt hoàn toàn để tránh interceptor của axiosInstance
 * bắt lại chính request refresh => vòng lặp vô tận => logout sai.
 */
const refreshAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ---------------------------------------------------------------------------
// Logout helper — gom hết side-effects vào một chỗ
// ---------------------------------------------------------------------------
const handleLogout = () => {
  removeCookie("accessToken");
  removeCookie("refreshToken");
  useAuthStore.getState().logout();
  // Để router (React Router / TanStack Router) xử lý redirect thay vì
  // hard-reload bằng window.location — tránh mất state, tránh flicker.
  // Nếu project chưa có router listener thì uncomment dòng dưới:
  // window.location.replace("/login");
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

/**
 * Gọi khi logout chủ động (nút Đăng Xuất).
 * Clear queue để tránh zombie requests sau khi logout.
 */
export const clearAxiosState = () => {
  isRefreshing = false;
  failedQueue.forEach((p) => p.reject(new Error("Logout interrupted")));
  failedQueue = [];
  removeCookie("accessToken");
  removeCookie("refreshToken");
};

// ---------------------------------------------------------------------------
// Request Interceptor — đính kèm access token vào mọi request
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
// Response Interceptor — tự động refresh token khi gặp 401
// ---------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) return Promise.reject(error);

    // ✅ Guard sớm: bỏ qua tất cả auth endpoints và request đã retry rồi
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
      originalRequest.url?.includes(ep)
    );

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    // --- Nếu đang có request khác đang refresh, thêm vào queue chờ ---
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

    // --- Bắt đầu refresh ---
    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getCookie("refreshToken");

    if (!refreshToken) {
      // Không có refresh token → logout luôn, không cần gọi API
      isRefreshing = false;
      processQueue(error, null);
      handleLogout();
      return Promise.reject(error);
    }

    try {
      // ✅ Dùng refreshAxios (instance riêng) — KHÔNG đi qua interceptor chính
      const { data } = await refreshAxios.post("auth/refresh-token", {
        refreshToken,
      });

      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken || data.newRefreshToken;

      if (!newAccessToken) {
        // Backend trả 200 nhưng không có token → coi như lỗi
        throw new Error("No access token in refresh response");
      }

      setCookie("accessToken", newAccessToken);
      if (newRefreshToken) {
        setCookie("refreshToken", newRefreshToken);
      }

      // Giải phóng queue — tất cả request đang chờ tiếp tục với token mới
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);

    } catch (refreshErr) {
      // Refresh thất bại (400 / 401 / 500 / network...) → logout
      processQueue(refreshErr as AxiosError, null);
      handleLogout();
      return Promise.reject(refreshErr);

    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;