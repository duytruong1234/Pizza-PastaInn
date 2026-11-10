'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import {
  X,
  ShoppingCart,
  Check,
  Minus,
  Plus,
} from 'lucide-react';
import { useCartStore, CartItem } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import HalfHalfModal from './HalfHalfModal';

interface ProductPriceItem {
  dish_price_id?: string;
  size_id?: number | null;
  crust_id?: number | null;
  dish_price: number;
  size_name?: string;
  crust_name?: string;
}

interface SizeOption {
  size_id: number;
  size_name: string;
}

interface CrustOption {
  crust_id: number;
  crust_name: string;
}

interface ToppingOption {
  topping_id: number;
  topping_name: string;
  price_topping: number;
}

interface RecommendedDish {
  dish_id: number;
  dish_name: string;
  ingredient?: string;
  image?: string | null;
  dish_type?: string;
  prices?: ProductPriceItem[];
  similarity_score?: number;
  match_reasons?: string[];
  reason?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    ingredients: string;
    basePrice: number;
    prices?: ProductPriceItem[];
    imageUrl: string;
    dish_type?: string;
  };
  categoryName?: string;
  editCartItem?: CartItem | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop';

const resolveDishImage = (img?: string | null) => {
  if (!img) return FALLBACK_IMAGE;
  if (img.startsWith('http')) return img;
  return `${BACKEND_URL}${img}`;
};

