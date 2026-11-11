'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  UtensilsCrossed,
  ChevronRight,
  Check,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useRecommendationStore, SavedQuizItem } from '@/store/recommendationStore';
import { useCartStore } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';
import { BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import ComboModal from './ComboModal';
import ProductModal from './ProductModal';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop';

const resolveImg = (p: string | null) => {
  if (!p) return FALLBACK_IMG;
  if (p.startsWith('http')) return p;
  return `${BACKEND_URL}${p}`;
};

export default function SmartQuizBanner() {
  const { openQuiz, savedQuizProfile, clearSavedQuizProfile } = useRecommendationStore();
  const addToCart = useCartStore((s) => s.addToCart);
  const { theme, lang, td, ti, tc, isCartOpen, isCartPinned } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const [isMounted, setIsMounted] = useState(false);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [selectedCombo, setSelectedCombo] = useState<SavedQuizItem | null>(null);
  const [selectedDishItem, setSelectedDishItem] = useState<SavedQuizItem | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleQuickAdd = async (e: React.MouseEvent, item: SavedQuizItem) => {
    e.stopPropagation();
    if (item.item_type === 'combo') {
      setSelectedCombo(item);
      return;
    }

    const key = `quiz_${item.dish.dish_id}`;
    await addToCart({
      type: 'regular',
      dish_id: item.dish.dish_id,
      dish_price_id: item.variant.dish_price_id,
      name: item.dish.dish_name,
      price: item.variant.price,
      quantity: 1,
      imageUrl: resolveImg(item.dish.image),
      options: {
        size:
          item.variant.size_name && item.variant.size_name !== 'Standard'
            ? item.variant.size_name
            : undefined,
        crust:
          item.variant.crust_name && item.variant.crust_name !== 'None'
            ? item.variant.crust_name
            : undefined,
      },
    });
    setAddedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [key]: false }));
    }, 1800);
  };

  const hasSavedPicks =
    isMounted && savedQuizProfile && Array.isArray(savedQuizProfile.items) && savedQuizProfile.items.length > 0;

  if (hasSavedPicks && savedQuizProfile) {
    const tags = isEn ? savedQuizProfile.tagsEn : savedQuizProfile.tagsVi;
    const displayItems = savedQuizProfile.items.slice(0, 3);
    const gridCols =
      isCartPinned && isCartOpen
        ? 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

    return (
      <section className="pt-1 pb-5">
        <div
          className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
            isLight
              ? 'bg-white border-[#ded3c1] shadow-xs'
              : 'bg-[#1c1613] border-white/12 shadow-md'
          }`}
        >
          {/* Header + Taste Profile Tags */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2
                className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                  isLight ? 'text-[#1c1208]' : 'text-white'
                }`}
              >
                {isEn ? 'Recommended For Your Meal' : 'Gợi ý theo khẩu vị của bạn'}
              </h2>

              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span
                    className={`text-xs ${
                      isLight ? 'text-stone-500' : 'text-zinc-400'
                    }`}
                  >
                    {isEn ? 'Preferences:' : 'Đang chọn:'}
                  </span>
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                        isLight
                          ? 'bg-stone-50 text-stone-700 border-stone-200'
                          : 'bg-white/[0.06] text-zinc-200 border-white/12'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
              <button
                type="button"
                onClick={() => openQuiz('home_retake')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ee2828] hover:bg-[#d42020] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>{isEn ? 'Adjust Preferences' : 'Chọn lại khẩu vị'}</span>
              </button>
              <button
                type="button"
                onClick={clearSavedQuizProfile}
                title={isEn ? 'Hide personalized menu' : 'Ẩn mục gợi ý riêng'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? 'border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-zinc-900'
                    : 'border-white/12 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Top 3 Personalized Dish Cards */}
          <div className={`grid ${gridCols} gap-3.5`}>
            {displayItems.map((item) => {
              const imgSrc = resolveImg(item.dish.image);
              const key = `quiz_${item.dish.dish_id}`;
              const isAdded = !!addedMap[key];
              const sizeInfo = [
                item.variant.size_name && item.variant.size_name !== 'Standard'
                  ? td(item.variant.size_name)
                  : '',
                item.variant.crust_name && item.variant.crust_name !== 'None'
                  ? td(item.variant.crust_name)
                  : '',
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <div
                  key={`${item.rank}_${item.dish.dish_id}`}
                  onClick={() => {
                    if (item.item_type === 'combo') {
                      setSelectedCombo(item);
                    } else {
                      setSelectedDishItem(item);
                    }
                  }}
                  className={`group rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5 cursor-pointer ${
                    isLight
                      ? 'bg-[#faf7f2] border-[#e5dccd]'
                      : 'bg-[#14100e] border-white/10'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-black/10">
                      <Image
                        src={imgSrc}
                        alt={item.dish.dish_name}
                        fill
                        sizes="80px"
                        unoptimized={shouldBypassNextImageOptimization(imgSrc)}
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-sm leading-snug line-clamp-1 ${
                          isLight ? 'text-zinc-900' : 'text-white'
                        }`}
                      >
                        {td(item.dish.dish_name)}
                      </h3>

                      <p
                        className={`text-[11px] mt-0.5 truncate ${
                          isLight ? 'text-stone-500' : 'text-zinc-400'
                        }`}
                      >
                        {item.item_type === 'combo'
                          ? isEn
                            ? 'Value Combo'
                            : 'Combo tiết kiệm'
                          : [td(item.dish.category || ''), sizeInfo].filter(Boolean).join(' · ')}
                      </p>

                      {item.reasons?.[0] ? (
                        <p
                          className={`text-[11px] mt-1.5 line-clamp-2 leading-snug ${
                            isLight ? 'text-stone-600' : 'text-zinc-300'
                          }`}
                        >
                          {item.reasons[0]}
                        </p>
                      ) : item.dish.ingredient ? (
                        <p
                          className={`text-[11px] mt-1 line-clamp-1 ${
                            isLight ? 'text-stone-500' : 'text-zinc-400'
                          }`}
                        >
                          {item.item_type === 'combo'
                            ? tc(item.dish.ingredient)
                            : ti(item.dish.ingredient)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-current/10">
                    <span
                      className={`font-extrabold text-sm ${
                        isLight ? 'text-[#a82e10]' : 'text-white'
                      }`}
                    >
                      {formatPrice(item.variant.price)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, item)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isAdded
                          ? 'bg-[#235328] text-white'
                          : 'bg-[#ee2828] hover:bg-[#d42020] text-white'
                      }`}
                    >
                      {isAdded ? <Check size={13} /> : <ShoppingCart size={13} />}
                      <span>
                        {isAdded
                          ? isEn
                            ? 'Added'
                            : 'Đã thêm'
                          : item.item_type === 'combo'
                            ? isEn
                              ? 'Customize'
                              : 'Chọn món'
                            : isEn
                              ? 'Add to Cart'
                              : 'Thêm'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedCombo && (
          <ComboModal
            isOpen={!!selectedCombo}
            onClose={() => setSelectedCombo(null)}
            comboId={selectedCombo.dish.dish_id}
            comboName={selectedCombo.dish.dish_name}
            comboPrice={selectedCombo.variant.price}
            comboDescription={selectedCombo.dish.ingredient || ''}
            imageUrl={resolveImg(selectedCombo.dish.image)}
          />
        )}

        {selectedDishItem && (
          <ProductModal
            isOpen={!!selectedDishItem}
            onClose={() => setSelectedDishItem(null)}
            product={{
              id: selectedDishItem.dish.dish_id,
              name: selectedDishItem.dish.dish_name,
              ingredients: selectedDishItem.dish.ingredient || '',
              basePrice: selectedDishItem.variant.price,
              prices: (
                selectedDishItem.all_variants && selectedDishItem.all_variants.length > 0
                  ? selectedDishItem.all_variants
                  : [selectedDishItem.variant]
              ).map((v) => ({
                dish_price_id: v.dish_price_id,
                size_id: v.size_id ?? null,
                crust_id: v.crust_id ?? null,
                dish_price: v.price,
                size_name: v.size_name,
                crust_name: v.crust_name,
              })),
              imageUrl: resolveImg(selectedDishItem.dish.image),
              dish_type: selectedDishItem.dish.dish_type,
            }}
            categoryName={selectedDishItem.dish.category}
          />
        )}
      </section>
    );
  }

  return (
    <div className="pt-1 pb-5">
      <div
        onClick={() => openQuiz('home_banner')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openQuiz('home_banner');
          }
        }}
        className={`group w-full text-left rounded-2xl border px-4 py-4 sm:px-6 sm:py-5 transition-colors cursor-pointer ${
          isLight
            ? 'bg-white border-[#ded3c1] hover:border-[#c2b299] shadow-xs'
            : 'bg-[#1c1613] border-white/12 hover:border-white/25 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#ee2828] text-white flex items-center justify-center shrink-0">
              <UtensilsCrossed size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2
                className={`text-base sm:text-lg font-extrabold tracking-tight ${
                  isLight ? 'text-[#1c1208]' : 'text-white'
                }`}
              >
                {isEn
                  ? 'Not sure what to order today?'
                  : 'Chưa biết dùng món gì hôm nay?'}
              </h2>
              <p
                className={`text-xs sm:text-sm mt-0.5 ${
                  isLight ? 'text-stone-600' : 'text-zinc-400'
                }`}
              >
                {isEn
                  ? 'Pick your preferred flavor, spice level, and portion size for tailored dish suggestions.'
                  : 'Chọn nhanh vị yêu thích và số người dùng bữa để quán gợi ý món vừa ý.'}
              </p>
            </div>
          </div>

          <div className="flex items-center self-end sm:self-center shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-[#ee2828] group-hover:bg-[#d41f1f] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors">
              <span>{isEn ? 'Choose Preferences' : 'Tư vấn chọn món'}</span>
              <ChevronRight size={16} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
