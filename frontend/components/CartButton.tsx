'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useUI } from '@/components/UIProvider';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

export default function CartButton() {
  const { isCartOpen, toggleCart, theme } = useUI();
  const isLight = theme === 'light';
  const items = useCartStore((state) => state.items);
  const lastAddedAt = useCartStore((state) => state.lastAddedAt);
  const [isMounted, setIsMounted] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!lastAddedAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsBouncing(true);
    const timer = setTimeout(() => {
      setIsBouncing(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [lastAddedAt]);

  const count = isMounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const total = isMounted
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  const ariaLabel =
    count > 0
      ? `Giỏ hàng: ${count} món, tổng cộng ${formatPrice(total)}`
      : 'Giỏ hàng trống, 0 món';

  return (
    <button
      type="button"
      onClick={toggleCart}
      aria-label={ariaLabel}
      aria-expanded={isCartOpen}
      aria-controls="cart-drawer"
      title={ariaLabel}
      className={`group relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none border active:scale-95 ${
        isCartOpen
          ? 'bg-gradient-to-r from-[#ee2828] to-[#b91c1c] text-white border-[#f5c043] ring-2 ring-[#f5c043]/35 shadow-[0_4px_16px_rgba(238,40,40,0.45)]'
          : count > 0
            ? 'bg-gradient-to-r from-[#ee2828] to-[#c81e1e] hover:from-[#f53b3b] hover:to-[#dc2626] text-white border-white/20 shadow-[0_4px_14px_rgba(238,40,40,0.35)]'
            : isLight
              ? 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 border-zinc-200 shadow-sm'
              : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/12 hover:border-[#f5c043]/50 shadow-sm'
      }`}
    >
      <ShoppingCart
        size={19}
        strokeWidth={2.3}
        className={`transition-transform duration-300 ${
          isBouncing
            ? 'scale-115 -rotate-6 text-[#f5c043]'
            : count > 0 || isCartOpen
              ? 'text-white group-hover:scale-105'
              : isLight
                ? 'text-[#ee2828] group-hover:scale-105'
                : 'text-[#f5c043] group-hover:scale-105'
        }`}
      />

      <span
        className={`absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-black leading-none transition-transform duration-300 ease-out shadow-sm border-2 ${
          isLight ? 'border-white' : 'border-[#14110f]'
        } ${
          isCartOpen || count > 0
            ? 'bg-[#f5c043] text-zinc-950'
            : isLight
              ? 'bg-zinc-200 text-zinc-800 group-hover:bg-[#ee2828] group-hover:text-white'
              : 'bg-zinc-700 text-white group-hover:bg-[#f5c043] group-hover:text-zinc-950'
        } ${isBouncing ? 'scale-125 -translate-y-0.5' : 'scale-100 translate-y-0'}`}
      >
        {count}
      </span>
    </button>
  );
}
