'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useUI } from '@/components/UIProvider';
import { X, Trash2, Pin, PinOff, ShoppingBag, ChevronUp, Pencil, Plus, Minus, ArrowRight } from 'lucide-react';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useCartStore, CartItem } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import ProductModal from './ProductModal';
import ComboModal from './ComboModal';
import HalfHalfModal from './HalfHalfModal';
import ComboSuggestion from './ComboSuggestion';
import FrequentlyOrderedTogether from './FrequentlyOrderedTogether';
import { API_BASE, BACKEND_URL } from '@/lib/config';

const HALF_HALF_FALLBACK = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=300&auto=format&fit=crop';
const GENERIC_FALLBACK = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';

const getCartItemImage = (item: CartItem) => {
  if (item.type === 'half_half') {
    return item.imageUrl || HALF_HALF_FALLBACK;
  }
  return item.imageUrl || GENERIC_FALLBACK;
};

interface DishPriceOption {
  dish_price_id?: string;
  dish_price: number;
  size_id?: number | null;
  crust_id?: number | null;
}

interface EditableDish {
  id: number;
  name: string;
  ingredients: string;
  basePrice: number;
  prices: DishPriceOption[];
  imageUrl: string;
  dish_type?: string;
}

export default function CartSidebar() {
  const router = useRouter();
  const { isCartOpen, isCartPinned, openCart, closeCart, togglePinCart, theme, lang, td } = useUI();
  const isEn = lang === 'en';
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  const asideRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [dishForEdit, setDishForEdit] = useState<EditableDish | null>(null);
  const [categoryNameForEdit, setCategoryNameForEdit] = useState<string>('');
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Đóng bằng phím Esc và quản lý focus trap khi mở ở chế độ overlay drawer
  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Nếu đang mở modal con (ComboModal, ProductModal, HalfHalfModal...) thì nhường sự kiện bàn phím cho modal đó
      if (editingItem || document.querySelector('[data-modal-portal="true"]')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeCart();
        return;
      }

      // Focus trap khi drawer đang là modal overlay (không ghim trên desktop hoặc đang ở mobile/tablet)
      const isOverlayMode = !isCartPinned || window.innerWidth < 1024;
      if (e.key === 'Tab' && isOverlayMode && asideRef.current) {
        const focusable = asideRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl || !asideRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl || !asideRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, isCartPinned, closeCart, editingItem]);

  // Đưa focus vào nút đóng khi mở overlay drawer
  useEffect(() => {
    if (isCartOpen && (!isCartPinned || (typeof window !== 'undefined' && window.innerWidth < 1024))) {
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus({ preventScroll: true });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isCartOpen, isCartPinned]);

  const handleEditClick = async (item: CartItem) => {
    if (item.type === 'regular') {
      setLoadingEdit(true);
      try {
        const res = await fetch(`${API_BASE}/menu/dishes`);
        const json = await res.json();
        if (json.success) {
          const match = json.data.find((d: { dish_id: number }) => d.dish_id === item.dish_id);
          if (match) {
            setDishForEdit({
              id: match.dish_id,
              name: match.dish_name,
              ingredients: match.ingredient || '',
              basePrice: match.prices?.[0]?.dish_price || 0,
              prices: match.prices || [],
              imageUrl: match.image
                ? match.image.startsWith('http')
                  ? match.image
                  : `${BACKEND_URL}${match.image}`
                : 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop',
              dish_type: match.dish_type,
            });

            const catRes = await fetch(`${API_BASE}/menu/categories`);
            const catJson = await catRes.json();
            if (catJson.success) {
              const cat = catJson.data.find((c: { category_id: number }) => c.category_id === match.category_id);
              if (cat) {
                setCategoryNameForEdit(cat.category_name);
              }
            }
            setEditingItem(item);
          }
        }
      } catch (err) {
        console.error('Error fetching dish for edit:', err);
      } finally {
        setLoadingEdit(false);
      }
    } else {
      setEditingItem(item);
    }
  };

  const handleCheckout = () => {
    const user = useAuthStore.getState().user;
    const { updateFormData, resetForm } = useOrderStore.getState();
    resetForm();
    if (user) {
      updateFormData({
        customer_name: user.username || '',
        customer_phone: user.phone || '',
        customer_email: user.email || '',
      });
    }
    if (!isCartPinned) {
      closeCart();
    }
    router.push('/checkout');
  };

  const displayItems = isMounted ? items : [];
  const displayTotalItems = isMounted ? totalItems() : 0;
  const displayTotalPrice = isMounted ? totalPrice() : 0;
  const isLight = theme === 'light';

  // Khi ghim trên desktop và giỏ hàng đang mở: hiển thị dạng sidebar cố định đẩy menu sang trái
  const isDockedDesktop = isMounted && isCartPinned && isCartOpen;

  return (
    <>
      {/* ── Thanh giỏ hàng dính đáy trên Mobile / Tablet (< 1024px) ──────────── */}
      {isMounted && displayTotalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-[95] lg:hidden animate-fadeIn">
          <button
            type="button"
            onClick={openCart}
            aria-label={`Xem giỏ hàng, ${displayTotalItems} món, tổng cộng ${formatPrice(displayTotalPrice)}`}
            className="w-full bg-[#ee2828] hover:bg-[#d82020] active:scale-[0.99] text-white rounded-2xl px-4 py-3.5 shadow-[0_10px_30px_rgba(238,40,40,0.45)] border border-white/20 flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ShoppingBag size={15} className="text-white" />
              </span>
              <span className="font-extrabold text-sm sm:text-base truncate">
                {isEn
                  ? `View Cart • ${displayTotalItems} items • ${formatPrice(displayTotalPrice)}`
                  : `Xem giỏ hàng • ${displayTotalItems} món • ${formatPrice(displayTotalPrice)}`}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold bg-black/20 px-2.5 py-1 rounded-full shrink-0 ml-2">
              <span>{isEn ? 'Open' : 'Mở'}</span>
              <ChevronUp size={15} />
            </span>
          </button>
        </div>
      )}

      {/* ── Overlay nền mờ khi mở drawer (ẩn trên desktop nếu đang ghim) ─────── */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[115] transition-opacity duration-300 ease-out ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } ${isDockedDesktop ? 'lg:hidden' : ''}`}
      />

      {/* ── Drawer Giỏ hàng (Bottom Sheet trên <1024px, Right Drawer / Pinned Sidebar trên >=1024px) ── */}
      <aside
        ref={asideRef}
        id="cart-drawer"
        role="dialog"
        aria-modal={!isDockedDesktop}
        aria-label="Giỏ hàng"
        aria-hidden={!isCartOpen}
        className={`
          flex flex-col shadow-2xl transition-transform duration-300 ease-out overflow-hidden
          ${
            isLight
              ? 'bg-[#faf7f2] text-zinc-900 border-[#e4d8c5]'
              : 'bg-[#161311] text-white border-white/[0.08]'
          }
          max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-auto max-lg:z-[120]
          max-lg:w-full max-lg:h-[85vh] max-lg:max-h-[85vh] max-lg:rounded-t-3xl max-lg:border-t
          ${isCartOpen ? 'max-lg:translate-y-0' : 'max-lg:translate-y-full'}
          ${
            isDockedDesktop
              ? 'lg:relative lg:inset-auto lg:z-20 lg:w-[350px] xl:w-[375px] lg:h-full lg:shrink-0 lg:border-l lg:translate-x-0 pointer-events-auto'
              : `lg:fixed lg:inset-y-0 lg:right-0 lg:z-[120] lg:w-[380px] lg:h-full lg:border-l ${
                  isCartOpen ? 'lg:translate-x-0 pointer-events-auto' : 'lg:translate-x-full pointer-events-none'
                }`
          }
        `}
      >
        {/* Thanh kéo giả cho Bottom Sheet trên Mobile */}
        <div className="w-12 h-1.5 bg-gray-400/40 rounded-full mx-auto mt-2.5 mb-0.5 shrink-0 lg:hidden" />

        {/* Header giỏ hàng */}
        <div
          className={`px-4 py-3 border-b flex justify-between items-center gap-2 shrink-0 ${
            isLight ? 'border-[#e4d8c5] bg-[#f3ece0]/80' : 'border-white/[0.08] bg-[#1c1714]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-[#ee2828]/10 text-[#ee2828]'
                  : 'bg-[#f5c043]/15 text-[#f5c043]'
              }`}
            >
              <ShoppingBag size={16} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`font-extrabold text-[15px] leading-tight truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  {isEn ? 'Your Cart' : 'Giỏ hàng'}
                </h2>
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                    isLight
                      ? 'bg-zinc-200/80 text-zinc-800'
                      : 'bg-white/[0.08] text-zinc-200'
                  }`}
                >
                  {displayTotalItems} {isEn ? 'items' : 'món'}
                </span>
              </div>
            </div>
          </div>

          {/* Cụm nút hành động: Xóa tất cả + Ghim (Desktop) + Đóng (X) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {displayItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                title={isEn ? 'Clear cart' : 'Xóa toàn bộ giỏ hàng'}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  isLight
                    ? 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
                    : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                }`}
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={togglePinCart}
              aria-pressed={isCartPinned}
              aria-label={isCartPinned ? (isEn ? 'Unpin cart' : 'Bỏ ghim giỏ hàng') : (isEn ? 'Pin cart' : 'Ghim giỏ hàng cố định')}
              title={isCartPinned ? (isEn ? 'Unpin cart' : 'Bỏ ghim giỏ hàng') : (isEn ? 'Pin cart' : 'Ghim giỏ hàng cố định')}
              className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isCartPinned
                  ? isLight
                    ? 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/50 hover:bg-[#fde68a]'
                    : 'bg-[#f5c043]/15 text-[#f5c043] border-[#f5c043]/35 hover:bg-[#f5c043]/25'
                  : isLight
                    ? 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              {isCartPinned ? <PinOff size={13} /> : <Pin size={13} />}
              <span>{isCartPinned ? (isEn ? 'Unpin' : 'Bỏ ghim') : (isEn ? 'Pin' : 'Ghim')}</span>
            </button>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeCart}
              aria-label="Đóng giỏ hàng"
              title="Đóng giỏ hàng (Esc)"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Danh sách món ăn trong giỏ */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3 custom-scrollbar">
          {displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-14 px-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                  isLight ? 'bg-zinc-200/80 text-zinc-500' : 'bg-white/5 text-gray-500'
                }`}
              >
                <ShoppingBag size={28} />
              </div>
              <p className={`font-bold text-sm ${isLight ? 'text-zinc-800' : 'text-gray-200'}`}>
                {isEn ? 'Your cart is empty' : 'Giỏ hàng của bạn đang trống'}
              </p>
              <p className={`text-xs mt-1 max-w-[220px] ${isLight ? 'text-zinc-500' : 'text-gray-400'}`}>
                {isEn
                  ? 'Choose your favorite dishes from the menu to start ordering!'
                  : 'Hãy chọn món ngon từ thực đơn để bắt đầu đặt hàng nhé!'}
              </p>
            </div>
          ) : (
            displayItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-3 relative border transition-all ${
                  isLight
                    ? 'bg-white border-[#e4d8c5] hover:border-[#d4c3aa] text-zinc-900 shadow-xs'
                    : 'bg-[#211c18] border-white/[0.08] hover:border-white/[0.15] text-white shadow-sm'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {/* Ảnh món ăn bo góc bên trái */}
                  <div
                    className={`w-14 h-14 rounded-xl overflow-hidden relative shrink-0 border ${
                      isLight ? 'border-zinc-200 bg-zinc-100' : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <Image
                      src={getCartItemImage(item)}
                      alt={item.name}
                      fill
                      sizes="56px"
                      unoptimized={shouldBypassNextImageOptimization(getCartItemImage(item))}
                      className="object-cover"
                    />
                  </div>

                  {/* Nội dung món ăn bên phải */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3
                        className={`font-extrabold text-sm leading-snug line-clamp-2 ${
                          isLight ? 'text-zinc-900' : 'text-white'
                        }`}
                      >
                        {td(item.name)}
                      </h3>

                      {/* Cụm nút Sửa & Xóa dạng icon tinh tế */}
                      <div className="flex items-center gap-0.5 shrink-0 -mt-0.5 -mr-1">
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          disabled={loadingEdit}
                          title="Tùy chỉnh món"
                          aria-label={`Tùy chỉnh ${item.name}`}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${
                            isLight
                              ? 'text-zinc-500 hover:text-[#007a3f] hover:bg-emerald-50'
                              : 'text-zinc-400 hover:text-[#f5c043] hover:bg-white/[0.08]'
                          }`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          title="Xóa món"
                          aria-label={`Xóa ${item.name}`}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isLight
                              ? 'text-zinc-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Thông tin tùy chọn Cỡ / Đế / Topping / Combo */}
                    <div
                      className={`text-[11px] font-medium space-y-0.5 mt-1 ${
                        isLight ? 'text-zinc-600' : 'text-zinc-400'
                      }`}
                    >
                      {item.options?.comboItems ? (
                        <div className="flex flex-col gap-1 mt-1">
                          {item.options.comboItems.map(
                            (
                              ci: {
                                name: string;
                                size?: string;
                                crust?: string;
                                toppings?: { name: string; price: number }[];
                              },
                              idx: number
                            ) => (
                              <div key={idx} className="flex flex-col">
                                <span className={`font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                                  {idx + 1}. {ci.name}
                                </span>
                                {(ci.size || ci.crust) && (
                                  <span className="pl-2.5 text-[10.5px]">
                                    {[ci.size && `Cỡ ${ci.size}`, ci.crust && `Đế ${ci.crust}`]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </span>
                                )}
                                {ci.toppings &&
                                  ci.toppings.length > 0 &&
                                  ci.toppings.map((tp, tidx: number) => (
                                    <span
                                      key={tidx}
                                      className="italic pl-2.5 block text-[10.5px]"
                                    >
                                      + {tp.name} (+{formatPrice(tp.price)})
                                    </span>
                                  ))}
                              </div>
                            )
                          )}
                          {item.options?.notes && (
                            <div
                              className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold self-start ${
                                isLight
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-white/[0.06] text-amber-300 border border-white/10'
                              }`}
                            >
                              Ghi chú: {item.options.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {(item.options?.size || item.options?.crust) && (
                            <p className="leading-snug">
                              {[
                                item.options?.size &&
                                  `${isEn ? 'Size' : 'Cỡ'}: ${td(item.options.size)}`,
                                item.options?.crust &&
                                  `${isEn ? 'Crust' : 'Đế'}: ${td(item.options.crust)}`,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          )}
                          {item.options?.toppings &&
                            (Array.isArray(item.options.toppings) && item.options.toppings.length > 0 ? (
                              <div className="pt-0.5 space-y-0.5">
                                {item.options.toppings.map((tp, tidx: number) => (
                                  <span
                                    key={tidx}
                                    className="italic block text-[10.5px]"
                                  >
                                    + {td(tp.name)} (+{formatPrice(tp.price)})
                                  </span>
                                ))}
                              </div>
                            ) : typeof item.options.toppings === 'string' &&
                              (item.options.toppings as string).length > 0 ? (
                              <p>Topping: {item.options.toppings as string}</p>
                            ) : null)}
                          {item.options?.notes && (
                            <div
                              className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold ${
                                isLight
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-white/[0.06] text-amber-300 border border-white/10'
                              }`}
                            >
                              {isEn ? 'Note:' : 'Ghi chú:'} {item.options.notes}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Hàng dưới: Bộ tăng giảm số lượng + Thành tiền */}
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-dashed border-current/10">
                      <div
                        className={`inline-flex items-center rounded-lg border h-7 px-0.5 ${
                          isLight
                            ? 'bg-zinc-100 border-zinc-200/90 text-zinc-900'
                            : 'bg-white/[0.06] border-white/10 text-white'
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="min-w-[24px] text-center text-xs font-extrabold select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </button>
                      </div>

                      <span
                        className={`text-sm font-black tracking-tight ${
                          isLight ? 'text-[#ee2828]' : 'text-[#f5c043]'
                        }`}
                      >
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Gợi ý combo tiết kiệm */}
          {displayItems.length > 0 && (
            <ComboSuggestion
              dishIds={Array.from(
                new Set(
                  displayItems.flatMap((item) => {
                    const ids: number[] = [];
                    if (item.dish_id) ids.push(item.dish_id);
                    if (item.halves && Array.isArray(item.halves)) {
                      item.halves.forEach((h) => {
                        if (h.dish_id) ids.push(h.dish_id);
                      });
                    }
                    return ids;
                  })
                )
              )}
            />
          )}

          {/* Món thường được đặt cùng */}
          {displayItems.length > 0 && <FrequentlyOrderedTogether />}
        </div>

        {/* Nút Thanh toán cố định ở dưới cùng */}
        <div
          className={`p-3.5 border-t shrink-0 space-y-2.5 ${
            isLight ? 'bg-[#f3ece0]/90 border-[#e4d8c5]' : 'bg-[#1c1714] border-white/[0.08]'
          }`}
        >
          {displayItems.length > 0 && (
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className={`font-semibold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {isEn
                  ? `Subtotal (${displayTotalItems} items)`
                  : `Tạm tính (${displayTotalItems} món)`}
              </span>
              <span className={`text-base font-black ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {formatPrice(displayTotalPrice)}
              </span>
            </div>
          )}
          <button
            type="button"
            className="w-full bg-[#ee2828] hover:bg-[#d82020] active:scale-[0.99] disabled:bg-zinc-700 disabled:opacity-50 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            onClick={handleCheckout}
            disabled={displayItems.length === 0}
          >
            <span>{isEn ? 'Proceed to Checkout' : 'Tiến hành thanh toán'}</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </aside>

      {editingItem && editingItem.type === 'regular' && dishForEdit && (
        <ProductModal
          isOpen={!!editingItem}
          onClose={() => {
            setEditingItem(null);
            setDishForEdit(null);
          }}
          product={dishForEdit}
          categoryName={categoryNameForEdit}
          editCartItem={editingItem}
        />
      )}

      {editingItem && editingItem.type === 'combo' && (
        <ComboModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          comboId={editingItem.combo_id || editingItem.dish_id || 0}
          comboName={editingItem.name}
          comboPrice={editingItem.price}
          comboDescription=""
          imageUrl={editingItem.imageUrl}
          editCartItem={editingItem}
        />
      )}

      {editingItem && editingItem.type === 'half_half' && (
        <HalfHalfModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          editCartItem={editingItem}
        />
      )}
    </>
  );
}