export default function ProductModal({
  isOpen,
  onClose,
  product,
  categoryName,
  editCartItem,
}: ProductModalProps) {
  const { addToCart, removeFromCart } = useCartStore();
  const { theme, lang, td, ti } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const [activeProduct, setActiveProduct] = useState(product);
  const [similarDishes, setSimilarDishes] = useState<RecommendedDish[]>([]);
  const latestSimilarFor = useRef<number | null>(null);
  const [pairingDishes, setPairingDishes] = useState<RecommendedDish[]>([]);
  const [vegetarianDishes, setVegetarianDishes] = useState<RecommendedDish[]>([]);

  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [crusts, setCrusts] = useState<CrustOption[]>([]);
  const [toppings, setToppings] = useState<ToppingOption[]>([]);

  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [selectedCrust, setSelectedCrust] = useState<CrustOption | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<ToppingOption[]>([]);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveProduct(product);
  }, [product]);

  // Đóng bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const fetchSimilarDishes = async (dishId: number) => {
    latestSimilarFor.current = dishId;
    try {
      const res = await fetch(`${API_BASE}/recommendations/similar/${dishId}?limit=3`);
      if (!res.ok) return;
      const json = await res.json();
      if (latestSimilarFor.current !== dishId) return;
      if (json.success && json.data) {
        setSimilarDishes(json.data as RecommendedDish[]);
      }
    } catch (e) {
      console.error('Error fetching similar dishes:', e);
    }
  };

  const fetchPairingDishes = async (dishId: number) => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/pairings/${dishId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setPairingDishes(json.data as RecommendedDish[]);
      }
    } catch (e) {
      console.error('Error fetching pairing dishes:', e);
    }
  };

  const fetchVegetarianDishes = async (dishId: number) => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/vegetarian-similar/${dishId}?limit=3`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setVegetarianDishes(json.data as RecommendedDish[]);
      }
    } catch (e) {
      console.error('Error fetching vegetarian dishes:', e);
    }
  };

  const fetchData = async (prod = activeProduct) => {
    try {
      const [sizesRes, crustsRes] = await Promise.all([
        fetch(`${API_BASE}/menu/sizes`),
        fetch(`${API_BASE}/menu/crusts`),
      ]);
      const sizesData = await sizesRes.json();
      const crustsData = await crustsRes.json();

      if (sizesData.success) {
        const availableSizeIds = new Set(
          prod.prices?.map((p) => p.size_id).filter((id) => id !== null && id !== undefined)
        );
        const availableSizes = (sizesData.data as SizeOption[]).filter((s) =>
          availableSizeIds.has(s.size_id)
        );
        setSizes(availableSizes);
        if (editCartItem && editCartItem.options?.size) {
          const match = availableSizes.find((s) => s.size_name === editCartItem.options?.size);
          setSelectedSize(match || availableSizes[0] || null);
        } else if (availableSizes.length > 0) {
          setSelectedSize(availableSizes[0]);
        } else {
          setSelectedSize(null);
        }
      }
      if (crustsData.success) {
        const availableCrustIds = new Set(
          prod.prices?.map((p) => p.crust_id).filter((id) => id !== null && id !== undefined)
        );
        const availableCrusts = (crustsData.data as CrustOption[]).filter((c) =>
          availableCrustIds.has(c.crust_id)
        );
        setCrusts(availableCrusts);
        if (editCartItem && editCartItem.options?.crust) {
          const match = availableCrusts.find((c) => c.crust_name === editCartItem.options?.crust);
          setSelectedCrust(match || availableCrusts[0] || null);
        } else if (availableCrusts.length > 0) {
          setSelectedCrust(availableCrusts[0]);
        } else {
          setSelectedCrust(null);
        }
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (isOpen) {
      if (mainContainer) mainContainer.style.overflow = 'hidden';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData(activeProduct);
      fetchSimilarDishes(activeProduct.id);
      fetchPairingDishes(activeProduct.id);
      fetchVegetarianDishes(activeProduct.id);
      if (editCartItem) {
        setQuantity(editCartItem.quantity);
        setNote(editCartItem.options?.notes || '');
      } else {
        setQuantity(1);
        setSelectedToppings([]);
        setNote('');
      }
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (mainContainer) mainContainer.style.overflow = '';
      setSimilarDishes([]);
      setPairingDishes([]);
      setVegetarianDishes([]);
    }

    return () => {
      if (mainContainer) mainContainer.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeProduct.id]);

  const handleSwitchProduct = (item: RecommendedDish) => {
    setActiveProduct({
      id: item.dish_id,
      name: item.dish_name,
      ingredients: item.ingredient || '',
      basePrice: item.prices?.[0]?.dish_price || 0,
      prices: item.prices || [],
      imageUrl: resolveDishImage(item.image),
      dish_type: item.dish_type || 'man',
    });
    setSelectedToppings([]);
    setNote('');
    setQuantity(1);
  };

  const toppingType =
    categoryName?.toLowerCase().includes('spaghetti') ||
    categoryName?.toLowerCase().includes('gratin') ||
    categoryName?.toLowerCase().includes('risotto')
      ? 'spaghetti'
      : 'pizza';
  const isSimpleProduct =
    categoryName?.toLowerCase().includes('salad') || categoryName?.toLowerCase().includes('drink');

  const fetchToppings = async (size_id: number | null) => {
    try {
      const url = size_id
        ? `${API_BASE}/menu/toppings?size_id=${size_id}&type=${toppingType}`
        : `${API_BASE}/menu/toppings?type=${toppingType}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const sortedToppings = (data.data as ToppingOption[]).sort(
          (a, b) => a.topping_id - b.topping_id
        );
        setToppings(sortedToppings);
        if (editCartItem && editCartItem.options?.toppings) {
          const matchedToppings = sortedToppings.filter((t) =>
            editCartItem.options?.toppings?.some((et) => et.topping_id === t.topping_id)
          );
          setSelectedToppings(matchedToppings);
        }
      }
    } catch (error) {
      console.error('Error fetching toppings:', error);
    }
  };

  useEffect(() => {
    if (isSimpleProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToppings([]);
      return;
    }

    if (selectedSize) {
      fetchToppings(selectedSize.size_id);
    } else if (sizes.length === 0) {
      fetchToppings(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize, sizes.length, toppingType, isSimpleProduct]);

  if (
    isOpen &&
    (product?.name?.toLowerCase().includes('half') || editCartItem?.type === 'half_half')
  ) {
    return <HalfHalfModal isOpen={isOpen} onClose={onClose} editCartItem={editCartItem} />;
  }

  if (!isOpen) return null;

  const productImageSrc = activeProduct.imageUrl || FALLBACK_IMAGE;

  const handleToppingToggle = (topping: ToppingOption) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.topping_id === topping.topping_id)
        ? prev.filter((t) => t.topping_id !== topping.topping_id)
        : [...prev, topping]
    );
  };

  let exactDishPriceObj: ProductPriceItem | undefined;
  if (selectedSize || selectedCrust) {
    exactDishPriceObj = activeProduct.prices?.find(
      (p) => p.size_id === selectedSize?.size_id && p.crust_id === selectedCrust?.crust_id
    );
  }
  if (!exactDishPriceObj && activeProduct.prices && activeProduct.prices.length > 0) {
    exactDishPriceObj = activeProduct.prices[0];
  }

  const currentBasePrice = exactDishPriceObj
    ? exactDishPriceObj.dish_price
    : activeProduct.basePrice;
  const extraToppingsPrice = selectedToppings.reduce(
    (sum, t) => sum + (t.price_topping || 0),
    0
  );
  const totalPrice = (currentBasePrice + extraToppingsPrice) * quantity;

  const handleAddToCart = async () => {
    const dish_price_id = exactDishPriceObj?.dish_price_id || `${activeProduct.id}_default`;

    if (editCartItem) {
      await removeFromCart(editCartItem.id);
    }

    addToCart({
      type: 'regular',
      dish_id: activeProduct.id,
      dish_price_id,
      name: activeProduct.name,
      price: currentBasePrice + extraToppingsPrice,
      quantity,
      imageUrl: activeProduct.imageUrl,
      options: {
        size: selectedSize?.size_name,
        crust: selectedCrust?.crust_name,
        toppings: selectedToppings.map((t) => ({
          topping_id: t.topping_id,
          name: t.topping_name,
          price: t.price_topping || 0,
        })),
        notes: note,
      },
    });

    onClose();
  };

  return createPortal(
    <div
      data-modal-portal="true"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[920px] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_24px_60px_rgba(0,0,0,0.65)] relative max-h-[92vh] transition-colors ${
          isLight
            ? 'bg-[#fbf8f2] text-[#1c1208] border border-[#dfd3bf]'
            : 'bg-[#9f280a] text-white'
        }`}
      >
        {/* Cột trái: Hình ảnh món ăn */}
        <div className="w-full md:w-[46%] relative h-[180px] sm:h-[220px] md:h-auto md:min-h-full shrink-0 overflow-hidden">
          <Image
            src={productImageSrc}
            alt={activeProduct.name}
            fill
            sizes="(max-width: 768px) 100vw, 46vw"
            unoptimized={shouldBypassNextImageOptimization(productImageSrc)}
            className="object-cover"
          />
        </div>

        {/* Cột phải: Header cố định + Nội dung cuộn + Footer cố định */}
        <div className="w-full md:w-[54%] flex-1 flex flex-col min-h-0 relative bg-transparent">
          {/* 1. Header cố định (Nút X không bao giờ đè lên nội dung khi cuộn) */}
          <div
            className={`px-5 sm:px-6 pt-5 pb-3 border-b flex items-start justify-between gap-3 shrink-0 ${
              isLight ? 'border-[#e6dccb]' : 'border-white/20'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2
                  id="product-modal-title"
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug"
                >
                  {td(activeProduct.name?.normalize('NFC'))}
                </h2>
                {activeProduct.dish_type && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      activeProduct.dish_type === 'chay'
                        ? isLight
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                        : isLight
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-amber-500/20 text-amber-100 border-amber-400/40'
                    }`}
                  >
                    {activeProduct.dish_type === 'chay'
                      ? isEn
                        ? 'Vegetarian'
                        : 'Món chay'
                      : isEn
                        ? 'Savory'
                        : 'Món mặn'}
                  </span>
                )}
              </div>
              {activeProduct.ingredients && (
                <p
                  className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                    isLight ? 'text-[#5c4d3c]' : 'text-white/85'
                  }`}
                >
                  {ti(activeProduct.ingredients?.normalize('NFC'))}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hộp thoại"
              title="Đóng (Esc)"
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-black/[0.06] hover:bg-black/[0.12] text-[#1c1208]'
                  : 'bg-black/30 hover:bg-black/50 text-white'
              }`}
            >
              <X size={18} strokeWidth={2.3} />
            </button>
          </div>

          {/* 2. Vùng cuộn Tùy chọn & Gợi ý */}
          <div
            ref={scrollContainerRef}
            className="px-5 sm:px-6 py-4 overflow-y-auto custom-scrollbar flex-1 space-y-5"
          >
            {/* Chọn Cỡ bánh */}
            {sizes.length > 0 && (
              <div>
                <h3
                  className={`font-bold text-base mb-2.5 border-b pb-1.5 ${
                    isLight ? 'border-[#e6dccb]' : 'border-white/20'
                  }`}
                >
                  {isEn ? 'Size:' : 'Cỡ:'}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {sizes.map((size) => {
                    const isSelected = selectedSize?.size_id === size.size_id;
                    return (
                      <button
                        key={size.size_id}
                        type="button"
                        onClick={() => setSelectedSize(size)}
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
                        {td(size.size_name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chọn Đế bánh (Không có khung nền đỏ đậm bên ngoài, không có dấu chấm đen khi chọn) */}
            {crusts.length > 0 && (
              <div>
                <h3
                  className={`font-bold text-base mb-2.5 border-b pb-1.5 ${
                    isLight ? 'border-[#e6dccb]' : 'border-white/20'
                  }`}
                >
                  {isEn ? 'Crust:' : 'Đế bánh:'}
                </h3>
                <div className="space-y-2.5">
                  {crusts.map((crust) => {
                    const isSelected = selectedCrust?.crust_id === crust.crust_id;
                    const crustPrice = activeProduct.prices?.find(
                      (p) =>
                        p.size_id === selectedSize?.size_id && p.crust_id === crust.crust_id
                    );
                    return (
                      <label
                        key={crust.crust_id}
                        onClick={() => setSelectedCrust(crust)}
                        className="flex items-center justify-between py-1 cursor-pointer select-none group"
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
                            className={`text-sm transition-colors ${
                              isSelected ? 'font-bold' : 'font-medium opacity-90 group-hover:opacity-100'
                            }`}
                          >
                            {td(crust.crust_name)}
                          </span>
                        </div>
                        {crustPrice && (
                          <span
                            className={`text-sm font-bold ${
                              isSelected
                                ? isLight
                                  ? 'text-[#ee2828]'
                                  : 'text-[#f5c043]'
                                : ''
                            }`}
                          >
                            {formatPrice(crustPrice.dish_price)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thêm Topping (Không có khung nền đỏ đậm bên ngoài) */}
            {toppings.length > 0 && (
              <div>
                <h3
                  className={`font-bold text-base mb-2.5 border-b pb-1.5 ${
                    isLight ? 'border-[#e6dccb]' : 'border-white/20'
                  }`}
                >
                  {isEn ? 'Extra Toppings:' : 'Thêm Topping:'}
                </h3>
                <div className="space-y-2.5">
                  {toppings.map((topping) => {
                    const isSelected = selectedToppings.some(
                      (t) => t.topping_id === topping.topping_id
                    );
                    return (
                      <label
                        key={topping.topping_id}
                        onClick={() => handleToppingToggle(topping)}
                        className="flex items-center justify-between py-1 cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-colors ${
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
                            className={`text-sm transition-colors ${
                              isSelected ? 'font-bold' : 'font-medium opacity-90 group-hover:opacity-100'
                            }`}
                          >
                            {td(topping.topping_name)}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            isSelected
                              ? isLight
                                ? 'text-[#ee2828]'
                                : 'text-[#f5c043]'
                              : ''
                          }`}
                        >
                          {formatPrice(topping.price_topping)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ghi chú đơn hàng */}
            <div>
              <label
                htmlFor="product-modal-note"
                className={`block font-bold text-base mb-2.5 border-b pb-1.5 ${
                  isLight ? 'border-[#e6dccb]' : 'border-white/20'
                }`}
              >
                {isEn ? 'Special Instructions:' : 'Ghi chú:'}
              </label>
              <input
                id="product-modal-note"
                type="text"
                placeholder={isEn ? 'Notes for this item...' : 'Ghi chú cho đơn hàng của bạn...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                  isLight
                    ? 'bg-white border-[#dcd0bc] text-[#1c1208] placeholder:text-stone-400 focus:border-[#d4a017]'
                    : 'bg-white text-zinc-900 border-white/20 placeholder:text-zinc-400 focus:ring-2 focus:ring-[#f5c043]'
                }`}
              />
            </div>

            {/* Gợi ý kết hợp tròn vị (Pairings) */}
            {pairingDishes.length > 0 && (
              <div className="pt-2">
                <h3
                  className={`font-bold text-sm uppercase tracking-wider mb-3 border-b pb-1.5 ${
                    isLight ? 'border-[#e6dccb]' : 'border-white/20'
                  }`}
                >
                  {isEn ? 'Recommended Sides & Pairings' : 'Gợi ý kết hợp tròn vị'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {pairingDishes.map((item) => (
                    <button
                      key={item.dish_id}
                      type="button"
                      onClick={() => handleSwitchProduct(item)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all hover:-translate-y-0.5 flex sm:flex-col gap-2.5 group ${
                        isLight
                          ? 'bg-white hover:bg-[#faf3e6] border-[#e2d7c5] hover:border-[#d4a017] shadow-xs'
                          : 'bg-black/20 hover:bg-black/30 border-white/12 hover:border-[#f5c043]/60'
                      }`}
                    >
                      <div className="w-16 h-16 sm:w-full sm:h-20 relative rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={resolveDishImage(item.image)}
                          alt={item.dish_name}
                          fill
                          sizes="(max-width: 640px) 64px, 140px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={shouldBypassNextImageOptimization(item.image || '')}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                        <div>
                          <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-[#f5c043] transition-colors">
                            {item.dish_name}
                          </p>
                          <p
                            className={`text-xs font-extrabold mt-0.5 ${
                              isLight ? 'text-[#ee2828]' : 'text-[#f5c043]'
                            }`}
                          >
                            {formatPrice(item.prices?.[0]?.dish_price || 0)}
                          </p>
                        </div>
                        {item.reason && (
                          <p
                            className={`text-[10px] mt-1 line-clamp-1 ${
                              isLight ? 'text-stone-500' : 'text-white/70'
                            }`}
                          >
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Món tương tự bạn có thể thích */}
            {similarDishes.length > 0 && (
              <div className="pt-2">
                <h3
                  className={`font-bold text-sm uppercase tracking-wider mb-3 border-b pb-1.5 ${
                    isLight ? 'border-[#e6dccb]' : 'border-white/20'
                  }`}
                >
                  {isEn ? 'Similar Dishes You Might Like' : 'Món tương tự bạn có thể thích'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {similarDishes.map((item) => (
                    <button
                      key={item.dish_id}
                      type="button"
                      onClick={() => {
                        handleSwitchProduct(item);
                      }}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all hover:-translate-y-0.5 flex sm:flex-col gap-2.5 group ${
                        isLight
                          ? 'bg-white hover:bg-[#faf3e6] border-[#e2d7c5] hover:border-[#d4a017] shadow-xs'
                          : 'bg-black/20 hover:bg-black/30 border-white/12 hover:border-[#f5c043]/60'
                      }`}
                    >
                      <div className="w-16 h-16 sm:w-full sm:h-20 relative rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={resolveDishImage(item.image)}
                          alt={item.dish_name}
                          fill
                          sizes="(max-width: 640px) 64px, 140px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={shouldBypassNextImageOptimization(item.image || '')}
                        />
                        {item.similarity_score && item.similarity_score > 0 ? (
                          <span className="absolute top-1.5 right-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/75 text-[#f5c043] backdrop-blur-xs">
                            {Math.round(item.similarity_score * 100)}%
                          </span>
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                        <div>
                          <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-[#f5c043] transition-colors">
                            {item.dish_name}
                          </p>
                          <p
                            className={`text-xs font-extrabold mt-0.5 ${
                              isLight ? 'text-[#ee2828]' : 'text-[#f5c043]'
                            }`}
                          >
                            {formatPrice(item.prices?.[0]?.dish_price || 0)}
                          </p>
                        </div>
                        {item.match_reasons?.[0] && (
                          <p
                            className={`mt-1 text-[10px] font-medium line-clamp-1 ${
                              isLight ? 'text-stone-600' : 'text-amber-200/85'
                            }`}
                            title={item.match_reasons.join(' · ')}
                          >
                            {item.match_reasons[0]}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gợi ý món chay tương tự */}
            {vegetarianDishes.length > 0 && (
              <div className="pt-2">
                <h3
                  className={`font-bold text-sm uppercase tracking-wider mb-3 border-b pb-1.5 ${
                    isLight
                      ? 'text-emerald-800 border-[#e6dccb]'
                      : 'text-emerald-300 border-white/20'
                  }`}
                >
                  {activeProduct.dish_type === 'chay'
                    ? isEn
                      ? 'Similar Vegetarian Dishes'
                      : 'Món chay tương tự có thể bạn thích'
                    : isEn
                      ? 'Vegetarian Alternatives'
                      : 'Gợi ý món chay tương tự có thể dùng'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {vegetarianDishes.map((item) => (
                    <button
                      key={item.dish_id}
                      type="button"
                      onClick={() => handleSwitchProduct(item)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all hover:-translate-y-0.5 flex sm:flex-col gap-2.5 group ${
                        isLight
                          ? 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-500 shadow-xs'
                          : 'bg-black/20 hover:bg-black/30 border-white/12 hover:border-emerald-400/60'
                      }`}
                    >
                      <div className="w-16 h-16 sm:w-full sm:h-20 relative rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={resolveDishImage(item.image)}
                          alt={item.dish_name}
                          fill
                          sizes="(max-width: 640px) 64px, 140px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={shouldBypassNextImageOptimization(item.image || '')}
                        />
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-950/85 text-emerald-300 border border-emerald-400/30">
                          Chay
                        </span>
                        {item.similarity_score && item.similarity_score > 0 ? (
                          <span className="absolute top-1.5 right-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/75 text-white backdrop-blur-xs">
                            {Math.round(item.similarity_score * 100)}%
                          </span>
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                        <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-[#f5c043] transition-colors">
                          {item.dish_name}
                        </p>
                        <p
                          className={`text-xs font-extrabold mt-0.5 ${
                            isLight ? 'text-[#ee2828]' : 'text-[#f5c043]'
                          }`}
                        >
                          {formatPrice(item.prices?.[0]?.dish_price || 0)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Footer cố định ở đáy: Số lượng + Nút Thêm vào giỏ trên cùng 1 hàng */}
          <div
            className={`px-5 sm:px-6 py-3.5 border-t flex items-center gap-3 shrink-0 ${
              isLight ? 'border-[#e6dccb]' : 'border-white/20'
            }`}
          >
            {/* Bộ tăng giảm số lượng */}
            <div className="flex items-center justify-between rounded-xl font-bold h-11 px-1.5 bg-white text-zinc-900 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Giảm số lượng"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>
              <span className="w-8 text-center text-base font-extrabold select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Tăng số lượng"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Nút Thêm vào giỏ */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 min-w-0 h-11 bg-[#f0c14b] hover:bg-[#e2b036] active:scale-[0.99] text-zinc-950 font-extrabold px-3 sm:px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-[15px] cursor-pointer"
            >
              <ShoppingCart size={18} strokeWidth={2.4} className="shrink-0" />
              <span className="truncate">
                {editCartItem
                  ? isEn
                    ? 'Update Cart'
                    : 'Cập nhật giỏ'
                  : isEn
                    ? 'Add to Cart'
                    : 'Thêm vào giỏ'}{' '}
                : {formatPrice(totalPrice)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
