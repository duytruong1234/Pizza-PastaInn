'use client';

// GĐ2 — Banner trang chủ mở "Trợ lý chọn món"
import { Sparkles, ChevronRight } from 'lucide-react';
import { useRecommendationStore } from '@/store/recommendationStore';

export default function SmartQuizBanner() {
  const openQuiz = useRecommendationStore(s => s.openQuiz);
  return (
    <div className="pt-6">
      <button
        onClick={() => openQuiz('home_banner')}
        className="group w-full text-left relative overflow-hidden rounded-3xl border border-[#ffc107]/25 bg-gradient-to-r from-[#3a1d10] via-[#2a1712] to-[#1a1210] px-5 py-5 sm:px-7 sm:py-6 shadow-[0_10px_35px_rgba(0,0,0,0.35)] hover:border-[#ffc107]/50 transition-colors"
      >
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-[#ee2828]/20 blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#ffc107] text-zinc-950 flex items-center justify-center shrink-0 shadow-lg">
            <Sparkles size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-extrabold text-white tracking-wide">Chưa biết ăn gì? Để chúng tôi chọn giúp</h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">5 câu hỏi · khoảng 30 giây · gợi ý 3 món hợp nhất và cả bữa cho nhóm của bạn</p>
          </div>
          <span className="hidden sm:flex items-center gap-1 bg-[#ee2828] group-hover:bg-[#c81f1f] text-white font-black text-sm px-5 py-3 rounded-2xl shrink-0 transition-colors">
            Bắt đầu <ChevronRight size={16} />
          </span>
          <ChevronRight size={22} className="sm:hidden text-[#ffc107] shrink-0" />
        </div>
      </button>
    </div>
  );
}
