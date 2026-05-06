'use client';

import React from 'react';
import { Pizza } from 'lucide-react';

export function SearchResultsBanner({ query, count }: { query: string; count: number }) {
  return (
    <div className="mb-6 text-center">
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-white/20">
        <span className="text-sm">{"Search results for:"} <strong>&ldquo;{query}&rdquo;</strong></span>
        <span className="text-xs text-gray-300">({count} {"results"})</span>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Pizza className="w-16 h-16 text-white/60 mx-auto mb-4" />
      <h3 className="text-white text-xl font-bold mb-2">{"No items found"}</h3>
      <p className="text-gray-400 text-sm">{"Try searching with different keywords!"}</p>
    </div>
  );
}
