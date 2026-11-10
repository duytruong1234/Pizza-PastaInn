// Cấu hình API — kết nối tới backend Pizza&PastaInn
import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Tạo axios instance với base URL của backend
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(error: unknown, fallback = "Lỗi kết nối máy chủ"): string {
  if (axios.isAxiosError(error)) {
    const serverMsg = error.response?.data?.message || error.response?.data?.error;
    if (typeof serverMsg === "string" && serverMsg.trim()) return serverMsg;
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      return "Không thể kết nối tới máy chủ backend (port 4000).";
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// Interceptor: tự động gắn JWT token vào mỗi request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: xử lý lỗi 401 (token hết hạn) → redirect về login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/auth/")
    ) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/auth/sign-in";
    }
    return Promise.reject(error);
  },
);
