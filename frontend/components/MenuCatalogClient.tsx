'use client';

import React, { useState, useMemo } from 'react';
import { Leaf, Flame, FishOff, Award, UtensilsCrossed, ArrowUpDown, RotateCcw } from 'lucide-react';
import ProductCard from './ProductCard';
import { EmptyState } from './PageComponents';
import { analyzeProductTaste } from '@/lib/tasteTags';
import { useUI } from './UIProvider';
import { useRecommendationStore } from '@/store/recommendationStore';

type QuickFilterKey = 'all' | 'vegetarian' | 'no_spicy' | 'no_seafood' | 'extra_cheese';
type SortKey = 'default' | 'price_asc' | 'price_desc';

interface MenuCatalogClientProps {
  products: any[];
  categories: any[];
  activeCategory?: any;
  isFeaturedPage: boolean;
  searchQuery: string;
}

const QUICK_FILTERS: {
  key: QuickFilterKey;
  labelVi: string;
  labelEn: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { key: 'all', labelVi: 'Tất cả', labelEn: 'All' },
  { key: 'vegetarian', labelVi: 'Món chay', labelEn: 'Vegetarian', icon: Leaf },
  { key: 'no_spicy', labelVi: 'Không cay', labelEn: 'Non-Spicy', icon: Flame },
  { key: 'no_seafood', labelVi: 'Không hải sản', labelEn: 'No Seafood', icon: FishOff },
  { key: 'extra_cheese', labelVi: 'Nhiều phô mai', labelEn: 'Extra Cheese', icon: Award },
];

