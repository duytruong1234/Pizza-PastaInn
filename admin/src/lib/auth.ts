// Auth helper — JWT authentication qua backend Pizza&PastaInn
import { api } from "./api";

// Kiểu dữ liệu user từ backend
export interface AdminUser {
  user_id: number;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

// Response từ API login
interface LoginResponse {
  success: boolean;
  data: {
    user: AdminUser;
    token: string;
  };
  message: string;
}

// Response từ API /auth/me
interface MeResponse {
  success: boolean;
  data: AdminUser;
}

// Đăng nhập — chỉ cho phép role admin/cashier
export async function loginAdmin(
  email: string,
  password: string,
): Promise<{ user: AdminUser; token: string }> {
  const res = await api.post<LoginResponse>("/api/auth/login", {
    email,
    password,
  });

  const { user, token } = res.data.data;

  // Kiểm tra quyền admin
  if (user.role !== "admin" && user.role !== "cashier") {
    throw new Error("Bạn không có quyền truy cập trang quản trị");
  }

  // Lưu token và user vào localStorage
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify(user));

  return { user, token };
}

// Lấy thông tin user hiện tại từ backend
export async function getMe(): Promise<AdminUser | null> {
  try {
    const res = await api.get<MeResponse>("/api/auth/me");
    return res.data.data;
  } catch {
    return null;
  }
}

// Đăng xuất — xóa token khỏi localStorage + gọi API logout
export async function logoutAdmin(): Promise<void> {
  try {
    await api.post("/api/auth/logout");
  } catch {
    // Ignore error — vẫn xóa token local
  }
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

// Kiểm tra đã đăng nhập chưa (client-side)
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("admin_token");
}

// Lấy user từ localStorage (không cần call API)
export function getStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("admin_user");
  if (!data) return null;
  try {
    return JSON.parse(data) as AdminUser;
  } catch {
    return null;
  }
}

// Lấy token từ localStorage
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}
