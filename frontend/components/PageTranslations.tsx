'use client';

import React from 'react';
import { useUI } from '@/components/UIProvider';
import { Pizza } from 'lucide-react';

export function PromoBanner() {
  const { t } = useUI();
  return (
    <div className="mb-10 text-center">
      <button className="bg-gradient-to-r from-[#9f280a] to-[#ee2828] text-white py-2 px-10 rounded-full font-bold shadow-lg border border-red-500/30 hover:scale-105 transition-transform">
        {t('promo.halfHalf')}
      </button>
    </div>
  );
}

export function SearchResultsBanner({ query, count }: { query: string; count: number }) {
  const { t } = useUI();
  return (
    <div className="mb-6 text-center">
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-white/20">
        <span className="text-sm">{t('search.resultsFor')} <strong>&ldquo;{query}&rdquo;</strong></span>
        <span className="text-xs text-gray-300">({count} {t('search.results')})</span>
      </div>
    </div>
  );
}

export function EmptyState() {
  const { t } = useUI();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Pizza className="w-16 h-16 text-white/60 mx-auto mb-4" />
      <h3 className="text-white text-xl font-bold mb-2">{t('empty.title')}</h3>
      <p className="text-gray-400 text-sm">{t('empty.subtitle')}</p>
    </div>
  );
}
