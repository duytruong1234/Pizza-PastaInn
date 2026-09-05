'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useAddToCart } from '@/hooks/useAddToCart';

const getImageUrl = (url: string | null) => {
  if (!url) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

export default function FrequentlyOrderedTogether({ dishIds }: { dishIds: number[] }) {
  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { handleAddToCart } = useAddToCart();

  const dishIdsKey = dishIds.join(',');

  useEffect(() => {
    if (!dishIds || dishIds.length === 0) {
      setDishes([]);
      return;
    }

    const fetchTogether = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/recommendations/together?dish_ids=${dishIdsKey}`);
        const json = await res.json();
        if (json.success && json.data) {
          setDishes(json.data);
        } else {
          setDishes([]);
        }
      } catch (error) {
        console.error('Failed to fetch frequently ordered together:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTogether();
  }, [dishIdsKey]);

  if (!dishIds || dishIds.length === 0) return null;

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

  if (!dishes || dishes.length === 0) return null;

  const onAddClick = (dish: any) => {
    handleAddToCart({
      id: dish.dish_id,
      dish_price_id: dish.dish_price_id || '',
      name: dish.dish_name,
      price: dish.price || 0,
      imageUrl: getImageUrl(dish.image),
    });
  };

  return (
    <div className="py-3">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 px-4 uppercase tracking-wider">
        Thường đặt cùng
      </h3>
      <div className="flex flex-col gap-1 px-2">
        {dishes.map((dish, index) => {
          const imageUrl = getImageUrl(dish.image);
          return (
            <div
              key={`together_${dish.dish_id}_${index}`}
              className="flex items-center gap-3 p-2 rounded-lg bg-transparent hover:bg-[#1a1a1a] transition-colors group"
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 border border-white/10">
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
                <h4 className="text-white text-xs font-medium truncate">{dish.dish_name}</h4>
                <div className="text-amber-400 text-xs font-bold">
                  {formatPrice(dish.price || 0)}
                </div>
              </div>
              <button
                onClick={() => onAddClick(dish)}
                className="shrink-0 bg-[#294c29]/60 hover:bg-[#007a3f] text-white text-[10px] font-bold py-1.5 px-3 rounded-full transition-colors opacity-80 group-hover:opacity-100"
              >
                + Thêm
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
