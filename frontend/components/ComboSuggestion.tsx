'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useUI } from '@/components/UIProvider';
import ComboModal from './ComboModal';

interface ComboSuggestionProps {
  dishIds: number[];
}

const formatComboDescription = (desc: string) => {
  if (!desc) return '';
  return desc
    .replace(/Choose 1 Pizza Large Size/gi, '1 Pizza cỡ lớn')
    .replace(/Choose 1 Pizza Regular Size/gi, '1 Pizza cỡ vừa')
    .replace(/Choose Salad or BBQ Wing\s*\(\s*10 pieces\s*\)/gi, 'Salad hoặc Cánh gà BBQ (10 miếng)')
    .replace(/Choose 1 Spaghetti or Grantin or Risotto/gi, '1 Mì Ý / Đút lò / Risotto')
    .replace(/Free Garilc Bread 4 Pieces/gi, 'Tặng bánh mì bơ tỏi (4 miếng)')
    .replace(/Free Garlic Bread 4 Pieces/gi, 'Tặng bánh mì bơ tỏi (4 miếng)')
    .replace(/Free Garlic Bread 8 Pieces/gi, 'Tặng bánh mì bơ tỏi (8 miếng)')
    .replace(/Choose Pepsi 4 can or 1 Pepsi 1[,.]5L/gi, '4 lon Pepsi hoặc 1 chai 1.5L')
    .replace(/Pepsi 2 can/gi, '2 lon Pepsi')
    .replace(/2 Pepsi/gi, '2 lon Pepsi')
    .replace(/1 Meat Grantin/gi, '1 Mì bò bằm đút lò')
    .replace(/1 Super Supreme Pizza Regular Size with Cheese Crust/gi, '1 Pizza Thập cẩm viền phô mai')
    .replace(/1 Gold Pizza Regular Size with Cheese Crust/gi, '1 Pizza Phô mai vàng viền phô mai')
    .replace(/2 Pieces Gralic Bread/gi, '2 miếng bánh mì bơ tỏi')
    .replace(/2 Pieces Garlic Bread/gi, '2 miếng bánh mì bơ tỏi')
    .replace(/BBQ Wing 10 Pieces/gi, '10 cánh gà BBQ');
};

export default function ComboSuggestion({ dishIds }: ComboSuggestionProps) {
  const { theme, lang, tc, td } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<any | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!dishIds || dishIds.length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/recommendations/combo-upsell`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dish_ids: dishIds }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json.success) {
          setSuggestions(json.data || []);
          setActiveIndex(0);
        }
      } catch (err) {
        console.error('Error fetching combo suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [dishIds.join(',')]);

  if (suggestions.length === 0) return null;

  const visibleList = suggestions.slice(0, 3);
  const safeIdx = Math.min(activeIndex, visibleList.length - 1);
  const combo = visibleList[safeIdx];
  if (!combo) return null;

  const comboImgSrc = combo.image_combo
    ? combo.image_combo.startsWith('http')
      ? combo.image_combo
      : `${BACKEND_URL}${combo.image_combo}`
    : 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop';

  return (
    <div className="pt-2 border-t border-dashed border-current/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Tag size={13} className={isLight ? 'text-[#b45309]' : 'text-[#f5c043]'} />
          <h3 className={`text-[11px] font-extrabold uppercase tracking-wider ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
            {isEn ? 'Value Combo Deals' : 'Combo tiết kiệm phù hợp'}
          </h3>
        </div>
        {visibleList.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev - 1 + visibleList.length) % visibleList.length)}
              aria-label={isEn ? 'Previous combo' : 'Combo trước'}
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
                isLight
                  ? 'border-zinc-300 text-zinc-600 hover:bg-zinc-200/70'
                  : 'border-white/15 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft size={12} />
            </button>
            <span className={`text-[10px] font-bold px-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {safeIdx + 1}/{visibleList.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % visibleList.length)}
              aria-label={isEn ? 'Next combo' : 'Combo tiếp theo'}
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
                isLight
                  ? 'border-zinc-300 text-zinc-600 hover:bg-zinc-200/70'
                  : 'border-white/15 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      <div
        key={combo.combo_id}
        className={`border rounded-xl p-3 flex flex-col gap-2 ${
          isLight
            ? 'bg-white border-[#e4d8c5]'
            : 'bg-[#211c18] border-white/12'
        }`}
      >
        <div className="flex gap-2.5 items-center">
          <div className="w-12 h-12 relative rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/20">
            <Image
              src={comboImgSrc}
              alt={combo.combo_name}
              fill
              sizes="48px"
              unoptimized={shouldBypassNextImageOptimization(comboImgSrc)}
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-extrabold text-xs sm:text-[13px] truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              {combo.combo_name}
            </h4>
            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
              <span className={`text-xs font-black ${isLight ? 'text-[#a82e10]' : 'text-[#f5c043]'}`}>
                {formatPrice(combo.combo_price)}
              </span>
              {combo.savings > 0 && (
                <span className={`text-[10.5px] ${isLight ? 'text-stone-500' : 'text-zinc-400'}`}>
                  {isEn ? `Save ${formatPrice(combo.savings)}` : `Tiết kiệm ${formatPrice(combo.savings)}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {combo.description && (
          <p className={`text-[11px] line-clamp-2 leading-snug ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
            {isEn ? tc(combo.description) : formatComboDescription(combo.description)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-current/10">
          {combo.matched_dishes && combo.matched_dishes.length > 0 ? (
            <span className={`text-[10.5px] truncate ${isLight ? 'text-stone-600' : 'text-zinc-400'}`}>
              {isEn ? 'Includes:' : 'Đã gồm:'} <strong>{td(combo.matched_dishes[0])}</strong>
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setSelectedCombo(combo)}
            className="shrink-0 bg-[#ee2828] hover:bg-[#d42020] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {isEn ? 'Select Combo' : 'Chọn combo'}
          </button>
        </div>
      </div>

      {selectedCombo && (
        <ComboModal
          isOpen={true}
          onClose={() => setSelectedCombo(null)}
          comboId={selectedCombo.combo_id}
          comboName={selectedCombo.combo_name}
          comboPrice={selectedCombo.combo_price}
          comboDescription={selectedCombo.description || ''}
          imageUrl={selectedCombo.image_combo ? (selectedCombo.image_combo.startsWith('http') ? selectedCombo.image_combo : `${BACKEND_URL}${selectedCombo.image_combo}`) : ''}
        />
      )}
    </div>
  );
}

