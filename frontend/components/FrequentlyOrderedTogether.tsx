'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Utensils, Plus } from 'lucide-react';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useUI } from '@/components/UIProvider';
import { useCartStore, CartItem } from '@/store/cartStore';
import HalfHalfModal from './HalfHalfModal';

interface TogetherItem {
  dish_id: number;
  dish_name: string;
  category?: string;
  ingredient?: string;
  image: string | null;
  price?: number;
  dish_price_id?: string | null;
  prices?: { dish_price_id: string; size_name: string; crust_name: string; dish_price: number }[];
  // Thống kê gọi kèm: lý do gợi ý theo đơn hàng thực tế
  co_order_count?: number;
  attach_rate?: number;
  reason_dish_names?: string[];
}

const getImageUrl = (url: string | null) => {
  if (!url) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

const DEBOUNCE_MS = 400;

function cartSignature(items: CartItem[]) {
  const dishIds = new Set<number>();
  for (const it of items) {
    if (it.type === 'regular' && it.dish_id) dishIds.add(it.dish_id);
    it.halves?.forEach(h => h.dish_id && dishIds.add(h.dish_id));
  }
  const dish_ids = [...dishIds].sort((a, b) => a - b);
  return { dish_ids, key: dish_ids.join(',') };
}

export default function FrequentlyOrderedTogether() {
  const { theme, lang, td } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';
  const items = useCartStore(s => s.items);
  const [result, setResult] = useState<{ key: string; items: TogetherItem[] } | null>(null);
  const [isHalfHalfOpen, setIsHalfHalfOpen] = useState(false);
  const { handleAddToCart } = useAddToCart();

  const sig = useMemo(() => cartSignature(items), [items]);
  const isEmpty = sig.dish_ids.length === 0;

  useEffect(() => {
    if (isEmpty) return;
    const controller = new AbortController();
    const key = sig.key;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/recommendations/together?dish_ids=${encodeURIComponent(sig.dish_ids.join(','))}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        const rawList: TogetherItem[] = json?.success && Array.isArray(json.data) ? json.data : [];
        setResult({ key, items: rawList });
      } catch {
        if (!controller.signal.aborted) {
          setResult({ key, items: [] });
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [sig.key, sig.dish_ids, isEmpty]);

  if (isEmpty) return null;

  const isLoading = result?.key !== sig.key;
  const inCart = new Set(sig.dish_ids);
  const dishes = (result?.items ?? []).filter(d => !isLoading || !inCart.has(d.dish_id));

  if (isLoading && dishes.length === 0) {
    return (
      <div className="py-3 px-4">
        <div className="h-4 w-32 bg-[#2a2a2a] rounded animate-pulse mb-3"></div>
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 w-full bg-[#2a2a2a] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (dishes.length === 0) return null;

  const onAddClick = (dish: TogetherItem) => {
    const isHalf = dish.dish_name?.toLowerCase().includes('half');
    if (isHalf) {
      setIsHalfHalfOpen(true);
      return;
    }
    const firstPrice = dish.prices?.[0];
    handleAddToCart({
      id: dish.dish_id,
      dish_price_id: dish.dish_price_id || firstPrice?.dish_price_id || '',
      name: dish.dish_name,
      price: dish.price || firstPrice?.dish_price || 0,
      imageUrl: getImageUrl(dish.image),
    });
  };

  return (
    <div className="pt-2 border-t border-dashed border-current/10">
      <div className="flex items-center gap-1.5 mb-2">
        <Utensils size={13} className={isLight ? 'text-[#a82e10]' : 'text-zinc-300'} />
        <h3 className={`text-[11px] font-extrabold uppercase tracking-wider ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
          {isEn ? 'Frequently Ordered Together' : 'Món ngon hay gọi kèm'}
        </h3>
      </div>
      <div className="flex flex-col gap-1.5">
        {dishes.map((dish, index) => {
          const imageUrl = getImageUrl(dish.image);
          const displayPrice = dish.price || dish.prices?.[0]?.dish_price || 0;
          return (
            <div
              key={`together_${dish.dish_id}_${index}`}
              className={`flex items-center gap-2.5 p-2 rounded-xl border transition-colors group ${
                isLight
                  ? 'bg-white hover:bg-stone-50 border-[#e4d8c5]'
                  : 'bg-[#211c18]/75 hover:bg-[#211c18] border-white/[0.08]'
              }`}
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <Image
                  src={imageUrl}
                  alt={dish.dish_name}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized={shouldBypassNextImageOptimization(imageUrl)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs font-bold truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  {td(dish.dish_name)}
                </h4>
                {dish.reason_dish_names?.length ? (
                  <p className={`text-[10.5px] leading-tight truncate ${isLight ? 'text-stone-500' : 'text-zinc-400'}`}>
                    {isEn
                      ? `Ordered with ${dish.reason_dish_names.map(n => td(n)).join(', ')}`
                      : `Hay gọi kèm ${dish.reason_dish_names.map(n => td(n)).join(', ')}`}
                  </p>
                ) : null}
                <div className={`text-xs font-extrabold ${isLight ? 'text-[#a82e10]' : 'text-[#f5c043]'}`}>
                  {formatPrice(displayPrice)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAddClick(dish)}
                className="shrink-0 inline-flex items-center gap-1 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg bg-[#007a3f] hover:bg-[#006030] transition-colors cursor-pointer"
              >
                <Plus size={11} strokeWidth={2.5} />
                <span>{isEn ? 'Add' : 'Thêm'}</span>
              </button>
            </div>
          );
        })}
      </div>

      <HalfHalfModal
        isOpen={isHalfHalfOpen}
        onClose={() => setIsHalfHalfOpen(false)}
      />
    </div>
  );
}