export default function MenuCatalogClient({
  products,
  categories,
  activeCategory,
  isFeaturedPage,
  searchQuery,
}: MenuCatalogClientProps) {
  const { theme, lang, td } = useUI();
  const openQuiz = useRecommendationStore((s) => s.openQuiz);
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const [activeFilter, setActiveFilter] = useState<QuickFilterKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('default');

  const filteredAndSortedProducts = useMemo(() => {
    let list = products.filter((item) => {
      if (activeFilter === 'all') return true;
      const taste = analyzeProductTaste({
        name: item.name,
        ingredients: item.ingredients,
        dish_type: item.dish_type,
      });

      if (activeFilter === 'vegetarian') return taste.isVegetarian;
      if (activeFilter === 'no_spicy') return !taste.isSpicy;
      if (activeFilter === 'no_seafood') return !taste.isSeafood;
      if (activeFilter === 'extra_cheese') return taste.isCheesy;
      return true;
    });

    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    return list;
  }, [products, activeFilter, sortBy]);

  const hasCustomFilter = activeFilter !== 'all' || sortBy !== 'default';

  return (
    <>
      <div
        id="menu-catalog-section"
        className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-2 scroll-mt-24"
      >
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
            isFeaturedPage && !searchQuery ? 'border-t menu-section-divider pt-5' : ''
          }`}
        >
          {!searchQuery ? (
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-lg md:text-xl font-extrabold menu-section-heading tracking-wide uppercase">
                {isFeaturedPage
                  ? isEn
                    ? 'Full Menu'
                    : 'Toàn bộ thực đơn'
                  : td(activeCategory?.category_name) || (isEn ? 'Menu' : 'Thực đơn')}
              </h2>
              <span
                className={`text-xs font-semibold ${
                  isLight ? 'text-[#6e6254]' : 'text-white/50'
                }`}
              >
                ({filteredAndSortedProducts.length} {isEn ? 'items' : 'món'})
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Bộ lọc nhanh theo khẩu vị & Sắp xếp giá */}
          {products.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {QUICK_FILTERS.map((f) => {
                  const Icon = f.icon;
                  const selected = activeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActiveFilter(f.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                        selected
                          ? 'bg-[#f5c043] text-zinc-950 border-[#f5c043] shadow-sm'
                          : isLight
                            ? 'bg-white/85 text-[#4a3e30] border-[#e2d8c9] hover:border-[#c9bba6] hover:bg-white'
                            : 'bg-zinc-900/75 text-zinc-300 border-white/10 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {Icon && <Icon size={13} />}
                      <span>{isEn ? f.labelEn : f.labelVi}</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative flex items-center">
                <ArrowUpDown
                  size={13}
                  className={`absolute left-3 pointer-events-none ${
                    isLight ? 'text-[#6e6254]' : 'text-zinc-400'
                  }`}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  aria-label={isEn ? 'Sort by price' : 'Sắp xếp theo giá'}
                  className={`pl-8 pr-7 py-1.5 rounded-full text-xs font-bold border outline-none transition-all cursor-pointer ${
                    isLight
                      ? 'bg-white/90 text-[#2e2418] border-[#e2d8c9] hover:border-[#c9bba6]'
                      : 'bg-zinc-900/85 text-zinc-200 border-white/10 hover:border-white/25'
                  }`}
                >
                  <option value="default" className="bg-zinc-900 text-white">
                    {isEn ? 'Sort: Default' : 'Sắp xếp: Mặc định'}
                  </option>
                  <option value="price_asc" className="bg-zinc-900 text-white">
                    {isEn ? 'Price: Low to High' : 'Giá: Thấp đến Cao'}
                  </option>
                  <option value="price_desc" className="bg-zinc-900 text-white">
                    {isEn ? 'Price: High to Low' : 'Giá: Cao đến Thấp'}
                  </option>
                </select>
              </div>

              {hasCustomFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    setSortBy('default');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                    isLight
                      ? 'text-[#b42318] hover:bg-red-50'
                      : 'text-amber-300 hover:bg-white/10'
                  }`}
                  title={isEn ? 'Reset filters' : 'Đặt lại bộ lọc'}
                >
                  <RotateCcw size={12} />
                  <span>{isEn ? 'Reset' : 'Đặt lại'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái rỗng */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              className={`my-8 rounded-2xl border p-8 text-center ${
                isLight
                  ? 'bg-white/85 border-[#e2d8c9] text-[#2e2418]'
                  : 'bg-zinc-900/60 border-white/10 text-white'
              }`}
            >
              <p className="text-base font-bold mb-1">
                {isEn
                  ? 'No dishes match your current filter'
                  : 'Chưa có món nào phù hợp với bộ lọc đang chọn'}
              </p>
              <p
                className={`text-xs mb-4 ${
                  isLight ? 'text-[#6e6254]' : 'text-zinc-400'
                }`}
              >
                {isEn
                  ? 'Try switching to another taste filter or let us suggest dishes for you.'
                  : 'Bạn có thể đổi sang bộ lọc khẩu vị khác hoặc mở mục tư vấn chọn món nhé.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    setSortBy('default');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f5c043] text-zinc-950 text-xs font-extrabold hover:bg-[#e5b034] transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>
                    {isEn ? `View all ${products.length} items` : `Xem toàn bộ ${products.length} món`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openQuiz('empty_filter')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ee2828] text-white text-xs font-extrabold hover:bg-[#d41f1f] transition-colors cursor-pointer"
                >
                  <UtensilsCrossed size={13} />
                  <span>{isEn ? 'Menu Guide' : 'Tư vấn chọn món'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 lg:gap-x-10 xl:gap-x-12 gap-y-12 md:gap-y-10 lg:gap-y-12 justify-items-center w-full max-w-[1380px] mx-auto px-4 sm:px-8 md:px-11 lg:px-14 xl:px-16 py-4">
          {filteredAndSortedProducts.map((p, index) => {
            const itemCategory = categories.find(
              (c: any) => c.category_id === p.categoryId
            );
            return (
              <ProductCard
                key={`${p.isCombo ? 'combo' : 'dish'}-${p.id}`}
                id={p.id}
                name={p.name}
                ingredients={p.ingredients}
                price={p.price}
                dish_price_id={p.dish_price_id}
                prices={p.prices}
                theme={index % 2 === 0 ? 'green' : 'red'}
                layout={index % 2 === 0 ? 'image-left' : 'image-right'}
                imageUrl={p.imageUrl}
                isCombo={p.isCombo || false}
                isHalfHalf={p.isHalfHalf || false}
                categoryName={
                  itemCategory?.category_name ||
                  activeCategory?.category_name ||
                  ''
                }
                dish_type={p.dish_type}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
