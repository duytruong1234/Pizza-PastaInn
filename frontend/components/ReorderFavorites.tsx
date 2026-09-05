'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import ProductModal from './ProductModal';
import ComboModal from './ComboModal';
import HalfHalfModal from './HalfHalfModal';
import { useAuthStore } from '@/store/authStore';

const getImageUrl = (url: string | null, isHalfHalf = false) => {
  if (!url) {
    if (isHalfHalf) {
      return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop';
  }
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

const getDishPricing = (dish: any) => {
  const isHalfHalf = dish.dish_name?.toLowerCase().includes('half') || dish.is_half_half;

  if (isHalfHalf) {
    return { isHalfHalf: true, displayPrice: 'Tuỳ chọn 2 vị', isStartingPrice: false };
  }

  if (dish.type === 'combo') {
    const p = dish.prices?.[0]?.dish_price || 0;
    return { isHalfHalf: false, displayPrice: formatPrice(p), isStartingPrice: false };
  }

  const validPrices = (dish.prices || [])
    .map((p: any) => p.dish_price)
    .filter((p: number) => typeof p === 'number' && p > 0);

  if (validPrices.length === 0) {
    const fallback = dish.prices?.[0]?.dish_price || 0;
    if (fallback > 0) {
      return { isHalfHalf: false, displayPrice: formatPrice(fallback), isStartingPrice: false };
    }
    return { isHalfHalf: false, displayPrice: 'Tuỳ chọn', isStartingPrice: false };
  }

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  const hasMultiplePrices = minPrice !== maxPrice;

  return {
    isHalfHalf: false,
    displayPrice: formatPrice(minPrice),
    isStartingPrice: hasMultiplePrices,
  };
};

export default function ReorderFavorites({ userId }: { userId?: number | null }) {
  const { user } = useAuthStore();
  const effectiveUserId = userId ?? user?.user_id ?? null;

  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHalfHalfOpen, setIsHalfHalfOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 290;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (!effectiveUserId) {
      setIsLoading(false);
      setDishes([]);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_BASE}/recommendations/reorder?user_id=${effectiveUserId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setDishes(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch reorder favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, [effectiveUserId]);

  useEffect(() => {
    checkScroll();
  }, [dishes]);

  if (!effectiveUserId) return null;

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-52 bg-[#1e1e1e] rounded-xl animate-pulse" />
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1e1e1e] animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-[#1e1e1e] animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[240px] sm:w-[260px] h-[270px] bg-[#1e1e1e]/80 rounded-2xl animate-pulse border border-white/5 shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!dishes || dishes.length === 0) return null;

  const handleCardClick = (dish: any) => {
    const isHalf = dish.dish_name?.toLowerCase().includes('half') || dish.is_half_half;
    if (isHalf) {
      setIsHalfHalfOpen(true);
      return;
    }
    setSelectedDish(dish);
    setIsModalOpen(true);
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-950/40 text-white font-bold shrink-0">
            <RotateCcw size={18} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
              Đặt Lại Món Yêu Thích
              <span className="hidden sm:inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                Gợi ý riêng cho bạn
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Các món bạn thường hay đặt nhất tại quán
            </p>
          </div>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Cuộn trái"
            className="w-8 h-8 rounded-full bg-[#202020]/90 hover:bg-[#303030] border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Cuộn phải"
            className="w-8 h-8 rounded-full bg-[#202020]/90 hover:bg-[#303030] border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar no-scrollbar scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {dishes.map((dish, index) => {
          const isHalfHalf = dish.dish_name?.toLowerCase().includes('half') || dish.is_half_half;
          const imageUrl = getImageUrl(dish.image, isHalfHalf);
          const pricing = getDishPricing(dish);

          return (
            <div
              key={`reorder_${dish.dish_id}_${index}`}
              onClick={() => handleCardClick(dish)}
              className="group relative w-[240px] sm:w-[260px] shrink-0 bg-gradient-to-b from-[#1c291c]/95 via-[#161f16]/95 to-[#121612]/98 backdrop-blur-md border border-[#007a3f]/30 hover:border-[#007a3f]/70 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-green-950/30 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              {/* Card Hero Image */}
              <div className="relative h-40 w-full overflow-hidden bg-[#1f1f1f]">
                <Image
                  src={imageUrl}
                  alt={dish.dish_name}
                  fill
                  sizes="(max-width: 640px) 240px, 260px"
                  className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  unoptimized={shouldBypassNextImageOptimization(imageUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141814] via-transparent to-black/20" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                    Đã đặt {dish.order_count} lần
                  </span>

                  {dish.last_ordered && (
                    <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-300 bg-black/65 backdrop-blur-md border border-white/15 shadow-sm">
                      {new Date(dish.last_ordered).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="text-white font-bold text-[15px] group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug">
                    {dish.dish_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 font-medium">
                    <span className="text-emerald-400 font-medium">
                      Món quen thuộc của bạn
                    </span>
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 mt-auto">
                  <div className="flex flex-col">
                    {pricing.isHalfHalf ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-md">
                        Tuỳ chọn 2 vị
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                          {pricing.isStartingPrice ? 'Giá từ' : 'Giá'}
                        </span>
                        <span className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
                          {pricing.displayPrice}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 group-hover:from-emerald-500 group-hover:to-green-500 text-white flex items-center justify-center shadow-md shadow-green-950/50 group-hover:scale-110 active:scale-95 transition-all"
                    title="Đặt lại ngay"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <HalfHalfModal
        isOpen={isHalfHalfOpen}
        onClose={() => setIsHalfHalfOpen(false)}
      />

      {selectedDish && selectedDish.type === 'combo' ? (
        <ComboModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDish(null);
          }}
          comboId={selectedDish.dish_id}
          comboName={selectedDish.dish_name}
          comboPrice={selectedDish.prices?.[0]?.dish_price || 0}
          comboDescription=""
          imageUrl={getImageUrl(selectedDish.image)}
        />
      ) : selectedDish ? (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDish(null);
          }}
          product={{
            id: selectedDish.dish_id,
            name: selectedDish.dish_name,
            ingredients: '',
            basePrice: selectedDish.prices?.[0]?.dish_price || 0,
            prices: selectedDish.prices || [],
            imageUrl: getImageUrl(selectedDish.image),
          }}
          categoryName=""
        />
      ) : null}
    </div>
  );
}
