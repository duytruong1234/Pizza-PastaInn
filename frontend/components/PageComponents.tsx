'use client';

import React from 'react';
import { Pizza } from 'lucide-react';
import { useUI } from '@/components/UIProvider';

export function SearchResultsBanner({ query, count }: { query: string; count: number }) {
  const { theme, lang } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  return (
    <div className="mb-6 text-center">
      <div
        className={`inline-flex items-center gap-2 backdrop-blur-sm px-6 py-3 rounded-full border transition-colors ${
          isLight
            ? 'bg-white/90 text-zinc-900 border-stone-300 shadow-sm'
            : 'bg-white/10 text-white border-white/20'
        }`}
      >
        <span className="text-sm">
          {isEn ? 'Search results for:' : 'Kết quả tìm kiếm cho:'} <strong>&ldquo;{query}&rdquo;</strong>
        </span>
        <span className={`text-xs ${isLight ? 'text-zinc-600' : 'text-gray-300'}`}>
          ({count} {isEn ? 'results' : 'kết quả'})
        </span>
      </div>
    </div>
  );
}

export function EmptyState() {
  const { theme, lang } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Pizza className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-[#9f280a]/70' : 'text-white/60'}`} />
      <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
        {isEn ? 'No dishes found' : 'Không tìm thấy món nào'}
      </h3>
      <p className={`text-sm ${isLight ? 'text-zinc-600' : 'text-gray-400'}`}>
        {isEn ? 'Try searching with a different keyword!' : 'Thử tìm kiếm với từ khóa khác!'}
      </p>
    </div>
  );
}
