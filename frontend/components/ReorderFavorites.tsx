'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useUI } from '@/components/UIProvider';
import { useWishlistStore } from '@/store/wishlistStore';
import { useRecommendationStore } from '@/store/recommendationStore';
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

const formatIngredientsText = (text: string) => {
  if (!text) return '';
  let cleaned = text.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  cleaned = cleaned.replace(/\(([^)]+)\)/g, (_match, content) => `(${content.replace(/\s+/g, '\u00a0')})`);
  return cleaned
    .replace(/Garilc/gi, 'Garlic')
    .replace(/Gralic/gi, 'Garlic')
    .replace(/Grantin/gi, 'Gratin');
};

interface DishPriceItem {
  dish_price_id?: string;
  dish_price: number;
  size_name?: string;
  crust_name?: string;
}

interface DishItem {
  dish_id: number;
  dish_name: string;
  image: string | null;
  category?: string;
  ingredient?: string;
  dish_type?: string;
  type?: string;
  is_half_half?: boolean;
  price?: number;
  order_count?: number;
  similarity_score?: number;
  match_reasons?: string[];
  prices?: DishPriceItem[];
}

const getDishPricing = (dish: DishItem) => {
  const isHalfHalf = dish.dish_name?.toLowerCase().includes('half') || dish.is_half_half;

  if (isHalfHalf) {
    return { isHalfHalf: true, displayPrice: 'Tuỳ chọn 2 vị', rawPrice: 0 };
  }

  if (dish.type === 'combo') {
    const p = dish.prices?.[0]?.dish_price || 0;
    return { isHalfHalf: false, displayPrice: formatPrice(p), rawPrice: p };
  }

  const validPrices = (dish.prices || [])
    .map((p: DishPriceItem) => p.dish_price)
    .filter((p: number) => typeof p === 'number' && p > 0);

  if (validPrices.length === 0) {
    const fallback = dish.prices?.[0]?.dish_price || dish.price || 0;
    if (fallback > 0) {
      return { isHalfHalf: false, displayPrice: formatPrice(fallback), rawPrice: fallback };
    }
    return { isHalfHalf: false, displayPrice: 'Tuỳ chọn', rawPrice: 0 };
  }

  const minPrice = Math.min(...validPrices);

  return {
    isHalfHalf: false,
    displayPrice: formatPrice(minPrice),
    rawPrice: minPrice,
  };
};

