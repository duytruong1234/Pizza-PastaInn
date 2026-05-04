import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  user_id: number
  username: string
  email: string
  phone?: string
  role: 'customer' | 'cashier' | 'admin'
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAdmin: () => boolean
  isCashier: () => boolean
  canManageOrders: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAdmin: () => get().user?.role === 'admin',
      isCashier: () => get().user?.role === 'cashier',
      canManageOrders: () => ['admin', 'cashier'].includes(get().user?.role ?? ''),
    }),
    { name: 'pizza-auth' }
  )
)
