'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';

export default function HalfHalfModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToCart } = useCartStore();
  const { t, tMenu } = useUI();

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
    if (isOpen) {
      fetchData();
      setQuantity(1);
      setNote('');
      setSelectedToppingIds([]);
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // Lấy danh mục để tìm Pizza
      const catRes = await fetch('http://localhost:4000/api/menu/categories');
      const catData = await catRes.json();
      const pizzaCat = catData.data?.find((c: any) => c.category_name?.toLowerCase() === 'pizza');

      const [dishesRes, sizesRes, crustsRes, toppingsRes] = await Promise.all([
        fetch(`http://localhost:4000/api/menu/dishes?category_id=${pizzaCat?.category_id || ''}`),
        fetch('http://localhost:4000/api/menu/sizes'),
        fetch('http://localhost:4000/api/menu/crusts'),
        fetch('http://localhost:4000/api/menu/toppings?type=pizza')
      ]);

      const dishes = await dishesRes.json();
      const sz = await sizesRes.json();
      const cr = await crustsRes.json();
      const tp = await toppingsRes.json();

      if (dishes.success) {
        setPizzas(dishes.data);
        if (dishes.data.length > 0) {
          setFirstHalfId(dishes.data[0].dish_id);
          setSecondHalfId(dishes.data[Math.min(1, dishes.data.length - 1)].dish_id);
        }
      }
      if (sz.success) {
        setSizes(sz.data);
        if (sz.data.length > 0) setSelectedSizeId(sz.data[0].size_id);
      }
      if (cr.success) {
        setCrusts(cr.data.filter((c: any) => c.is_visible !== false && c.crust_name !== 'None'));
        if (cr.data.length > 0) setSelectedCrustId(cr.data[0].crust_id);
      }
      if (tp.success) setToppings(tp.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredToppings = useMemo(() => {
    return toppings.filter(t => !t.size_id || t.size_id === selectedSizeId);
  }, [toppings, selectedSizeId]);

  const getDishPrice = (dishId: number | null) => {
    if (!dishId || !selectedSizeId || !selectedCrustId) return 0;
    const dish = pizzas.find(p => p.dish_id === dishId);
    if (!dish || !dish.prices) return 0;
    const dp = dish.prices.find((p: any) => p.size_id === selectedSizeId && p.crust_id === selectedCrustId);
    return dp ? dp.dish_price : 0;
  };

  const firstHalfPrice = getDishPrice(firstHalfId);
  const secondHalfPrice = getDishPrice(secondHalfId);
  
  // Tính trung bình cộng hoặc max? Thường half-half lấy trung bình cộng
  const basePrice = (firstHalfPrice + secondHalfPrice) / 2;

  const toppingsPrice = selectedToppingIds.reduce((total, id) => {
    const t = toppings.find(x => x.topping_id === id);
    return total + (t ? t.price_topping : 0);
  }, 0);

  const subtotal = (basePrice + toppingsPrice) * quantity;

  const handleToppingToggle = (id: number) => {
    setSelectedToppingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    const dish1 = pizzas.find(p => p.dish_id === firstHalfId);
    const dish2 = pizzas.find(p => p.dish_id === secondHalfId);
    const sizeObj = sizes.find(s => s.size_id === selectedSizeId);
    const crustObj = crusts.find(c => c.crust_id === selectedCrustId);
    const selectedToppingsObjs = toppings.filter(t => selectedToppingIds.includes(t.topping_id));

    let label = `[Half-Half] ${dish1?.dish_name} / ${dish2?.dish_name}`;
    if (crustObj) label += ` (${crustObj.crust_name})`;
    if (sizeObj) label += ` - ${sizeObj.size_name}`;
    if (selectedToppingsObjs.length > 0) {
      label += ` + [${selectedToppingsObjs.map(t => t.topping_name).join(', ')}]`;
    }
    
    // Tìm dish_price_id để lưu vào cart (chỉ lưu cho thống kê nếu cần, dùng tạm của nửa 1)
    const dp = dish1?.prices?.find((p: any) => p.size_id === selectedSizeId && p.crust_id === selectedCrustId);

    addToCart({
      id: Date.now(), // Fake ID for custom item
      name: label,
      price: basePrice + toppingsPrice,
      quantity,
      note,
      imageUrl: dish1?.image || '',
      dish_price_id: dp ? dp.dish_price_id : undefined,
    });
    
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#9f280a] text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row w-full max-w-5xl max-h-[95vh]">
        
        {/* Left Side: Configuration */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative border-b md:border-b-0 md:border-r border-white/20">
          <h2 className="text-3xl font-black text-[#f0c14b] uppercase mb-1">PIZZA HALF / HALF</h2>
          <p className="text-white/80 mb-8 text-sm md:text-base">Mix and match two of your favorite flavors on one pizza!</p>

          <div className="space-y-8">
            {/* 1. Size */}
            <div>
              <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">1. Size (*)</label>
              <div className="flex gap-4">
                {sizes.map(s => (
                  <button
                    key={s.size_id}
                    onClick={() => setSelectedSizeId(s.size_id)}
                    className={`flex-1 py-2.5 rounded-lg text-center font-bold transition-all ${
                      selectedSizeId === s.size_id
                        ? 'bg-white text-[#9f280a] shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                        : 'bg-black/20 text-white hover:bg-black/30 border border-transparent'
                    }`}
                  >
                    {tMenu(s.size_name)} {s.size_name === 'Regular' ? '(6 Pieces)' : s.size_name === 'Large' ? '(12 Pieces)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Crust */}
            <div>
              <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">2. Crust (*)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {crusts.map(c => (
                  <label
                    key={c.crust_id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCrustId === c.crust_id
                        ? 'border-white bg-white/10'
                        : 'border-transparent bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => setSelectedCrustId(c.crust_id)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 ${
                      selectedCrustId === c.crust_id ? 'border-white' : 'border-white/50'
                    }`}>
                      {selectedCrustId === c.crust_id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <span className="font-medium text-white text-sm">{tMenu(c.crust_name)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Choose Pizza */}
            <div className="bg-black/20 rounded-xl p-5 border border-white/10">
              <label className="block text-lg font-bold text-white mb-4 border-b border-white/20 pb-1">3. Choose Pizza (*)</label>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-white/80 mb-2">First Half</label>
                <div className="relative">
                  <select
                    value={firstHalfId || ''}
                    onChange={(e) => setFirstHalfId(Number(e.target.value))}
                    className="w-full p-3 bg-white/10 border border-white/20 text-white rounded-lg outline-none focus:border-white font-medium appearance-none"
                  >
                    {pizzas.map(p => (
                      <option key={p.dish_id} value={p.dish_id} className="text-black">{tMenu(p.dish_name)}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-white">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Second Half</label>
                <div className="relative">
                  <select
                    value={secondHalfId || ''}
                    onChange={(e) => setSecondHalfId(Number(e.target.value))}
                    className="w-full p-3 bg-white/10 border border-white/20 text-white rounded-lg outline-none focus:border-white font-medium appearance-none"
                  >
                    {pizzas.map(p => (
                      <option key={p.dish_id} value={p.dish_id} className="text-black">{tMenu(p.dish_name)}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-white">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Add Topping */}
            {filteredToppings.length > 0 && (
              <div>
                <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">4. Add Topping (Options)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {filteredToppings.map(t => {
                    const isSelected = selectedToppingIds.includes(t.topping_id);
                    return (
                      <label key={t.topping_id} className="flex items-center justify-between cursor-pointer group" onClick={() => handleToppingToggle(t.topping_id)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white' : 'border-white/50 group-hover:border-white/80'}`}>
                            {isSelected && <svg className="w-3 h-3 text-[#9f280a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                          </div>
                          <span className="text-white font-medium text-sm">{tMenu(t.topping_name)}</span>
                        </div>
                        <span className="text-[#f0c14b] font-bold text-sm shrink-0 ml-2">+{formatPrice(t.price_topping)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note */}
            <div className="mt-8">
              <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">Ghi chú</label>
              <input
                type="text"
                placeholder="Hãy để lại ghi chú về lưu ý món ăn của bạn nhé!!!"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 outline-none focus:border-white transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Summary */}
        <div className="w-full md:w-[350px] lg:w-[400px] bg-black/20 p-6 md:p-8 flex flex-col relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
          >
            <X size={18} />
          </button>
          
          <h3 className="text-xl font-bold text-white mb-6 pr-8 uppercase border-b border-white/20 pb-2">Cấu hình sản phẩm</h3>
          
          <div className="bg-black/30 rounded-xl border border-white/10 p-5 mb-auto">
            <h4 className="font-bold text-[#f0c14b] text-lg mb-3 border-b border-white/10 pb-2 leading-snug">
              {tMenu(pizzas.find(p => p.dish_id === firstHalfId)?.dish_name)} / {tMenu(pizzas.find(p => p.dish_id === secondHalfId)?.dish_name)}
            </h4>
            <div className="space-y-2 text-sm text-white/90">
              <p><span className="font-bold text-white/70">Size:</span> {sizes.find(s => s.size_id === selectedSizeId)?.size_name}</p>
              <p><span className="font-bold text-white/70">Crust:</span> {crusts.find(c => c.crust_id === selectedCrustId)?.crust_name}</p>
              <p><span className="font-bold text-white/70">Topping:</span> {
                selectedToppingIds.length > 0 
                  ? toppings.filter(t => selectedToppingIds.includes(t.topping_id)).map(t => tMenu(t.topping_name)).join(', ')
                  : 'Không có'
              }</p>
            </div>
            {note && (
              <div className="mt-4 inline-block bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/20 italic">
                Note: {note}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-white/80 font-bold text-lg">Tổng cộng:</span>
              <span className="text-3xl font-black text-[#f0c14b]">{formatPrice(subtotal)}</span>
            </div>
            
            <div className="flex items-center justify-center bg-white text-black rounded-xl overflow-hidden font-bold h-12 w-32 shadow-md">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="flex-1 h-full hover:bg-gray-200 transition-colors flex items-center justify-center text-xl"
              >
                -
              </button>
              <span className="w-12 text-center text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="flex-1 h-full hover:bg-gray-200 transition-colors flex items-center justify-center text-xl"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-[#f0c14b] hover:bg-[#e2b036] text-black font-bold h-14 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2.5 text-lg uppercase tracking-wide"
            >
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
