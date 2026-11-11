'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ShoppingCart, Check, Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore, CartItem } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';
import { API_BASE, BACKEND_URL } from '@/lib/config';

const CustomSelect = ({
  value,
  options,
  onChange,
  isLight,
}: {
  value: any;
  options: { value: any; label: string }[];
  onChange: (val: any) => void;
  isLight?: boolean;
}) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    if (isSelectOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 250) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isSelectOpen]);

  return (
    <div className="relative" ref={selectRef}>
      <div
        className={`w-full border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
          isLight
            ? 'bg-white border-[#dfd3bf] text-[#1c1208] hover:border-[#cd3645]'
            : 'bg-black/20 border-white/20 text-white hover:bg-black/30'
        }`}
        onClick={() => setIsSelectOpen(!isSelectOpen)}
      >
        <span className="text-sm font-medium truncate">
          {selectedOption ? selectedOption.label : 'Chọn...'}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isSelectOpen ? (openUpwards ? 'rotate-0' : 'rotate-180') : ''
          }`}
        />
      </div>

      {isSelectOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsSelectOpen(false);
            }}
          />
          <div
            className={`absolute z-20 left-0 right-0 ${
              openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
            } border rounded-lg max-h-56 overflow-y-auto custom-scrollbar ${
              isLight
                ? 'bg-white border-[#dfd3bf] text-[#1c1208] shadow-xl'
                : 'bg-[#8b2006] border-white/20 text-white shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  value === option.value
                    ? isLight
                      ? 'bg-[#ee2828]/10 text-[#ee2828] font-bold'
                      : 'bg-white/20 font-bold'
                    : isLight
                      ? 'hover:bg-stone-100'
                      : 'hover:bg-white/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setIsSelectOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function HalfHalfModal({
  isOpen,
  onClose,
  editCartItem = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  editCartItem?: CartItem | null;
}) {
  const { theme, lang, td } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const { addToCart, removeFromCart } = useCartStore();

  const [allDishes, setAllDishes] = useState<any[]>([]);
  const [pizzas, setPizzas] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [crusts, setCrusts] = useState<any[]>([]);
  const [toppings, setToppings] = useState<any[]>([]);

  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedCrustId, setSelectedCrustId] = useState<number | null>(null);
  const [firstHalfId, setFirstHalfId] = useState<number | null>(null);
  const [secondHalfId, setSecondHalfId] = useState<number | null>(null);
  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);

  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (isOpen) {
      if (mainContainer) mainContainer.style.overflow = 'hidden';
      fetchData();
      if (editCartItem) {
        setQuantity(editCartItem.quantity);
        setNote(editCartItem.options?.notes || '');
      } else {
        setQuantity(1);
        setNote('');
        setSelectedToppingIds([]);
      }
    } else {
      if (mainContainer) mainContainer.style.overflow = '';
    }

    return () => {
      if (mainContainer) mainContainer.style.overflow = '';
    };
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const catRes = await fetch(`${API_BASE}/menu/categories`);
      const catData = await catRes.json();
      const pizzaCat = catData.data?.find(
        (c: any) => c.category_name?.toLowerCase() === 'pizza'
      );

      const [dishesRes, sizesRes, crustsRes, toppingsRes] = await Promise.all([
        fetch(`${API_BASE}/menu/dishes?category_id=${pizzaCat?.category_id || ''}&all=true`),
        fetch(`${API_BASE}/menu/sizes`),
        fetch(`${API_BASE}/menu/crusts`),
        fetch(`${API_BASE}/menu/toppings?type=pizza`),
      ]);

      const dishes = await dishesRes.json();
      const sz = await sizesRes.json();
      const cr = await crustsRes.json();
      const tp = await toppingsRes.json();

      if (dishes.success) {
        setAllDishes(dishes.data);
        const validPizzas = dishes.data.filter(
          (p: any) =>
            !p.dish_name.toLowerCase().includes('half-half') &&
            !p.dish_name.toLowerCase().includes('half half')
        );
        setPizzas(validPizzas);
        if (editCartItem && editCartItem.halves && editCartItem.halves.length >= 2) {
          setFirstHalfId(editCartItem.halves[0].dish_id);
          setSecondHalfId(editCartItem.halves[1].dish_id);
        } else if (validPizzas.length > 0) {
          setFirstHalfId(validPizzas[0].dish_id);
          setSecondHalfId(validPizzas[Math.min(1, validPizzas.length - 1)].dish_id);
        }
      }
      if (sz.success) {
        setSizes(sz.data);
        if (editCartItem && editCartItem.options?.size) {
          const match = sz.data.find((s: any) => s.size_name === editCartItem.options?.size);
          setSelectedSizeId(match ? match.size_id : sz.data[0]?.size_id || null);
        } else if (sz.data.length > 0) {
          setSelectedSizeId(sz.data[0].size_id);
        }
      }
      if (cr.success) {
        const filteredCrusts = cr.data.filter(
          (c: any) => c.is_visible !== false && c.crust_name !== 'None'
        );
        setCrusts(filteredCrusts);
        if (editCartItem && editCartItem.options?.crust) {
          const match = filteredCrusts.find(
            (c: any) => c.crust_name === editCartItem.options?.crust
          );
          setSelectedCrustId(match ? match.crust_id : filteredCrusts[0]?.crust_id || null);
        } else if (filteredCrusts.length > 0) {
          setSelectedCrustId(filteredCrusts[0].crust_id);
        }
      }
      if (tp.success) {
        setToppings(tp.data);
        if (editCartItem && editCartItem.options?.toppings) {
          const matchedIds = tp.data
            .filter((t: any) =>
              editCartItem.options?.toppings?.some(
                (et: any) => et.topping_id === t.topping_id
              )
            )
            .map((t: any) => t.topping_id);
          setSelectedToppingIds(matchedIds);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredToppings = useMemo(() => {
    return toppings.filter((t) => !t.size_id || t.size_id === selectedSizeId);
  }, [toppings, selectedSizeId]);

  const getDishPrice = (dishId: number | null) => {
    if (!dishId || !selectedSizeId || !selectedCrustId) return 0;
    const dish = pizzas.find((p) => p.dish_id === dishId);
    if (!dish || !dish.prices) return 0;
    const dp = dish.prices.find(
      (p: any) => p.size_id === selectedSizeId && p.crust_id === selectedCrustId
    );
    return dp ? dp.dish_price : 0;
  };

  const firstHalfPrice = getDishPrice(firstHalfId);
  const secondHalfPrice = getDishPrice(secondHalfId);

  const basePrice = (firstHalfPrice + secondHalfPrice) / 2;

  const toppingsPrice = selectedToppingIds.reduce((total, id) => {
    const t = toppings.find((x) => x.topping_id === id);
    return total + (t ? t.price_topping : 0);
  }, 0);

  const subtotal = (basePrice + toppingsPrice) * quantity;

  const handleToppingToggle = (id: number) => {
    setSelectedToppingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddToCart = async () => {
    const dish1 = pizzas.find((p) => p.dish_id === firstHalfId);
    const dish2 = pizzas.find((p) => p.dish_id === secondHalfId);
    const sizeObj = sizes.find((s) => s.size_id === selectedSizeId);
    const crustObj = crusts.find((c) => c.crust_id === selectedCrustId);
    const selectedToppingsObjs = toppings.filter((t) =>
      selectedToppingIds.includes(t.topping_id)
    );

    const label = `[Half-Half] ${dish1?.dish_name} / ${dish2?.dish_name}`;

    const baseHalfHalfDish = allDishes.find(
      (p) =>
        p.dish_name.toLowerCase().includes('half-half') ||
        p.dish_name.toLowerCase().includes('half half')
    );
    let dishPriceId: string | undefined = undefined;

    if (baseHalfHalfDish && baseHalfHalfDish.prices) {
      const dp = baseHalfHalfDish.prices.find(
        (p: any) => p.size_id === selectedSizeId && p.crust_id === selectedCrustId
      );
      if (dp) dishPriceId = dp.dish_price_id;
    }

    if (editCartItem) {
      await removeFromCart(editCartItem.id);
    }

    addToCart({
      type: 'half_half',
      dish_id: dish1?.dish_id || 0,
      dish_price_id: dishPriceId,
      name: label,
      price: basePrice + toppingsPrice,
      quantity,
      imageUrl: baseHalfHalfDish?.image
        ? baseHalfHalfDish.image.startsWith('http')
          ? baseHalfHalfDish.image
          : `${BACKEND_URL}${baseHalfHalfDish.image}`
        : 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=300&auto=format&fit=crop',
      halves: [
        { dish_id: dish1?.dish_id || 0, name: dish1?.dish_name || '' },
        { dish_id: dish2?.dish_id || 0, name: dish2?.dish_name || '' },
      ],
      options: {
        size: sizeObj?.size_name,
        crust: crustObj?.crust_name,
        toppings: selectedToppingsObjs.map((t) => ({
          topping_id: t.topping_id,
          name: t.topping_name,
          price: t.price_topping || 0,
        })),
        notes: note,
      },
    });

    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const sectionBorderClass = isLight ? 'border-[#e6dccb]' : 'border-white/20';

  return createPortal(
    <div
      data-modal-portal="true"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row w-full max-w-[540px] md:max-w-4xl lg:max-w-5xl max-h-[86dvh] md:h-[min(600px,84dvh)] lg:h-[min(640px,84dvh)] transition-colors ${
          isLight
            ? 'bg-[#fbf8f2] text-[#1c1208] border border-[#dfd3bf]'
            : 'bg-[#9f280a] text-white'
        }`}
      >
        {/* Left Side: Configuration */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar relative border-b md:border-b-0 md:border-r ${sectionBorderClass}`}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight mb-1">
                {isEn ? 'Half & Half Pizza' : 'Pizza Nửa / Nửa'}
              </h2>
              <p className={`text-sm ${isLight ? 'text-[#5c4d3c]' : 'text-white/80'}`}>
                {isEn
                  ? 'Combine two of your favorite flavors on one pizza!'
                  : 'Kết hợp hai hương vị yêu thích trên một chiếc pizza!'}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`md:hidden w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isLight
                  ? 'bg-black/[0.06] hover:bg-black/[0.12] text-[#1c1208]'
                  : 'bg-black/30 hover:bg-black/50 text-white'
              }`}
              aria-label={isEn ? 'Close' : 'Đóng'}
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {/* 1. Size */}
            <div>
              <label className={`block text-base font-bold mb-3 border-b pb-1.5 ${sectionBorderClass}`}>
                {isEn ? '1. Size (*)' : '1. Cỡ (*)'}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map((s) => {
                  const isSelected = selectedSizeId === s.size_id;
                  return (
                    <button
                      key={s.size_id}
                      type="button"
                      onClick={() => setSelectedSizeId(s.size_id)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-[#ee2828] text-white shadow-sm'
                            : 'bg-white text-[#9f280a] shadow-sm'
                          : isLight
                            ? 'bg-black/[0.06] hover:bg-black/[0.12] text-[#1c1208]'
                            : 'bg-black/25 hover:bg-black/35 text-white'
                      }`}
                    >
                      {td(s.size_name)}{' '}
                      {s.size_name === 'Regular'
                        ? isEn ? '(6 Slices)' : '(6 Miếng)'
                        : s.size_name === 'Large'
                          ? isEn ? '(12 Slices)' : '(12 Miếng)'
                          : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Crust */}
            <div>
              <label className={`block text-base font-bold mb-3 border-b pb-1.5 ${sectionBorderClass}`}>
                {isEn ? '2. Crust (*)' : '2. Đế bánh (*)'}
              </label>
              <div className="space-y-2.5">
                {crusts.map((c) => {
                  const isSelected = selectedCrustId === c.crust_id;
                  return (
                    <label
                      key={c.crust_id}
                      className="flex items-center justify-between py-0.5 cursor-pointer select-none group"
                      onClick={() => setSelectedCrustId(c.crust_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? isLight
                                ? 'border-[#ee2828] bg-[#ee2828] text-white'
                                : 'border-white bg-white text-[#9f280a]'
                              : isLight
                                ? 'border-stone-400 group-hover:border-stone-600'
                                : 'border-white/55 group-hover:border-white'
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3.2} />}
                        </div>
                        <span
                          className={`text-sm ${
                            isSelected ? 'font-bold' : 'font-medium opacity-90 group-hover:opacity-100'
                          }`}
                        >
                          {td(c.crust_name)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Choose Pizza */}
            <div>
              <label className={`block text-base font-bold mb-3 border-b pb-1.5 ${sectionBorderClass}`}>
                {isEn ? '3. Select Pizza (*)' : '3. Chọn Pizza (*)'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-[#5c4d3c]' : 'text-white/80'
                    }`}
                  >
                    {isEn ? 'First Half' : 'Nửa thứ nhất'}
                  </label>
                  <CustomSelect
                    value={firstHalfId || ''}
                    options={pizzas.map((p) => ({ value: p.dish_id, label: td(p.dish_name) }))}
                    onChange={(val) => setFirstHalfId(Number(val))}
                    isLight={isLight}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-[#5c4d3c]' : 'text-white/80'
                    }`}
                  >
                    {isEn ? 'Second Half' : 'Nửa thứ hai'}
                  </label>
                  <CustomSelect
                    value={secondHalfId || ''}
                    options={pizzas.map((p) => ({ value: p.dish_id, label: td(p.dish_name) }))}
                    onChange={(val) => setSecondHalfId(Number(val))}
                    isLight={isLight}
                  />
                </div>
              </div>
            </div>

            {/* 4. Add Topping */}
            {filteredToppings.length > 0 && (
              <div>
                <label className={`block text-base font-bold mb-3 border-b pb-1.5 ${sectionBorderClass}`}>
                  {isEn ? '4. Extra Toppings (Optional)' : '4. Thêm Topping (Tuỳ chọn)'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
                  {filteredToppings.map((t) => {
                    const isSelected = selectedToppingIds.includes(t.topping_id);
                    return (
                      <label
                        key={t.topping_id}
                        className="flex items-center justify-between py-0.5 cursor-pointer select-none group"
                        onClick={() => handleToppingToggle(t.topping_id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? isLight
                                  ? 'border-[#ee2828] bg-[#ee2828] text-white'
                                  : 'border-white bg-white text-[#9f280a]'
                                : isLight
                                  ? 'border-stone-400 group-hover:border-stone-600'
                                  : 'border-white/55 group-hover:border-white'
                            }`}
                          >
                            {isSelected && <Check size={11} strokeWidth={3.2} />}
                          </div>
                          <span
                            className={`text-sm ${
                              isSelected ? 'font-bold' : 'font-medium opacity-90 group-hover:opacity-100'
                            }`}
                          >
                            {td(t.topping_name)}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-sm shrink-0 ml-2 ${
                            isSelected
                              ? isLight
                                ? 'text-[#ee2828]'
                                : 'text-[#f0c14b]'
                              : isLight
                                ? 'text-[#5c4d3c]'
                                : 'text-[#f0c14b]'
                          }`}
                        >
                          +{formatPrice(t.price_topping)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className={`block text-base font-bold mb-2.5 border-b pb-1.5 ${sectionBorderClass}`}>
                {isEn ? 'Special Instructions' : 'Ghi chú'}
              </label>
              <input
                type="text"
                placeholder={isEn ? 'Notes for your order...' : 'Ghi chú cho đơn hàng của bạn...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full rounded-lg p-3 outline-none text-sm border transition-all ${
                  isLight
                    ? 'bg-white text-[#1c1208] placeholder:text-stone-400 border-[#dfd3bf] focus:border-[#ee2828]'
                    : 'bg-white text-black placeholder:text-gray-400 border-transparent focus:ring-2 focus:ring-yellow-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Summary */}
        <div
          className={`w-full md:w-[350px] lg:w-[390px] p-4 sm:p-5 md:p-8 flex flex-col relative shrink-0 ${
            isLight ? 'bg-[#f4efe4]' : 'bg-black/20'
          }`}
        >
          <button
            onClick={onClose}
            className={`hidden md:flex absolute top-5 right-5 z-20 w-8 h-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
              isLight
                ? 'bg-black/[0.06] hover:bg-black/[0.12] text-[#1c1208]'
                : 'bg-black/40 hover:bg-black/60 text-white'
            }`}
            aria-label={isEn ? 'Close' : 'Đóng'}
          >
            <X size={18} />
          </button>

          <h3 className={`hidden md:block text-lg font-extrabold mb-5 pr-8 uppercase border-b pb-2 ${sectionBorderClass}`}>
            {isEn ? 'Order Summary' : 'Tóm tắt đơn hàng'}
          </h3>

          <div
            className={`hidden md:block rounded-xl border p-5 mb-auto ${
              isLight ? 'bg-white border-[#dfd3bf] shadow-sm' : 'bg-black/30 border-white/10'
            }`}
          >
            <h4
              className={`font-extrabold text-base mb-3 border-b pb-2 leading-snug ${
                isLight ? 'text-[#cd3645] border-black/10' : 'text-[#f0c14b] border-white/10'
              }`}
            >
              {td(pizzas.find((p) => p.dish_id === firstHalfId)?.dish_name || '')} /{' '}
              {td(pizzas.find((p) => p.dish_id === secondHalfId)?.dish_name || '')}
            </h4>
            <div className={`space-y-2 text-sm ${isLight ? 'text-[#2c2219]' : 'text-white/90'}`}>
              <p>
                <span className={`font-bold ${isLight ? 'text-[#6e6254]' : 'text-white/70'}`}>
                  {isEn ? 'Size:' : 'Cỡ:'}
                </span>{' '}
                {td(sizes.find((s) => s.size_id === selectedSizeId)?.size_name || '')}
              </p>
              <p>
                <span className={`font-bold ${isLight ? 'text-[#6e6254]' : 'text-white/70'}`}>
                  {isEn ? 'Crust:' : 'Đế bánh:'}
                </span>{' '}
                {td(crusts.find((c) => c.crust_id === selectedCrustId)?.crust_name || '')}
              </p>
              {selectedToppingIds.length > 0 ? (
                <div>
                  <span className={`font-bold ${isLight ? 'text-[#6e6254]' : 'text-white/70'}`}>
                    {isEn ? 'Toppings:' : 'Topping:'}
                  </span>
                  <div className="ml-1 mt-1 space-y-0.5">
                    {toppings
                      .filter((t) => selectedToppingIds.includes(t.topping_id))
                      .map((t) => (
                        <span
                          key={t.topping_id}
                          className={`italic block text-xs ${isLight ? 'text-[#5c4d3c]' : 'text-white/75'}`}
                        >
                          + {td(t.topping_name)} (+{formatPrice(t.price_topping)})
                        </span>
                      ))}
                  </div>
                </div>
              ) : (
                <p>
                  <span className={`font-bold ${isLight ? 'text-[#6e6254]' : 'text-white/70'}`}>
                    {isEn ? 'Toppings:' : 'Topping:'}
                  </span>{' '}
                  {isEn ? 'None' : 'Không'}
                </p>
              )}
            </div>
            {note && (
              <div
                className={`mt-4 inline-block text-xs px-3 py-1.5 rounded-lg border italic ${
                  isLight
                    ? 'bg-[#fcfaf6] border-[#dfd3bf] text-[#5c4d3c]'
                    : 'bg-white/10 border-white/20 text-white'
                }`}
              >
                {isEn ? 'Note:' : 'Ghi chú:'} {note}
              </div>
            )}
          </div>

          {/* Nút thao tác */}
          <div className={`md:mt-6 md:pt-4 md:border-t flex items-center gap-2.5 sm:gap-3 ${sectionBorderClass}`}>
            <div
              className={`flex items-center justify-between rounded-xl overflow-hidden font-bold h-12 w-28 shrink-0 shadow-sm border ${
                isLight ? 'bg-white text-[#1c1208] border-[#dfd3bf]' : 'bg-white text-black border-transparent'
              }`}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex-1 h-full hover:bg-stone-100 transition-colors flex items-center justify-center cursor-pointer"
                aria-label={isEn ? 'Decrease quantity' : 'Giảm số lượng'}
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="w-8 text-center text-base">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex-1 h-full hover:bg-stone-100 transition-colors flex items-center justify-center cursor-pointer"
                aria-label={isEn ? 'Increase quantity' : 'Tăng số lượng'}
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-[#f0c14b] hover:bg-[#e2b036] text-black font-extrabold h-12 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer active:scale-[0.99]"
            >
              <ShoppingCart size={18} strokeWidth={2.4} />
              <span>
                {editCartItem
                  ? isEn
                    ? 'Update Cart'
                    : 'Cập nhật'
                  : isEn
                    ? 'Add to Cart'
                    : 'Thêm vào giỏ'}{' '}
                • {formatPrice(subtotal)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