export default function ReorderFavorites({
  userId,
  excludeDishIds = [],
}: {
  userId?: number | null;
  excludeDishIds?: number[];
}) {
  const { user } = useAuthStore();
  const { isCartOpen, isCartPinned, theme, lang, t, td, ti } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';
  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const recentViewedDishes = useRecommendationStore((s) => s.recentViewedDishes);
  const effectiveUserId = userId ?? user?.user_id ?? null;
  const anchorViewedDish = recentViewedDishes[0] ?? null;

  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [suggestions, setSuggestions] = useState<DishItem[]>([]);
  const [sessionSimilar, setSessionSimilar] = useState<DishItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHalfHalfOpen, setIsHalfHalfOpen] = useState(false);

  const [cardsPerView, setCardsPerView] = useState(3);
  const [reorderStartIndex, setReorderStartIndex] = useState(0);
  const [suggStartIndex, setSuggStartIndex] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const updateCardsPerView = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const isPinnedDesktop = isCartPinned && isCartOpen && w >= 1024;
        if (w < 768) {
          setCardsPerView((prev) => (prev === 1 ? prev : 1));
        } else if (w < 1280 || isPinnedDesktop) {
          setCardsPerView((prev) => (prev === 2 ? prev : 2));
        } else {
          setCardsPerView((prev) => (prev === 3 ? prev : 3));
        }
      });
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateCardsPerView);
    };
  }, [isCartOpen, isCartPinned]);

  useEffect(() => {
    let cancelled = false;

    if (!effectiveUserId) {
      setDishes([]);
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_BASE}/recommendations/reorder?user_id=${effectiveUserId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setDishes(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch reorder favorites:', error);
      }
    };

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_BASE}/recommendations/history-suggestions?user_id=${effectiveUserId}&limit=6`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setSuggestions(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch history suggestions:', error);
      }
    };

    Promise.all([fetchFavorites(), fetchSuggestions()]).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId]);

  // Cold-start / Khách chưa đăng nhập (hoặc chưa có đơn): Gợi ý Content-Based theo món vừa xem gần nhất
  useEffect(() => {
    if (!anchorViewedDish?.dish_id) {
      setSessionSimilar([]);
      return;
    }
    if (effectiveUserId && (dishes.length > 0 || suggestions.length > 0)) {
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/recommendations/similar/${anchorViewedDish.dish_id}?limit=6`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) {
          setSessionSimilar(json.data);
          setSuggStartIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) setSessionSimilar([]);
      });

    return () => {
      cancelled = true;
    };
  }, [anchorViewedDish?.dish_id, effectiveUserId, dishes.length, suggestions.length]);

  if (isLoading && effectiveUserId) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-52 bg-[#1e1e1e] rounded-xl animate-pulse" />
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1e1e1e] animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-[#1e1e1e] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pr-6 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[164px] bg-[#1e1e1e]/80 rounded-2xl animate-pulse border border-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  const rawSuggestions =
    suggestions && suggestions.length > 0 ? suggestions : sessionSimilar;
  const reorderIdSet = new Set((dishes || []).map((d) => d.dish_id));
  const excludedSet = new Set([...excludeDishIds, ...reorderIdSet]);
  const activeSuggestions = (rawSuggestions || []).filter(
    (item) => item.type === 'combo' || !excludedSet.has(item.dish_id)
  );
  const isSessionFallback =
    (!suggestions || suggestions.length === 0) &&
    sessionSimilar.length > 0 &&
    !!anchorViewedDish;

  if ((!dishes || dishes.length === 0) && (!activeSuggestions || activeSuggestions.length === 0)) {
    return null;
  }

  const maxReorderStart = Math.max(0, dishes.length - cardsPerView);
  const safeReorderStart = Math.min(reorderStartIndex, maxReorderStart);
  const canScrollLeft = safeReorderStart > 0;
  const canScrollRight = safeReorderStart < maxReorderStart;
  const visibleReorder = dishes.slice(safeReorderStart, safeReorderStart + cardsPerView);

  const maxSuggStart = Math.max(0, activeSuggestions.length - cardsPerView);
  const safeSuggStart = Math.min(suggStartIndex, maxSuggStart);
  const canSuggScrollLeft = safeSuggStart > 0;
  const canSuggScrollRight = safeSuggStart < maxSuggStart;
  const visibleSuggestions = activeSuggestions.slice(safeSuggStart, safeSuggStart + cardsPerView);

  const gridColsClass =
    cardsPerView === 1
      ? 'grid-cols-1'
      : cardsPerView === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  const handleCardClick = (dish: DishItem) => {
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
      {/* Reorder Section */}
      {dishes && dishes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg md:text-xl font-extrabold tracking-wide transition-colors ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
                {t('home.reorder_title')}
              </h2>
              <p className={`text-xs transition-colors ${isLight ? 'text-[#6b5c4c]' : 'text-gray-400'}`}>
                {t('home.reorder_desc')}
              </p>
            </div>

            {dishes.length > cardsPerView && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReorderStartIndex(Math.max(0, safeReorderStart - 1))}
                  disabled={!canScrollLeft}
                  aria-label="Món trước"
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-[#f3ece0] border-[#d6c7b2] text-[#1c1208]'
                      : 'bg-[#202020]/90 hover:bg-[#303030] border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setReorderStartIndex(Math.min(maxReorderStart, safeReorderStart + 1))}
                  disabled={!canScrollRight}
                  aria-label="Món tiếp theo"
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-[#f3ece0] border-[#d6c7b2] text-[#1c1208]'
                      : 'bg-[#202020]/90 hover:bg-[#303030] border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          <div className={`grid ${gridColsClass} gap-x-8 sm:gap-x-10 gap-y-5 sm:gap-y-6 pr-4 sm:pr-8 lg:pr-9 py-2 overflow-visible`}>
            {visibleReorder.map((dish, idx) => {
              const actualIndex = safeReorderStart + idx;
              const isHalfHalf = dish.dish_name?.toLowerCase().includes('half') || dish.is_half_half;
              const imageUrl = getImageUrl(dish.image, isHalfHalf);
              const pricing = getDishPricing(dish);
              const isRed = actualIndex % 2 === 0;
              const bgClass = isRed
                ? isLight
                  ? 'bg-[#a82e10]/92 shadow-[0_10px_28px_rgba(168,46,16,0.22)] border border-[#822109]/20'
                  : 'bg-[#9f280a]/65 shadow-xl'
                : isLight
                  ? 'bg-[#235328]/92 shadow-[0_10px_28px_rgba(35,83,40,0.22)] border border-[#1b401f]/20'
                  : 'bg-[#294c29]/65 shadow-xl';
              const subtitle =
                ti(dish.ingredient || '') ||
                (isHalfHalf
                  ? t('product.half_half_desc')
                  : t('home.ordered_times').replace('{count}', String(dish.order_count || 1)));

              return (
                <div
                  key={`reorder_${dish.dish_id}_${actualIndex}`}
                  onClick={() => handleCardClick(dish)}
                  className={`group relative flex items-center ${bgClass} rounded-2xl p-4 sm:p-5 min-h-[152px] sm:min-h-[160px] lg:min-h-[172px] w-full overflow-visible transition-transform duration-300 hover:-translate-y-1 cursor-pointer`}
                >
                  {/* Content Area (Left) */}
                  <div className="flex flex-col flex-1 h-full py-0.5 justify-center text-left pr-[92px] sm:pr-28 lg:pr-32 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg leading-tight line-clamp-1">
                        {td(dish.dish_name)}
                      </h3>
                      {dish.type !== 'combo' && !pricing.isHalfHalf && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist({
                              dish_id: dish.dish_id,
                              dish_name: dish.dish_name,
                              image: imageUrl,
                              ingredient: dish.ingredient || '',
                              category: dish.category,
                              dish_type: dish.dish_type,
                              min_price: pricing.rawPrice,
                              prices: dish.prices,
                            });
                          }}
                          title={
                            wishlistItems.some((item) => item.dish_id === dish.dish_id)
                              ? t('product.wishlist_remove')
                              : t('product.wishlist_add')
                          }
                          className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-all active:scale-95 cursor-pointer ${
                            wishlistItems.some((item) => item.dish_id === dish.dish_id)
                              ? 'bg-white border-white text-[#ee2828] shadow-md'
                              : 'bg-black/20 hover:bg-black/35 border-white/30 text-white/90'
                          }`}
                        >
                          <Heart
                            size={13}
                            className={
                              wishlistItems.some((item) => item.dish_id === dish.dish_id)
                                ? 'fill-[#ee2828] text-[#ee2828]'
                                : ''
                            }
                          />
                        </button>
                      )}
                    </div>

                    {subtitle && (
                      <p className="text-gray-200/90 text-[11px] lg:text-xs leading-snug mb-3 line-clamp-2">
                        {subtitle}
                      </p>
                    )}

                    <div className={`flex items-center justify-start gap-2 flex-wrap ${subtitle ? 'mt-auto' : 'mt-3'}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(dish);
                        }}
                        className={`${
                          isRed ? 'bg-[#007a3f] hover:bg-green-700' : 'bg-[#ee2828] hover:bg-red-700'
                        } text-white text-[11px] lg:text-xs font-bold px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-md shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer`}
                      >
                        {pricing.isHalfHalf ? t('product.choose_flavor') : t('product.add_to_cart')}
                      </button>
                      <div className="bg-white px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-md text-xs lg:text-sm font-extrabold shadow-inner shrink-0">
                        <span className={isRed ? 'text-[#ee2828]' : 'text-[#007a3f]'}>
                          {pricing.isHalfHalf ? t('product.half_half_price') : pricing.displayPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Circular Dish Image (Right, protruding slightly) */}
                  <div className="absolute w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-[4px] border-white/90 shadow-2xl flex-shrink-0 z-10 transition-transform duration-500 group-hover:rotate-[12deg] group-hover:scale-105 top-1/2 -translate-y-1/2 right-[-10px] sm:right-[-20px] lg:right-[-22px]">
                    <div className="w-full h-full bg-pizza-cream relative">
                      <Image
                        src={imageUrl}
                        alt={dish.dish_name}
                        fill
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 144px"
                        unoptimized={shouldBypassNextImageOptimization(imageUrl)}
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      {activeSuggestions && activeSuggestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-lg md:text-xl font-extrabold tracking-wide transition-colors ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
                {isSessionFallback
                  ? isEn
                    ? `Similar To "${td(anchorViewedDish?.dish_name || '')}"`
                    : `Món Ngon Cùng Vị Với "${td(anchorViewedDish?.dish_name || '')}"`
                  : t('home.suggest_title')}
              </h2>
              <p className={`text-xs transition-colors ${isLight ? 'text-[#6b5c4c]' : 'text-gray-400'}`}>
                {isSessionFallback
                  ? isEn
                    ? 'Selected based on shared ingredients and flavors with the dish you recently viewed'
                    : 'Tuyển chọn những món có thành phần và hương vị gần gũi với món bạn vừa xem'
                  : t('home.suggest_desc')}
              </p>
            </div>

            {activeSuggestions.length > cardsPerView && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSuggStartIndex(Math.max(0, safeSuggStart - 1))}
                  disabled={!canSuggScrollLeft}
                  aria-label="Món trước"
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-[#f3ece0] border-[#d6c7b2] text-[#1c1208]'
                      : 'bg-[#202020]/90 hover:bg-[#303030] border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setSuggStartIndex(Math.min(maxSuggStart, safeSuggStart + 1))}
                  disabled={!canSuggScrollRight}
                  aria-label="Món tiếp theo"
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-[#f3ece0] border-[#d6c7b2] text-[#1c1208]'
                      : 'bg-[#202020]/90 hover:bg-[#303030] border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          <div className={`grid ${gridColsClass} gap-x-8 sm:gap-x-10 gap-y-5 sm:gap-y-6 pr-4 sm:pr-8 lg:pr-9 py-2 overflow-visible`}>
            {visibleSuggestions.map((dish, idx) => {
              const actualIndex = safeSuggStart + idx;
              const isHalfHalf = dish.dish_name?.toLowerCase().includes('half') || dish.is_half_half;
              const imageUrl = getImageUrl(dish.image, isHalfHalf);
              const pricing = getDishPricing(dish);
              const isRed = actualIndex % 2 === 0;
              const bgClass = isRed
                ? isLight
                  ? 'bg-[#a82e10]/92 shadow-[0_10px_28px_rgba(168,46,16,0.22)] border border-[#822109]/20'
                  : 'bg-[#9f280a]/65 shadow-xl'
                : isLight
                  ? 'bg-[#235328]/92 shadow-[0_10px_28px_rgba(35,83,40,0.22)] border border-[#1b401f]/20'
                  : 'bg-[#294c29]/65 shadow-xl';
              const reasonLine =
                dish.match_reasons && dish.match_reasons.length > 0
                  ? dish.match_reasons[0]
                  : '';
              const subtitle = ti(dish.ingredient || '');

              const onSelectSuggestion = () => {
                handleCardClick(dish);
              };

              return (
                <div
                  key={`sugg_${dish.dish_id}_${actualIndex}`}
                  onClick={onSelectSuggestion}
                  className={`group relative flex items-center ${bgClass} rounded-2xl p-4 sm:p-5 min-h-[152px] sm:min-h-[160px] lg:min-h-[172px] w-full overflow-visible transition-transform duration-300 hover:-translate-y-1 cursor-pointer`}
                >
                  {/* Content Area (Left) */}
                  <div className="flex flex-col flex-1 h-full py-0.5 justify-center text-left pr-[92px] sm:pr-28 lg:pr-32 min-w-0">
                    {reasonLine && (
                      <p className="text-white/80 text-[11px] font-medium truncate mb-0.5">
                        {reasonLine}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg leading-tight line-clamp-1">
                        {td(dish.dish_name)}
                      </h3>
                      {dish.type !== 'combo' && !pricing.isHalfHalf && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist({
                              dish_id: dish.dish_id,
                              dish_name: dish.dish_name,
                              image: imageUrl,
                              ingredient: dish.ingredient || '',
                              category: dish.category,
                              dish_type: dish.dish_type,
                              min_price: pricing.rawPrice,
                              prices: dish.prices,
                            });
                          }}
                          title={
                            wishlistItems.some((item) => item.dish_id === dish.dish_id)
                              ? t('product.wishlist_remove')
                              : t('product.wishlist_add')
                          }
                          className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 transition-all active:scale-95 cursor-pointer ${
                            wishlistItems.some((item) => item.dish_id === dish.dish_id)
                              ? 'bg-white border-white text-[#ee2828] shadow-md'
                              : 'bg-black/20 hover:bg-black/35 border-white/30 text-white/90'
                          }`}
                        >
                          <Heart
                            size={13}
                            className={
                              wishlistItems.some((item) => item.dish_id === dish.dish_id)
                                ? 'fill-[#ee2828] text-[#ee2828]'
                                : ''
                            }
                          />
                        </button>
                      )}
                    </div>

                    {subtitle && (
                      <p className="text-gray-200/90 text-[11px] lg:text-xs leading-snug mb-3 line-clamp-2">
                        {subtitle}
                      </p>
                    )}

                    <div className={`flex items-center justify-start gap-2 flex-wrap ${subtitle ? 'mt-auto' : 'mt-3'}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSuggestion();
                        }}
                        className={`${
                          isRed ? 'bg-[#007a3f] hover:bg-green-700' : 'bg-[#ee2828] hover:bg-red-700'
                        } text-white text-[11px] lg:text-xs font-bold px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-md shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer`}
                      >
                        {pricing.isHalfHalf ? t('product.choose_flavor') : t('product.add_to_cart')}
                      </button>
                      <div className="bg-white px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-md text-xs lg:text-sm font-extrabold shadow-inner shrink-0">
                        <span className={isRed ? 'text-[#ee2828]' : 'text-[#007a3f]'}>
                          {pricing.isHalfHalf ? t('product.half_half_price') : pricing.displayPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Circular Dish Image (Right, protruding slightly) */}
                  <div className="absolute w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-[4px] border-white/90 shadow-2xl flex-shrink-0 z-10 transition-transform duration-500 group-hover:rotate-[12deg] group-hover:scale-105 top-1/2 -translate-y-1/2 right-[-10px] sm:right-[-20px] lg:right-[-22px]">
                    <div className="w-full h-full bg-pizza-cream relative">
                      <Image
                        src={imageUrl}
                        alt={dish.dish_name}
                        fill
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 144px"
                        unoptimized={shouldBypassNextImageOptimization(imageUrl)}
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals (chỉ mount khi mở) */}
      {isHalfHalfOpen && (
        <HalfHalfModal
          isOpen={isHalfHalfOpen}
          onClose={() => setIsHalfHalfOpen(false)}
        />
      )}

      {isModalOpen && selectedDish && selectedDish.type === 'combo' ? (
        <ComboModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDish(null);
          }}
          comboId={selectedDish.dish_id}
          comboName={selectedDish.dish_name}
          comboPrice={selectedDish.prices?.[0]?.dish_price || 0}
          comboDescription={selectedDish.ingredient || ''}
          imageUrl={getImageUrl(selectedDish.image)}
        />
      ) : isModalOpen && selectedDish ? (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDish(null);
          }}
          product={{
            id: selectedDish.dish_id,
            name: selectedDish.dish_name,
            ingredients: selectedDish.ingredient || '',
            basePrice: selectedDish.prices?.[0]?.dish_price || 0,
            prices: selectedDish.prices || [],
            imageUrl: getImageUrl(selectedDish.image),
            dish_type: selectedDish.dish_type,
          }}
          categoryName={selectedDish.category || ''}
        />
      ) : null}
    </div>
  );
}
