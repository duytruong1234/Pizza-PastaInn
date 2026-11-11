'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { useUI } from '@/components/UIProvider';
import { useOrderStore } from '@/store/orderStore';
import ComboModal from './ComboModal';
import HalfHalfModal from './HalfHalfModal';

export interface HeroComboItem {
  combo_id: number;
  combo_name: string;
  combo_price: number;
  description?: string | null;
  image_combo?: string | null;
  image?: string | null;
}

export interface HeroVoucherItem {
  voucher_id: number;
  code: string;
  title: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  max_discount?: number;
}

export interface HeroCategoryItem {
  category_id: number;
  category_name: string;
}

export interface HeroPopularDishItem {
  dish_id: number;
  dish_name: string;
  image: string | null;
  category?: string;
}

interface HeroBannerProps {
  combos?: HeroComboItem[];
  vouchers?: HeroVoucherItem[];
  categories?: HeroCategoryItem[];
  popularDishes?: HeroPopularDishItem[];
}

const SLIDE_PHOTOS = [
  'https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=85&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=85&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=85&w=1600&auto=format&fit=crop',
];

const resolveUploadImg = (path?: string | null) => {
  if (!path || !path.trim()) return SLIDE_PHOTOS[0];
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
};

export default function HeroBanner({
  combos = [],
  vouchers = [],
  categories = [],
}: HeroBannerProps) {
  const { theme, lang } = useUI();
  const updateFormData = useOrderStore((s) => s.updateFormData);
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [modalCombo, setModalCombo] = useState<HeroComboItem | null>(null);
  const [isHalfHalfOpen, setIsHalfHalfOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const categoryIds = useMemo(() => {
    const findId = (keyword: string, fallback: number) => {
      const found = categories.find((c) =>
        c.category_name?.toLowerCase().includes(keyword)
      );
      return found?.category_id ?? fallback;
    };
    return {
      pizza: findId('pizza', 1),
      combo: findId('combo', 7),
    };
  }, [categories]);

  const minComboPrice = useMemo(() => {
    const prices = combos
      .map((c) => Number(c.combo_price))
      .filter((p) => Number.isFinite(p) && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 390000;
  }, [combos]);

  const featuredCombo = useMemo(() => {
    if (!combos || combos.length === 0) return null;
    return (
      combos.find((c) => c.combo_name.toLowerCase().includes('combo a')) ||
      combos[0]
    );
  }, [combos]);

  const displayVouchers = useMemo(() => {
    if (!vouchers || vouchers.length === 0) return [];
    // Ưu tiên chọn 3 mã đại diện rõ mức giảm nhất
    const preferred = ['WELCOME20', 'PARTY50K', 'VIP80K'];
    const sorted = [...vouchers].sort((a, b) => {
      const ia = preferred.indexOf(a.code);
      const ib = preferred.indexOf(b.code);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return sorted.slice(0, 3);
  }, [vouchers]);

  const TOTAL_SLIDES = 3;

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % TOTAL_SLIDES);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  }, []);

  useEffect(() => {
    if (isPaused || modalCombo || isHalfHalfOpen) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const timer = setInterval(nextSlide, 6500);
    return () => clearInterval(timer);
  }, [isPaused, modalCombo, isHalfHalfOpen, nextSlide]);

  const handleCopyVoucher = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    updateFormData({ voucher_code: cleanCode });
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(cleanCode);
      }
    } catch {
      // Đã lưu sẵn mã cho trang Thanh toán
    }
    setCopiedCode(cleanCode);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === cleanCode ? null : prev));
    }, 2000);
  };

  return (
    <>
      <section
        aria-label={isEn ? 'Featured promotions' : 'Ưu đãi tại quán'}
        className="pt-1 pb-3.5 select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const endX = e.changedTouches[0]?.clientX ?? touchStartX;
          const diff = touchStartX - endX;
          if (Math.abs(diff) > 45) {
            if (diff > 0) nextSlide();
            else prevSlide();
          }
          setTouchStartX(null);
        }}
      >
        <div
          className={`group relative rounded-2xl overflow-hidden bg-[#120e0c] border ${
            isLight
              ? 'border-[#d8cbb8] shadow-[0_8px_24px_rgba(28,18,8,0.10)]'
              : 'border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.45)]'
          }`}
        >
          {/* Ảnh nền toàn khung với lớp tối tự nhiên kiểu nhiếp ảnh nhà hàng */}
          <div className="absolute inset-0 pointer-events-none">
            <Image
              key={activeSlide}
              src={SLIDE_PHOTOS[activeSlide]}
              alt="Pizza & Pasta Inn"
              fill
              priority={activeSlide === 0}
              sizes="(max-width: 1380px) 100vw, 1380px"
              className="object-cover object-center transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#120e0c]/92 via-[#120e0c]/68 to-[#120e0c]/15" />
          </div>

          {/* Nội dung chính */}
          <div className="relative z-10 flex flex-col justify-between min-h-[216px] sm:min-h-[242px] lg:min-h-[260px] px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-7">
            <div className="max-w-xl">
              {/* Slide 1: Combo */}
              {activeSlide === 0 && (
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-white leading-[1.12]">
                    {isEn ? 'COMBO FEAST FROM ' : 'COMBO TIỆC TỪ '}
                    <span className="text-[#f5c043]">{formatPrice(minComboPrice)}</span>
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-md">
                    {isEn
                      ? 'Includes cheese-crust pizza, oven-baked pasta or BBQ wings, garlic bread, and chilled soft drinks.'
                      : 'Đầy đủ Pizza viền phô mai, Mì Ý đút lò hoặc Cánh gà nướng BBQ, bánh mì bơ tỏi và nước ngọt.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/?category=${categoryIds.combo}`}
                      className="inline-block px-5 py-2.5 rounded-lg bg-[#ee2828] hover:bg-[#d61f1f] text-white text-xs sm:text-sm font-bold transition-colors"
                    >
                      {isEn ? 'View All Combos' : 'Xem thực đơn Combo'}
                    </Link>
                    {featuredCombo && (
                      <button
                        type="button"
                        onClick={() => setModalCombo(featuredCombo)}
                        className="px-4 py-2.5 rounded-lg bg-white/12 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-colors cursor-pointer"
                      >
                        {isEn
                          ? `Quick Order ${featuredCombo.combo_name}`
                          : `Đặt nhanh ${featuredCombo.combo_name}`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Slide 2: Pizza Nửa-Nửa */}
              {activeSlide === 1 && (
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-white leading-[1.12]">
                    {isEn ? 'HALF & HALF PIZZA' : 'PIZZA NỬA - NỬA'}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-md">
                    {isEn
                      ? 'Pick any two pizza toppings on a single freshly baked crust. Available in Regular and Large sizes.'
                      : 'Chọn 2 vị bánh bất kỳ trên cùng một đế bánh nướng lò nóng hổi, áp dụng cho bánh cỡ Vừa và cỡ Lớn.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsHalfHalfOpen(true)}
                      className="px-5 py-2.5 rounded-lg bg-[#ee2828] hover:bg-[#d61f1f] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                      {isEn ? 'Choose 2 Toppings' : 'Chọn 2 vị bánh'}
                    </button>
                    <Link
                      href={`/?category=${categoryIds.pizza}`}
                      className="inline-block px-4 py-2.5 rounded-lg bg-white/12 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-colors"
                    >
                      {isEn ? 'Pizza Menu' : 'Xem các vị Pizza'}
                    </Link>
                  </div>
                </div>
              )}

              {/* Slide 3: Mã ưu đãi đặt trực tuyến */}
              {activeSlide === 2 && (
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-white leading-[1.12]">
                    {isEn ? 'SAVE UP TO ' : 'GIẢM ĐẾN '}
                    <span className="text-[#f5c043]">80.000đ</span>
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-md">
                    {isEn
                      ? 'Select a code below to apply automatically at checkout:'
                      : 'Bấm chọn mã bên dưới để tự động điền sẵn ở bước thanh toán:'}
                  </p>

                  {displayVouchers.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      {displayVouchers.map((v) => {
                        const isCopied = copiedCode === v.code;
                        return (
                          <button
                            key={v.voucher_id}
                            type="button"
                            onClick={() => handleCopyVoucher(v.code)}
                            title={v.description || v.title}
                            className={`inline-flex items-center rounded-lg overflow-hidden border text-xs transition-colors cursor-pointer ${
                              isCopied
                                ? 'bg-[#235328] border-[#235328] text-white'
                                : 'bg-white/95 hover:bg-white border-white text-zinc-900'
                            }`}
                          >
                            <span
                              className={`px-2.5 py-1.5 font-black tracking-wide ${
                                isCopied
                                  ? 'text-white'
                                  : 'bg-[#f5c043] text-zinc-950'
                              }`}
                            >
                              {v.code}
                            </span>
                            <span className="px-2.5 py-1.5 font-bold inline-flex items-center gap-1">
                              {isCopied ? (
                                <>
                                  <Check size={13} />
                                  <span>{isEn ? 'Saved' : 'Đã lưu'}</span>
                                </>
                              ) : v.discount_type === 'percent' ? (
                                isEn ? `${v.discount_value}% OFF` : `Giảm ${v.discount_value}%`
                              ) : isEn ? (
                                `${formatPrice(v.discount_value)} OFF`
                              ) : (
                                `Giảm ${formatPrice(v.discount_value)}`
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Điều hướng tối giản góc dưới */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2" role="tablist">
                {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={
                        isEn ? `Slide ${idx + 1}` : `Banner ${idx + 1}`
                      }
                      onClick={() => setActiveSlide(idx)}
                      className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'w-8 bg-[#f5c043]'
                          : 'w-3 bg-white/35 hover:bg-white/65'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label={isEn ? 'Previous' : 'Trước'}
                  className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label={isEn ? 'Next' : 'Tiếp'}
                  className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {modalCombo && (
        <ComboModal
          isOpen={!!modalCombo}
          onClose={() => setModalCombo(null)}
          comboId={modalCombo.combo_id}
          comboName={modalCombo.combo_name}
          comboPrice={modalCombo.combo_price}
          comboDescription={modalCombo.description || ''}
          imageUrl={resolveUploadImg(modalCombo.image_combo || modalCombo.image)}
        />
      )}

      {isHalfHalfOpen && (
        <HalfHalfModal
          isOpen={isHalfHalfOpen}
          onClose={() => setIsHalfHalfOpen(false)}
        />
      )}
    </>
  );
}
