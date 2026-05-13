'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useUI } from './UIProvider';
import { X, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';

export default function CartSidebar() {
  const router = useRouter();
  const { isCartOpen, toggleCart } = useUI();
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

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
    toggleCart();
    router.push('/checkout');
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayItems = isMounted ? items : [];
  const displayTotalItems = isMounted ? totalItems() : 0;
  const displayTotalPrice = isMounted ? totalPrice() : 0;

  return (
    <>
      {/* Overlay khi sidebar mở */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={toggleCart}
        />
      )}
      
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[400px] bg-black/95 md:bg-black/80 backdrop-blur-md border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        md:w-[300px] lg:relative lg:inset-auto lg:w-[350px] lg:z-10
      `}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111] md:bg-transparent">
          <div className="text-left md:text-center flex-1">
            <h2 className="text-white font-bold text-xl mb-1">{"Cart"}</h2>
            <div className="flex items-center justify-start md:justify-center gap-3">
              <p className="text-gray-400 text-sm">{"Quantity:"} {displayTotalItems} {"items"}</p>
              {displayItems.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} />
                  {"Clear All"}
                </button>
              )}
            </div>
          </div>
          {/* Nút đóng - hiển thị trên cả mobile và desktop */}
          <button onClick={toggleCart} className="p-2 text-gray-300 hover:text-white transition-colors lg:hidden">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {displayItems.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              {"Your cart is empty"}
            </div>
          ) : (
            displayItems.map((item) => (
              <div key={item.id} className="bg-[#d2a679]/30 rounded-md p-3 relative shadow-md border border-white/10 flex flex-col min-h-[95px]">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-bold text-base w-3/4 drop-shadow-md">{item.name}</h3>
                  <div className="w-12 h-12 rounded-full overflow-hidden absolute top-2 right-2 border-2 border-white/20 shadow-sm">
                    <Image 
                      src={item.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop"} 
                      alt={item.name} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                </div>
                
                <div className="text-[11px] font-bold text-white/90 space-y-0.5 mb-2 w-full">
                  {item.options?.comboItems ? (
                    <div className="flex flex-col gap-1.5 mt-1">
                      {item.options.comboItems.map((ci: any, idx: number) => (
                        <div key={idx} className="flex flex-col">
                          <span className="text-white font-extrabold">{idx + 1}. {ci.name}</span>
                          <div className="ml-3 font-normal text-white/80 space-y-0.5">
                            {ci.size && <span>Size: {ci.size}<br/></span>}
                            {ci.crust && <span>Crust: {ci.crust}<br/></span>}
                            {ci.toppings && ci.toppings.length > 0 && ci.toppings.map((tp: any, tidx: number) => (
                              <span key={tidx} className="italic text-white/70 ml-2 block">
                                • topping: {tp.name} (+{formatPrice(tp.price)})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {item.options?.notes && (
                        <div className="bg-[#9f280a] inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] text-white self-start">
                          Note: {item.options.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {item.options?.size && <p>{"Size"}: {item.options.size}</p>}
                      {item.options?.crust && <p>{"Crust"}: {item.options.crust}</p>}
                      {item.options?.toppings && (
                        Array.isArray(item.options.toppings) && item.options.toppings.length > 0 ? (
                          <div className="ml-1 mt-1">
                            {item.options.toppings.map((tp: any, tidx: number) => (
                              <span key={tidx} className="italic text-white/70 block">
                                • topping: {tp.name} (+{formatPrice(tp.price)})
                              </span>
                            ))}
                          </div>
                        ) : typeof item.options.toppings === 'string' && (item.options.toppings as string).length > 0 ? (
                          <p>{"Topping"}: {item.options.toppings as string}</p>
                        ) : null
                      )}
                      {item.options?.notes && (
                        <div className="bg-[#9f280a] inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] text-white">
                          {"Note"}: {item.options.notes}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-between items-end mt-auto pt-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#fcebb6] flex items-center rounded text-black font-bold h-5 text-[11px]">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-1.5 hover:bg-yellow-200 rounded-l">-</button>
                      <span className="px-1">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-1.5 hover:bg-yellow-200 rounded-r">+</button>
                    </div>
                    <button className="bg-[#007a3f] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">{"Edit"}</button>
                    <button onClick={() => removeFromCart(item.id)} className="bg-[#ee2828] text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">{"Delete"}</button>
                  </div>
                  
                  <div className="text-right flex flex-col justify-end">
                    <div className="bg-white px-2 py-0.5 rounded text-black font-bold mt-1 text-xs text-center min-w-[70px]">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-transparent mb-4">
          <button 
            className="w-full bg-[#cd3645] hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2"
            onClick={handleCheckout}
            disabled={displayItems.length === 0}
          >
            <span>{"Checkout:"}</span>
            <span>{formatPrice(displayTotalPrice)}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
