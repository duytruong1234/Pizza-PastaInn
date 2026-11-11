// Trạng thái mở/đóng hộp thoại "Lựa chọn phù hợp cho bạn" (6 câu hỏi) + Lưu hồ sơ gợi ý & lịch sử xem món
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

/** Header có token nếu khách đã đăng nhập */
export function recHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export interface SavedQuizItem {
  rank: number;
  item_type?: 'dish' | 'combo';
  dish: {
    dish_id: number;
    dish_name: string;
    category: string;
    category_label?: string;
    dish_type: string;
    image: string | null;
    ingredient: string;
  };
  variant: {
    dish_price_id: string;
    size_id?: number | null;
    crust_id?: number | null;
    size_name: string;
    crust_name: string;
    price: number;
  };
  all_variants?: {
    dish_price_id: string;
    size_id?: number | null;
    crust_id?: number | null;
    size_name: string;
    crust_name: string;
    price: number;
  }[];
  match_percent: number;
  reasons: string[];
}

export interface SavedQuizProfile {
  tagsVi: string[];
  tagsEn: string[];
  items: SavedQuizItem[];
  updatedAt: number;
}

export interface RecentViewedDish {
  dish_id: number;
  dish_name: string;
  category?: string;
  viewedAt: number;
}

type RecommendationStore = {
  quizOpen: boolean;
  quizSource: string | null;
  savedQuizProfile: SavedQuizProfile | null;
  recentViewedDishes: RecentViewedDish[];
  openQuiz: (source: string) => void;
  closeQuiz: () => void;
  setSavedQuizProfile: (profile: SavedQuizProfile) => void;
  clearSavedQuizProfile: () => void;
  addRecentViewedDish: (dish: Omit<RecentViewedDish, 'viewedAt'>) => void;
};

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      quizOpen: false,
      quizSource: null,
      savedQuizProfile: null,
      recentViewedDishes: [],
      openQuiz: (source) => set({ quizOpen: true, quizSource: source }),
      closeQuiz: () => set({ quizOpen: false }),
      setSavedQuizProfile: (profile) => set({ savedQuizProfile: profile }),
      clearSavedQuizProfile: () => set({ savedQuizProfile: null }),
      addRecentViewedDish: (dish) => {
        if (!dish.dish_id || dish.dish_name?.toLowerCase().includes('half')) return;
        const filtered = get().recentViewedDishes.filter((d) => d.dish_id !== dish.dish_id);
        set({
          recentViewedDishes: [
            { ...dish, viewedAt: Date.now() },
            ...filtered,
          ].slice(0, 5),
        });
      },
    }),
    {
      name: 'pizza-inn-recommendation-storage',
      partialize: (state) => ({
        savedQuizProfile: state.savedQuizProfile,
        recentViewedDishes: state.recentViewedDishes,
      }),
    }
  )
);
