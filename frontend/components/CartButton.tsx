'use client';

import { ShoppingCart } from 'lucide-react';
import { useUI } from '@/components/UIProvider';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';

export default function CartButton() {
  const { toggleCart } = useUI();
  const { totalItems } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const count = isMounted ? totalItems() : 0;

  return (
    <button 
      onClick={toggleCart}
      className="relative p-2 bg-[#f4ebd0] text-black rounded-full hover:bg-white transition-colors lg:hidden"
    >
      <ShoppingCart size={20} className="fill-black" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-pizza-red text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-md">
          {count}
        </span>
      )}
    </button>
  );
}
