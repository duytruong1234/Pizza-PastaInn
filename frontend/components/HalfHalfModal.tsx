'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { API_BASE } from '@/lib/config';

export default function HalfHalfModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const CustomSelect = ({ value, options, onChange }: { value: any, options: { value: any, label: string }[], onChange: (val: any) => void }) => {
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const selectRef = React.useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
      if (isSelectOpen && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // Nếu khoảng trống bên dưới ít hơn 250px (đủ cho dropdown), thì hất lên trên
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
          className="w-full bg-black/20 border border-white/20 text-white rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-black/30 transition-colors"
          onClick={() => setIsSelectOpen(!isSelectOpen)}
        >
          <span className="text-sm truncate">{selectedOption ? selectedOption.label : "Select..."}</span>
          <ChevronDown size={16} className={`transition-transform duration-200 ${isSelectOpen ? (openUpwards ? 'rotate-0' : 'rotate-180') : ''}`} />
        </div>

        {isSelectOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsSelectOpen(false)} />
            <div className={`absolute z-20 left-0 right-0 ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'} bg-[#8b2006] border border-white/20 rounded-lg shadow-2xl max-h-56 overflow-y-auto custom-scrollbar`}>
              {options.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${value === option.value
                    ? 'bg-white/20 font-bold'
                    : 'hover:bg-white/10'
                    }`}
                  onClick={() => {
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
  const { addToCart } = useCartStore();

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
    const mainContainer = document.getElementById('main-scroll-container');
    if (isOpen) {
      if (mainContainer) mainContainer.style.overflow = 'hidden';
      fetchData();
      setQuantity(1);
      setNote('');
      setSelectedToppingIds([]);
    } else {
      if (mainContainer) mainContainer.style.overflow = '';
    }

    return () => {
      if (mainContainer) mainContainer.style.overflow = '';
    };
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // Lấy danh mục để tìm Pizza
      const catRes = await fetch(`${API_BASE}/menu/categories`);
      const catData = await catRes.json();
      const pizzaCat = catData.data?.find((c: any) => c.category_name?.toLowerCase() === 'pizza');

      const [dishesRes, sizesRes, crustsRes, toppingsRes] = await Promise.all([
        fetch(`${API_BASE}/menu/dishes?category_id=${pizzaCat?.category_id || ''}&all=true`),
        fetch(`${API_BASE}/menu/sizes`),
        fetch(`${API_BASE}/menu/crusts`),
        fetch(`${API_BASE}/menu/toppings?type=pizza`)
      ]);

      const dishes = await dishesRes.json();
      const sz = await sizesRes.json();
      const cr = await crustsRes.json();
      const tp = await toppingsRes.json();

      if (dishes.success) {
        setAllDishes(dishes.data);
        const validPizzas = dishes.data.filter((p: any) => !p.dish_name.toLowerCase().includes('half-half') && !p.dish_name.toLowerCase().includes('half half'));
        setPizzas(validPizzas);
        if (validPizzas.length > 0) {
          setFirstHalfId(validPizzas[0].dish_id);
          setSecondHalfId(validPizzas[Math.min(1, validPizzas.length - 1)].dish_id);
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

    const baseHalfHalfDish = allDishes.find(p => p.dish_name.toLowerCase().includes('half-half') || p.dish_name.toLowerCase().includes('half half'));
    let dishPriceId: string | undefined = undefined;
    
    // 100% Database Driven - No hardcoded fallbacks
    if (baseHalfHalfDish && baseHalfHalfDish.prices) {
      const dp = baseHalfHalfDish.prices.find((p: any) => p.size_id === selectedSizeId && p.crust_id === selectedCrustId);
      if (dp) dishPriceId = dp.dish_price_id;
    }

    addToCart({
      type: 'half_half',
      dish_id: dish1?.dish_id || 0,
      dish_price_id: dishPriceId,
      name: label,
      price: basePrice + toppingsPrice,
      quantity,
      imageUrl: dish1?.image || '',
      // Dữ liệu 2 nửa pizza để lưu vào bảng cart_item_half
      halves: [
        { dish_id: dish1?.dish_id || 0, name: dish1?.dish_name || '' },
        { dish_id: dish2?.dish_id || 0, name: dish2?.dish_name || '' }
      ],
      options: {
        size: sizeObj?.size_name,
        crust: crustObj?.crust_name,
        toppings: selectedToppingsObjs.map(t => ({
          topping_id: t.topping_id,
          name: t.topping_name,
          price: t.price_topping || 0
        })),
        notes: note,
      }
    });

    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#9f280a] text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row w-full max-w-5xl max-h-[95vh]">

        {/* Left Side: Configuration */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative border-b md:border-b-0 md:border-r border-white/20">
          <h2 className="text-3xl font-black text-white leading-tight mb-1">Pizza Half / Half</h2>
          <p className="text-white/80 mb-6 text-sm">Mix and match two of your favorite flavors on one pizza!</p>

          <div className="space-y-8">
            {/* 1. Size */}
            <div>
              <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">1. Size (*)</label>
              <div className="flex gap-3">
                {sizes.map(s => (
                  <button
                    key={s.size_id}
                    onClick={() => setSelectedSizeId(s.size_id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedSizeId === s.size_id
                        ? 'bg-white text-[#9f280a]'
                        : 'bg-black/20 text-white hover:bg-black/30'
                      }`}
                  >
                    {s.size_name} {s.size_name === 'Regular' ? '(6 Pieces)' : s.size_name === 'Large' ? '(12 Pieces)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Crust */}
            <div>
              <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">2. Crust (*)</label>
              <div className="space-y-2">
                {crusts.map(c => (
                  <label
                    key={c.crust_id}
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setSelectedCrustId(c.crust_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCrustId === c.crust_id ? 'border-white' : 'border-white/50 group-hover:border-white/80'
                        }`}>
                        {selectedCrustId === c.crust_id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm text-white">{c.crust_name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Choose Pizza */}
            <div>
              <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">3. Choose Pizza (*)</label>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">First Half</label>
                  <CustomSelect
                    value={firstHalfId || ''}
                    options={pizzas.map(p => ({ value: p.dish_id, label: p.dish_name }))}
                    onChange={(val) => setFirstHalfId(Number(val))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Second Half</label>
                  <CustomSelect
                    value={secondHalfId || ''}
                    options={pizzas.map(p => ({ value: p.dish_id, label: p.dish_name }))}
                    onChange={(val) => setSecondHalfId(Number(val))}
                  />
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
                          <span className="text-white font-medium text-sm">{t.topping_name}</span>
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
              <label className="block text-lg font-bold text-white mb-3 border-b border-white/20 pb-1">Note</label>
              <input
                type="text"
                placeholder="Leave a note about your order here..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-white text-black rounded-lg p-3 outline-none text-sm mt-2"
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

          <h3 className="text-xl font-bold text-white mb-6 pr-8 uppercase border-b border-white/20 pb-2">Order Summary</h3>

          <div className="bg-black/30 rounded-xl border border-white/10 p-5 mb-auto">
            <h4 className="font-bold text-[#f0c14b] text-lg mb-3 border-b border-white/10 pb-2 leading-snug">
              {pizzas.find(p => p.dish_id === firstHalfId)?.dish_name} / {pizzas.find(p => p.dish_id === secondHalfId)?.dish_name}
            </h4>
            <div className="space-y-2 text-sm text-white/90">
              <p><span className="font-bold text-white/70">Size:</span> {sizes.find(s => s.size_id === selectedSizeId)?.size_name}</p>
              <p><span className="font-bold text-white/70">Crust:</span> {crusts.find(c => c.crust_id === selectedCrustId)?.crust_name}</p>
              {selectedToppingIds.length > 0 ? (
                <div>
                  <span className="font-bold text-white/70">Topping:</span>
                  <div className="ml-1 mt-1">
                    {toppings.filter(t => selectedToppingIds.includes(t.topping_id)).map(t => (
                      <span key={t.topping_id} className="italic text-white/70 block mb-0.5">
                        • topping: {t.topping_name} (+{formatPrice(t.price_topping)})
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p><span className="font-bold text-white/70">Topping:</span> None</p>
              )}
            </div>
            {note && (
              <div className="mt-4 inline-block bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/20 italic">
                Note: {note}
              </div>
            )}
          </div>

          {/* Nút thao tác */}
          <div className="mt-8 pt-4 border-t border-white/20 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center bg-white text-black rounded-xl overflow-hidden font-bold h-10 w-28 shadow-md">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="flex-1 h-full hover:bg-gray-200 transition-colors flex items-center justify-center text-xl"
              >
                -
              </button>
              <span className="w-8 text-center text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="flex-1 h-full hover:bg-gray-200 transition-colors flex items-center justify-center text-xl"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full sm:w-[90%] bg-[#f0c14b] hover:bg-[#e2b036] text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2.5 text-base"
            >
              <ShoppingCart size={20} />
              <span>{"Add to Cart"} : {formatPrice(subtotal)}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
