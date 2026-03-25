import axios, { 
  type AxiosError, 
  type InternalAxiosRequestConfig, 
  type AxiosInstance 
} from "axios";
import { useAuthStore } from "@/store/useAuthStore";

// --- Helpers Cookie ---
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }
};

export const removeCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// --- Khởi tạo Axios Instance Chính ---
export const axiosInstance: AxiosInstance = axios.create({
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
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1. Kiểm tra xem request bị lỗi có phải là chính request refresh-token không
    const isRefreshRequest = originalRequest.url?.includes("auth/refresh-token");

    if (error.response?.status === 401) {
      
      // TRƯỜNG HỢP A: Nếu chính request Refresh Token bị 401 (Refresh Token hết hạn thật sự)
      if (isRefreshRequest) {
        processQueue(error, null);
        removeCookie("accessToken");
        removeCookie("refreshToken");
        useAuthStore.getState().logout(); 
        
        // Ép về login và xóa sạch memory (Tránh lỗi Zombie Cache)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // TRƯỜNG HỢP B: Các request khác bị 401
      if (!originalRequest._retry) {
        // Nếu đang có một request khác đang refresh rồi, thì đợi thôi
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

        // Nếu không có Refresh Token trong cookie thì logout luôn cho rảnh nợ
        if (!refreshToken) {
          useAuthStore.getState().logout();
          removeCookie("accessToken");
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          // GỌI REFRESH BẰNG INSTANCE RIÊNG
          const { data } = await axiosInstance.post("auth/refresh-token", { 
            refreshToken 
          });

          const newAccessToken = data.accessToken || data.token;
          const newRefreshToken = data.refreshToken;

          // Lưu token mới
          if (newAccessToken) setCookie("accessToken", newAccessToken);
          if (newRefreshToken) setCookie("refreshToken", newRefreshToken);

          // Giải quyết hàng đợi
          processQueue(null, newAccessToken);

          // Thực hiện lại request ban đầu với token mới
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);

        } catch (refreshErr) {
          // Nếu refresh fail (400, 401, 500...)
          processQueue(refreshErr as AxiosError, null);
          removeCookie("accessToken");
          removeCookie("refreshToken");
          useAuthStore.getState().logout();
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;