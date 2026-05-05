'use client';

import React, { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useUI } from './UIProvider';
import { X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function CartSidebar() {
  const { isCartOpen, toggleCart, t, tMenu } = useUI();
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayItems = isMounted ? items : [];
  const displayTotalItems = isMounted ? totalItems() : 0;
  const displayTotalPrice = isMounted ? totalPrice() : 0;

  return (
    <>
      {/* Overlay khi sidebar mở (chỉ trên mobile) */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={toggleCart}
        />
      )}
      
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[400px] bg-black/95 md:bg-black/80 backdrop-blur-md border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
        md:relative md:translate-x-0 md:w-[300px] lg:w-[350px] md:z-10
      `}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111] md:bg-transparent">
          <div className="text-left md:text-center flex-1">
            <h2 className="text-white font-bold text-xl mb-1">{t('cart.title')}</h2>
            <p className="text-gray-400 text-sm">{t('cart.quantity')} {displayTotalItems} {t('cart.items')}</p>
          </div>
          {/* Nút đóng - chỉ hiển trên mobile */}
          <button onClick={toggleCart} className="p-2 text-gray-300 hover:text-white transition-colors md:hidden">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {displayItems.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              {t('cart.empty')}
            </div>
          ) : (
            displayItems.map((item) => (
              <div key={item.id} className="bg-[#d2a679]/30 rounded-md p-3 relative shadow-md border border-white/10">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-bold text-base w-3/4 drop-shadow-md">{tMenu(item.name)}</h3>
                  <div className="w-12 h-12 rounded-full overflow-hidden absolute top-2 right-2 border-2 border-white/20 shadow-sm">
                    <Image 
                      src={item.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop"} 
                      alt={item.name} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                </div>
                
                <div className="text-[11px] font-bold text-white/90 space-y-0.5 mb-2 w-2/3">
                  {item.options?.size && <p>{t('cart.size')}: {tMenu(item.options.size)}</p>}
                  {item.options?.crust && <p>{t('cart.crust')}: {tMenu(item.options.crust)}</p>}
                  {item.options?.toppings && <p>{t('cart.topping')}: {item.options.toppings.split(', ').map((tp: string) => tMenu(tp)).join(', ')}</p>}
                  {item.options?.notes && (
                    <div className="bg-[#9f280a] inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] text-white">
                      {t('cart.note')}: {item.options.notes}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end mt-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#fcebb6] flex items-center rounded text-black font-bold h-5 text-[11px]">
                      <button onClick={() => updateQuantity(item.id, item.dish_price_id, item.quantity - 1)} className="px-1.5 hover:bg-yellow-200 rounded-l">-</button>
                      <span className="px-1">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.dish_price_id, item.quantity + 1)} className="px-1.5 hover:bg-yellow-200 rounded-r">+</button>
                    </div>
                    <button className="bg-[#007a3f] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">{t('cart.edit')}</button>
                    <button onClick={() => removeFromCart(item.id, item.dish_price_id)} className="bg-[#ee2828] text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">{t('cart.delete')}</button>
                  </div>
                  
                  <div className="text-right flex flex-col">
                    {(item.options?.extraPrice) && (
                      <>
                        <span className="text-white/80 text-[9px] font-bold">{t('cart.pizzaPrice')}: {formatPrice(item.price)}</span>
                        <span className="text-white/80 text-[9px] font-bold">{t('cart.extraToppings')}: {formatPrice(item.options.extraPrice)}</span>
                      </>
                    )}
                    <div className="bg-white px-2 py-0.5 rounded text-black font-bold mt-1 text-xs text-center min-w-[70px]">
                      {formatPrice((item.price + (item.options?.extraPrice || 0)) * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-transparent mb-4">
          <button className="w-full bg-[#cd3645] hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2">
            <span>{t('cart.payNow')}</span>
            <span>{formatPrice(displayTotalPrice)}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
