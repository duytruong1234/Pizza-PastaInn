// Auth Context — quản lý trạng thái đăng nhập toàn cục
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type AdminUser,
  getStoredUser,
  getMe,
  logoutAdmin,
  isAuthenticated,
} from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Kiểm tra auth khi mount
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Đọc user từ localStorage trước (tốc độ nhanh)
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setIsLoading(false);
    }

    // Verify token bằng cách gọi API /auth/me
    try {
      const freshUser = await getMe();
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem("admin_user", JSON.stringify(freshUser));
      } else {
        // Token không hợp lệ
        setUser(null);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      }
    } catch {
      // API lỗi — giữ user từ localStorage
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Đăng xuất
  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
      setUser(null);
      router.push("/auth/sign-in");
      toast.success("Đăng xuất thành công");
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook dùng auth trong component
export function useAuth() {
  return useContext(AuthContext);
}
