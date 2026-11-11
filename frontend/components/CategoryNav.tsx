'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Clock, Flame, ArrowUpRight, UtensilsCrossed } from 'lucide-react';
import { useUI } from '@/components/UIProvider';
import { useRecommendationStore } from '@/store/recommendationStore';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import HalfHalfModal from './HalfHalfModal';

type Category = {
  category_id: number;
  category_name: string;
};

type SuggestionItem = {
  id: string;
  name: string;
  priceText: string;
  imageUrl: string;
  searchKeyword: string;
};

interface RawDishPrice {
  dish_price?: number;
}

interface RawDish {
  dish_id: number;
  dish_name: string;
  image?: string | null;
  is_half_half?: boolean;
  prices?: RawDishPrice[];
}

interface RawCombo {
  combo_id: number;
  combo_name: string;
  combo_price?: number;
  image?: string | null;
  image_combo?: string | null;
}

const RECENT_SEARCHES_KEY = 'pizzagenie_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=160&auto=format&fit=crop';

const resolveImageUrl = (path?: string | null) => {
  if (!path) return FALLBACK_THUMB;
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
};

export default function CategoryNav({
  categories = [],
}: {
  categories?: Category[];
  activeCategoryId?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, isCartOpen, isCartPinned, lang, td } = useUI();
  const openQuiz = useRecommendationStore((s) => s.openQuiz);
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const urlSearch = searchParams.get('search') || '';
  const activeCategoryParam = searchParams.get('category');

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(urlSearch);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isHalfHalfModalOpen, setIsHalfHalfModalOpen] = useState(false);

  // Sticky & scroll states
  const [isScrolled, setIsScrolled] = useState(false);
  const [canScrollPillsLeft, setCanScrollPillsLeft] = useState(false);
  const [canScrollPillsRight, setCanScrollPillsRight] = useState(false);

  // Dữ liệu gợi ý tìm kiếm
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularItems, setPopularItems] = useState<SuggestionItem[]>([]);
  const [allCatalogItems, setAllCatalogItems] = useState<SuggestionItem[]>([]);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pillScrollRef = useRef<HTMLDivElement>(null);
  const pillItemRefs = useRef<Array<HTMLElement | null>>([]);

  const displayCategories = categories;

  // Đồng bộ ô input khi URL thay đổi
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery(urlSearch);
    setDebouncedQuery(urlSearch);
  }, [urlSearch]);

  // Debounce 250ms cho từ khoá đang nhập
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Đọc tìm kiếm gần đây từ localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRecentSearches(
            parsed
              .filter((item): item is string => typeof item === 'string')
              .slice(0, MAX_RECENT_SEARCHES)
          );
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Lắng nghe sự kiện cuộn của #main-scroll-container (chỉ cập nhật state khi vượt ngưỡng 24px)
  const isScrolledRef = useRef(false);
  useEffect(() => {
    const mainEl = document.getElementById('main-scroll-container');
    if (!mainEl) return;

    const handleScroll = () => {
      const nextScrolled = mainEl.scrollTop > 24;
      if (nextScrolled !== isScrolledRef.current) {
        isScrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }
    };
    handleScroll();
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  // Kiểm tra trạng thái tràn ngang của hàng pill để hiện/ẩn lớp mờ mép phải/trái
  const checkPillOverflow = useCallback(() => {
    const el = pillScrollRef.current;
    if (!el) return;
    setCanScrollPillsLeft(el.scrollLeft > 6);
    setCanScrollPillsRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkPillOverflow();
    const el = pillScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkPillOverflow, { passive: true });
    }
    window.addEventListener('resize', checkPillOverflow);
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkPillOverflow);
      }
      window.removeEventListener('resize', checkPillOverflow);
    };
  }, [checkPillOverflow, displayCategories.length, isCartOpen, isCartPinned]);

  // Tự cuộn nút pill đang chọn vào giữa vùng nhìn
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let activeIdx = 0;
    if (isHalfHalfModalOpen) {
      activeIdx = displayCategories.length + 1;
    } else if (activeCategoryParam && !urlSearch) {
      const foundIdx = displayCategories.findIndex(
        (c) => String(c.category_id) === activeCategoryParam
      );
      if (foundIdx >= 0) activeIdx = foundIdx + 1;
    }

    const targetEl = pillItemRefs.current[activeIdx];
    if (targetEl && pillScrollRef.current) {
      targetEl.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeCategoryParam, urlSearch, isHalfHalfModalOpen, displayCategories]);

  // Phím tắt "/" để focus nhanh vào ô tìm kiếm trên desktop
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tải danh sách món bán chạy & catalog khi người dùng focus lần đầu
  useEffect(() => {
    if (!isFocused || hasLoadedCatalog) return;
    let cancelled = false;

    const loadSuggestionsData = async () => {
      try {
        const [popRes, dishesRes, combosRes] = await Promise.all([
          fetch(`${API_BASE}/recommendations/popular`).catch(() => null),
          fetch(`${API_BASE}/menu/dishes`).catch(() => null),
          fetch(`${API_BASE}/menu/combos`).catch(() => null),
        ]);

        if (cancelled) return;

        if (popRes?.ok) {
          const popJson = await popRes.json();
          if (popJson.success && Array.isArray(popJson.data)) {
            const mappedPop: SuggestionItem[] = (popJson.data as RawDish[])
              .slice(0, 4)
              .map((d) => {
                const isHalf = d.dish_name?.toLowerCase().includes('half') || d.is_half_half;
                const validPrices = (d.prices || [])
                  .map((p) => p.dish_price ?? 0)
                  .filter((p) => typeof p === 'number' && p > 0);
                const minPrice =
                  validPrices.length > 0
                    ? Math.min(...validPrices)
                    : d.prices?.[0]?.dish_price || 0;

                return {
                  id: `pop-${d.dish_id}`,
                  name: d.dish_name,
                  priceText: isHalf
                    ? 'Tuỳ chọn 2 vị'
                    : minPrice > 0
                      ? formatPrice(minPrice)
                      : 'Tuỳ chọn',
                  imageUrl: resolveImageUrl(d.image),
                  searchKeyword: d.dish_name,
                };
              });
            setPopularItems(mappedPop);
          }
        }

        const catalog: SuggestionItem[] = [];
        if (dishesRes?.ok) {
          const dishesJson = await dishesRes.json();
          if (dishesJson.success && Array.isArray(dishesJson.data)) {
            (dishesJson.data as RawDish[]).forEach((d) => {
              const isHalf = d.dish_name?.toLowerCase().includes('half') || d.is_half_half;
              const validPrices = (d.prices || [])
                .map((p) => p.dish_price ?? 0)
                .filter((p) => typeof p === 'number' && p > 0);
              const minPrice =
                validPrices.length > 0
                  ? Math.min(...validPrices)
                  : d.prices?.[0]?.dish_price || 0;

              catalog.push({
                id: `dish-${d.dish_id}`,
                name: d.dish_name,
                priceText: isHalf
                  ? 'Tuỳ chọn 2 vị'
                  : minPrice > 0
                    ? formatPrice(minPrice)
                    : 'Tuỳ chọn',
                imageUrl: resolveImageUrl(d.image),
                searchKeyword: d.dish_name,
              });
            });
          }
        }

        if (combosRes?.ok) {
          const combosJson = await combosRes.json();
          if (combosJson.success && Array.isArray(combosJson.data)) {
            (combosJson.data as RawCombo[]).forEach((c) => {
              catalog.push({
                id: `combo-${c.combo_id}`,
                name: c.combo_name,
                priceText: c.combo_price ? formatPrice(c.combo_price) : 'Combo',
                imageUrl: resolveImageUrl(c.image_combo || c.image),
                searchKeyword: c.combo_name,
              });
            });
          }
        }

        setAllCatalogItems(catalog);
        setHasLoadedCatalog(true);
      } catch {
        // ignore network error
      }
    };

    loadSuggestionsData();
    return () => {
      cancelled = true;
    };
  }, [isFocused, hasLoadedCatalog]);

  const saveRecentSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const updated = [
      cleaned,
      ...recentSearches.filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Kết quả lọc nhanh khi đang nhập (tối đa 6 món)
  const filteredSuggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return allCatalogItems.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 6);
  }, [debouncedQuery, allCatalogItems]);

  // Danh sách các mục có thể điều hướng bằng bàn phím
  const navigableOptions = useMemo(() => {
    if (debouncedQuery) {
      return filteredSuggestions.map((item) => ({
        type: 'dish' as const,
        keyword: item.searchKeyword,
        item,
      }));
    }
    return [
      ...recentSearches.map((term) => ({
        type: 'recent' as const,
        keyword: term,
      })),
      ...popularItems.map((item) => ({
        type: 'popular' as const,
        keyword: item.searchKeyword,
        item,
      })),
    ];
  }, [debouncedQuery, filteredSuggestions, recentSearches, popularItems]);

  const executeSearch = (keyword: string) => {
    const trimmed = keyword.trim();
    setSearchQuery(trimmed);
    setIsFocused(false);
    setActiveIndex(-1);

    if (trimmed) {
      saveRecentSearch(trimmed);
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      const categoryParam = searchParams.get('category');
      router.push(categoryParam ? `/?category=${categoryParam}` : '/');
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    executeSearch(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isFocused) setIsFocused(true);
      if (navigableOptions.length > 0) {
        setActiveIndex((prev) => (prev + 1) % navigableOptions.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isFocused) setIsFocused(true);
      if (navigableOptions.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? navigableOptions.length - 1 : prev - 1));
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isFocused && activeIndex >= 0 && activeIndex < navigableOptions.length) {
        executeSearch(navigableOptions[activeIndex].keyword);
      } else {
        executeSearch(searchQuery);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setActiveIndex(-1);
    const categoryParam = searchParams.get('category');
    router.push(categoryParam ? `/?category=${categoryParam}` : '/');
    inputRef.current?.focus();
  };

  // Điều hướng hàng pill bằng phím mũi tên Trái / Phải
  const handlePillKeyDown = (e: React.KeyboardEvent<HTMLElement>, index: number) => {
    const totalPills = displayCategories.length + 2; // Nổi bật + categories + Nửa-Nửa
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (index + 1) % totalPills;
      pillItemRefs.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + totalPills) % totalPills;
      pillItemRefs.current[prevIdx]?.focus();
    }
  };

  const scrollMainToTopOrSection = () => {
    const mainEl = document.getElementById('main-scroll-container');
    if (!mainEl) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    mainEl.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const showDropdown =
    isFocused &&
    (debouncedQuery.length > 0 || recentSearches.length > 0 || popularItems.length > 0);

  // Chỉ MỘT pill active tại một thời điểm
  const isFeaturedActive = !isHalfHalfModalOpen && !activeCategoryParam && !urlSearch;

  const isPinnedDesktop = isCartPinned && isCartOpen;

  const getPillClassName = (isActive: boolean) => {
    const sizeClass = isPinnedDesktop
      ? 'h-8.5 px-2.5 sm:px-3 text-[11.5px]'
      : 'h-9 px-3 sm:px-3.5 text-[12px] sm:text-[12.5px]';
    const base = `flex-none snap-start inline-flex items-center justify-center gap-1.5 ${sizeClass} rounded-full font-semibold uppercase tracking-[0.02em] whitespace-nowrap border transition-all duration-200 motion-reduce:transition-none cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5c043]`;
    if (isActive) {
      return `${base} bg-[#f5c043] border-[#f5c043] text-zinc-950 font-bold shadow-[0_2px_10px_rgba(245,192,67,0.3)]`;
    }
    if (isLight) {
      return `${base} bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200/80 hover:border-zinc-300`;
    }
    return `${base} bg-white/[0.07] border-white/[0.14] text-white/85 hover:bg-white/[0.14] hover:text-white`;
  };

  return (
    <div
      className={`relative w-full z-30 border-b transition-all duration-200 motion-reduce:transition-none backdrop-blur-md ${
        isScrolled
          ? isLight
            ? 'bg-white/95 border-zinc-200 shadow-sm py-2.5'
            : 'bg-[#181411]/92 border-white/[0.08] shadow-md py-2.5'
          : isLight
            ? 'bg-white/92 border-zinc-200 py-3'
            : 'bg-[#181411]/85 border-white/[0.08] py-3'
      }`}
    >
      {/* Container chung đồng bộ lề trái/phải với nội dung menu bên dưới */}
      <div
        className={`w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3 ${
          isCartPinned && isCartOpen
            ? '2xl:flex-row 2xl:items-center 2xl:justify-between 2xl:gap-3'
            : 'xl:flex-row xl:items-center xl:justify-between xl:gap-3'
        }`}
      >
        {/* Hàng / Cột Ô Tìm Kiếm (Trên mobile/tablet nằm hàng trên; trên desktop nằm bên phải cùng hàng với pill) */}
        <div
          ref={containerRef}
          className={`relative w-full shrink-0 ${
            isCartPinned && isCartOpen
              ? 'order-1 2xl:order-2 2xl:w-[225px]'
              : 'order-1 xl:order-2 xl:w-[250px] 2xl:w-[285px]'
          }`}
        >
          <form
            onSubmit={handleSearch}
            className={`group relative flex items-center w-full h-[40px] rounded-[12px] pl-3.5 pr-3 border transition-all duration-200 motion-reduce:transition-none ${
              isLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-900 focus-within:bg-white focus-within:border-[#d4a017] focus-within:shadow-[0_0_0_3px_rgba(245,192,67,0.28)]'
                : 'bg-[#241e1a] border-white/[0.14] text-white focus-within:border-[#f5c043] focus-within:shadow-[0_0_0_3px_rgba(245,192,67,0.22)]'
            }`}
          >
            {/* Icon kính lúp bên trái */}
            <Search
              size={17}
              strokeWidth={2.2}
              aria-hidden="true"
              className={`shrink-0 mr-2.5 transition-colors duration-200 ${
                isFocused
                  ? 'text-[#f5c043]'
                  : isLight
                    ? 'text-[#64748B]'
                    : 'text-[#94A3B8]'
              }`}
            />

            {/* Input tìm kiếm */}
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-label={isEn ? 'Search dishes, combos' : 'Tìm kiếm món ăn, combo'}
              aria-expanded={showDropdown}
              aria-controls="search-suggestions-listbox"
              aria-autocomplete="list"
              placeholder={isEn ? 'Search dishes, combos...' : 'Tìm kiếm món ăn, combo...'}
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveIndex(-1);
                if (!isFocused) setIsFocused(true);
              }}
              onKeyDown={handleKeyDown}
              className={`w-full bg-transparent outline-none font-sans text-[16px] sm:text-[14px] leading-normal [&::-webkit-search-cancel-button]:hidden ${
                isLight
                  ? 'text-[#1c1208] placeholder:text-[#57534E]'
                  : 'text-white placeholder:text-[#94A3B8]'
              }`}
            />

            {/* Nút xoá (X) hoặc gợi ý phím tắt "/" */}
            {searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Xoá nội dung tìm kiếm"
                title="Xoá nội dung tìm kiếm"
                className={`ml-2 p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? 'text-[#57534E] hover:text-[#ee2828] hover:bg-black/5'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
                }`}
              >
                <X size={15} strokeWidth={2.3} />
              </button>
            ) : (
              !isFocused && (
                <kbd
                  aria-hidden="true"
                  className={`hidden sm:inline-flex items-center justify-center ml-2 px-1.5 h-5 min-w-[20px] rounded text-[11px] font-mono font-semibold border select-none pointer-events-none ${
                    isLight
                      ? 'bg-white/80 text-[#64748B] border-[#d4c9b8]'
                      : 'bg-white/[0.06] text-[#94A3B8] border-white/15'
                  }`}
                >
                  /
                </kbd>
              )
            )}
          </form>

          {/* Dropdown gợi ý khi focus */}
          {showDropdown && (
            <div
              id="search-suggestions-listbox"
              role="listbox"
              aria-label="Gợi ý tìm kiếm"
              className={`absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${
                isLight
                  ? 'bg-white border-[#dfd3bf] text-[#1c1208]'
                  : 'bg-[#1B1F32] border-white/15 text-white'
              }`}
            >
              {debouncedQuery ? (
                filteredSuggestions.length > 0 ? (
                  <div className="py-1.5">
                    <div
                      className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                        isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {isEn ? `Suggested dishes (${filteredSuggestions.length})` : `Gợi ý món ăn (${filteredSuggestions.length})`}
                    </div>
                    {filteredSuggestions.map((item, idx) => {
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => executeSearch(item.searchKeyword)}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer ${
                            isActive
                              ? isLight
                                ? 'bg-[#fef3c7] text-[#1c1208]'
                                : 'bg-white/[0.1] text-white'
                              : isLight
                                ? 'hover:bg-stone-100'
                                : 'hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                            />
                            <span className="text-sm font-bold truncate">{item.name}</span>
                          </div>
                          <span
                            className={`text-xs font-extrabold shrink-0 px-2 py-0.5 rounded-md ${
                              isLight
                                ? 'bg-red-50 text-[#ee2828]'
                                : 'bg-[#f5c043]/15 text-[#f5c043]'
                            }`}
                          >
                            {item.priceText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-sm font-bold">
                      {isEn ? 'No matching dishes found' : 'Không tìm thấy món nào phù hợp'}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {isEn ? 'Try keywords like:' : 'Thử từ khoá khác như:'}{' '}
                      <span className="font-semibold">Pizza</span>,{' '}
                      <span className="font-semibold">Spaghetti</span>,{' '}
                      <span className="font-semibold">Gratin</span>,{' '}
                      <span className="font-semibold">Combo</span>...
                    </p>
                  </div>
                )
              ) : (
                <div className="py-1.5 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {recentSearches.length > 0 && (
                    <div className="mb-1.5">
                      <div
                        className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'
                        }`}
                      >
                        <Clock size={12} />
                        <span>{isEn ? 'Recent Searches' : 'Tìm kiếm gần đây'}</span>
                      </div>
                      {recentSearches.map((term, idx) => {
                        const isActive = activeIndex === idx;
                        return (
                          <div
                            key={term}
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => executeSearch(term)}
                            className={`flex items-center justify-between gap-2 px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                              isActive
                                ? isLight
                                  ? 'bg-[#fef3c7] text-[#1c1208]'
                                  : 'bg-white/[0.1] text-white'
                                : isLight
                                  ? 'hover:bg-stone-100'
                                  : 'hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Clock
                                size={14}
                                className={isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}
                              />
                              <span className="truncate font-medium">{term}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(term, e)}
                              aria-label={`Xoá lịch sử tìm kiếm ${term}`}
                              title="Xoá mục này"
                              className={`p-1 rounded-full transition-colors cursor-pointer ${
                                isLight
                                  ? 'text-stone-400 hover:text-red-600 hover:bg-black/5'
                                  : 'text-white/40 hover:text-red-400 hover:bg-white/10'
                              }`}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {popularItems.length > 0 && (
                    <div>
                      <div
                        className={`px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
                          isLight ? 'text-zinc-600' : 'text-zinc-300'
                        }`}
                      >
                        <span>{isEn ? 'Best Sellers' : 'Món bán chạy'}</span>
                      </div>
                      {popularItems.map((item, pIdx) => {
                        const optionIdx = recentSearches.length + pIdx;
                        const isActive = activeIndex === optionIdx;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActiveIndex(optionIdx)}
                            onClick={() => executeSearch(item.searchKeyword)}
                            className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer ${
                              isActive
                                ? isLight
                                  ? 'bg-[#fef3c7] text-[#1c1208]'
                                  : 'bg-white/[0.1] text-white'
                                : isLight
                                  ? 'hover:bg-stone-100'
                                  : 'hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10"
                              />
                              <span className="text-sm font-semibold truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-xs font-bold ${
                                  isLight ? 'text-[#ee2828]' : 'text-[#f5c043]'
                                }`}
                              >
                                {item.priceText}
                              </span>
                              <ArrowUpRight
                                size={14}
                                className={isLight ? 'text-stone-400' : 'text-white/40'}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hàng / Cột các nút Danh mục dạng Pill */}
        <div
          className={`relative min-w-0 flex-1 ${
            isCartPinned && isCartOpen ? 'order-2 2xl:order-1' : 'order-2 xl:order-1'
          }`}
        >
          {/* Lớp mờ chuyển sắc báo hiệu cuộn ngang bên trái/phải */}
          {canScrollPillsLeft && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 top-0 bottom-0 w-7 z-10 bg-gradient-to-r ${
                isLight ? 'from-white via-white/80 to-transparent' : 'from-[#181411] via-[#181411]/80 to-transparent'
              }`}
            />
          )}
          {canScrollPillsRight && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute right-0 top-0 bottom-0 w-7 z-10 bg-gradient-to-l ${
                isLight ? 'from-white via-white/80 to-transparent' : 'from-[#181411] via-[#181411]/80 to-transparent'
              }`}
            />
          )}

          {/* Danh sách Pill cuộn ngang mượt */}
          <div
            ref={pillScrollRef}
            role="tablist"
            aria-label="Danh mục món ăn"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto py-0.5"
          >
            {/* Pill Nổi Bật */}
            <Link
              ref={(el) => {
                pillItemRefs.current[0] = el;
              }}
              href="/"
              role="tab"
              aria-selected={isFeaturedActive}
              aria-current={isFeaturedActive ? 'page' : undefined}
              onKeyDown={(e) => handlePillKeyDown(e, 0)}
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
                scrollMainToTopOrSection();
              }}
              className={getPillClassName(isFeaturedActive)}
            >
              <span>{isEn ? 'Featured' : 'Nổi bật'}</span>
            </Link>

            {/* Các Pill Danh mục từ DB */}
            {displayCategories.map((cat, idx) => {
              const pillIdx = idx + 1;
              const isActive =
                !isHalfHalfModalOpen &&
                activeCategoryParam === String(cat.category_id) &&
                !urlSearch;

              return (
                <Link
                  key={cat.category_id}
                  ref={(el) => {
                    pillItemRefs.current[pillIdx] = el;
                  }}
                  href={`/?category=${cat.category_id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  onKeyDown={(e) => handlePillKeyDown(e, pillIdx)}
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                    scrollMainToTopOrSection();
                  }}
                  className={getPillClassName(isActive)}
                >
                  <span>{td(cat.category_name)}</span>
                </Link>
              );
            })}

            {/* Pill Nửa-Nửa */}
            <button
              ref={(el) => {
                pillItemRefs.current[displayCategories.length + 1] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isHalfHalfModalOpen}
              onKeyDown={(e) => handlePillKeyDown(e, displayCategories.length + 1)}
              onClick={() => setIsHalfHalfModalOpen(true)}
              className={getPillClassName(isHalfHalfModalOpen)}
            >
              <span>{isEn ? 'Half & Half' : 'Nửa-Nửa'}</span>
            </button>

            {/* Pill Gợi ý món thông minh */}
            <button
              type="button"
              onClick={() => openQuiz('category_nav')}
              className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-[13px] font-extrabold tracking-wide border transition-all duration-200 cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-gradient-to-r from-[#fff3d1] to-[#ffe4a3] text-[#7c2d12] border-[#e8b949] hover:from-[#ffe8ad] hover:to-[#ffd97d] shadow-2xs'
                  : 'bg-gradient-to-r from-[#3d2514] to-[#2c1b12] text-[#f5c043] border-[#f5c043]/40 hover:border-[#f5c043]/80 shadow-xs'
              }`}
            >
              <UtensilsCrossed size={14} className="shrink-0" />
              <span>{isEn ? 'Dish Guide' : 'Tư vấn chọn món'}</span>
            </button>
          </div>
        </div>
      </div>

      {isHalfHalfModalOpen && (
        <HalfHalfModal
          isOpen={isHalfHalfModalOpen}
          onClose={() => setIsHalfHalfModalOpen(false)}
        />
      )}
    </div>
  );
}
