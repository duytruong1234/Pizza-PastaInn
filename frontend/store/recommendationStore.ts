// Trạng thái mở/đóng hộp thoại "Lựa chọn phù hợp cho bạn" (6 câu hỏi)
import { create } from 'zustand';
import { useAuthStore } from './authStore';

/** Header có token nếu khách đã đăng nhập */
export function recHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

type RecommendationStore = {
  quizOpen: boolean;
  quizSource: string | null;
  openQuiz: (source: string) => void;
  closeQuiz: () => void;
};

export const useRecommendationStore = create<RecommendationStore>()((set) => ({
  quizOpen: false,
  quizSource: null,
  openQuiz: (source) => set({ quizOpen: true, quizSource: source }),
  closeQuiz: () => set({ quizOpen: false }),
}));
