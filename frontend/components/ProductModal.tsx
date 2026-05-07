'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { X, ShoppingCart, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    ingredients: string;
    basePrice: number;
    prices?: any[];
    imageUrl: string;
  };
  categoryName?: string;
}

export default function ProductModal({ isOpen, onClose, product, categoryName }: ProductModalProps) {
  const { addToCart } = useCartStore();
  const { toggleCart, isCartOpen } = useUI();

  const [sizes, setSizes] = useState<any[]>([]);
  const [crusts, setCrusts] = useState<any[]>([]);
  const [toppings, setToppings] = useState<any[]>([]);

  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedCrust, setSelectedCrust] = useState<any>(null);
  const [selectedToppings, setSelectedToppings] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (isOpen) {
      if (mainContainer) mainContainer.style.overflow = 'hidden';
      fetchData();
      // Đặt lại trạng thái
      setQuantity(1);
      setSelectedToppings([]);
      setNote('');
    } else {
      if (mainContainer) mainContainer.style.overflow = '';
    }

    return () => {
      if (mainContainer) mainContainer.style.overflow = '';
    };
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [sizesRes, crustsRes] = await Promise.all([
        fetch('http://localhost:4000/api/menu/sizes'),
        fetch('http://localhost:4000/api/menu/crusts'),
      ]);
      const sizesData = await sizesRes.json();
      const crustsData = await crustsRes.json();

      if (sizesData.success) {
        // Lọc size thực tế có trong giá sản phẩm
        const availableSizeIds = new Set(product.prices?.map(p => p.size_id).filter(id => id !== null));
        const availableSizes = sizesData.data.filter((s: any) => availableSizeIds.has(s.size_id));
        setSizes(availableSizes);
        if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
        else setSelectedSize(null);
      }
      if (crustsData.success) {
        // Lọc đế bánh thực tế có trong giá sản phẩm
        const availableCrustIds = new Set(product.prices?.map(p => p.crust_id).filter(id => id !== null));
        const availableCrusts = crustsData.data.filter((c: any) => availableCrustIds.has(c.crust_id));
        setCrusts(availableCrusts);
        if (availableCrusts.length > 0) setSelectedCrust(availableCrusts[0]);
        else setSelectedCrust(null);
      }
    } catch (error) {
      console.error('Lỗi khi lấy tùy chọn', error);
    }
  };

  // Xác định loại topping theo danh mục
  const toppingType = (categoryName?.toLowerCase().includes('spaghetti') || categoryName?.toLowerCase().includes('gratin') || categoryName?.toLowerCase().includes('risotto')) ? 'spaghetti' : 'pizza';
  const isSimpleProduct = categoryName?.toLowerCase().includes('salad') || categoryName?.toLowerCase().includes('drink');

  useEffect(() => {
    if (isSimpleProduct) {
      setToppings([]);
      return;
    }

    if (selectedSize) {
      fetchToppings(selectedSize.size_id);
    } else if (sizes.length === 0) {
      // Nếu sản phẩm không có size, lấy topping chung
      fetchToppings(null);
    }
  }, [selectedSize, sizes.length, toppingType, isSimpleProduct]);

  const fetchToppings = async (size_id: number | null) => {
    try {
      let url = size_id
        ? `http://localhost:4000/api/menu/toppings?size_id=${size_id}&type=${toppingType}`
        : `http://localhost:4000/api/menu/toppings?type=${toppingType}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const sortedToppings = data.data.sort((a: any, b: any) => a.topping_id - b.topping_id);
        setToppings(sortedToppings);
      }
    } catch (error) {
      console.error('Lỗi khi lấy topping', error);
    }
  };

  if (!isOpen) return null;

  const handleToppingToggle = (topping: any) => {
    setSelectedToppings(prev =>
      prev.some(t => t.topping_id === topping.topping_id)
        ? prev.filter(t => t.topping_id !== topping.topping_id)
        : [...prev, topping]
    );
  };

  // Tìm giá chính xác theo size và crust đã chọn
  let exactDishPriceObj: any = null;
  if (selectedSize || selectedCrust) {
    exactDishPriceObj = product.prices?.find(
      (p) => p.size_id === selectedSize?.size_id && p.crust_id === selectedCrust?.crust_id
    );
  }
  // Sản phẩm không có size/crust (Salad, Drink) dùng giá đầu tiên
  if (!exactDishPriceObj && product.prices && product.prices.length > 0) {
    exactDishPriceObj = product.prices[0];
  }

  const currentBasePrice = exactDishPriceObj ? exactDishPriceObj.dish_price : product.basePrice;
  const extraToppingsPrice = selectedToppings.reduce((sum, t) => sum + (t.price_topping || 0), 0);
  const totalPrice = (currentBasePrice + extraToppingsPrice) * quantity;

  const handleAddToCart = () => {
    const dish_price_id = exactDishPriceObj?.dish_price_id
      || `${product.id}_default`;

    addToCart({
      type: 'regular',
      dish_id: product.id,
      dish_price_id,
      name: product.name,
      price: currentBasePrice + extraToppingsPrice,
      quantity,
      imageUrl: product.imageUrl,
      options: {
        size: selectedSize?.size_name,
        crust: selectedCrust?.crust_name,
        toppings: selectedToppings.map(t => ({
          topping_id: t.topping_id,
          name: t.topping_name,
          price: t.price_topping || 0
        })),
        notes: note,
      }
    });

    if (!isCartOpen) toggleCart();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#9f280a] text-white w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative max-h-[95vh]">

          {/* Nút đóng */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 md:top-4 md:right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Bên trái: Hình ảnh */}
          <div className="w-full md:w-1/2 relative h-[30vh] min-h-[200px] md:h-auto md:min-h-full shrink-0">
            <Image
              src={product.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop'}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Bên phải: Chi tiết & Tùy chọn */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#9f280a] min-h-0 relative">
            <div className="p-4 md:p-6 pb-2 overflow-y-auto custom-scrollbar flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{product.name?.normalize('NFC')}</h2>
              <p className="text-sm text-white/80 mb-6">{product.ingredients?.normalize('NFC')}</p>

              <div className="space-y-6">
              {/* Kích thước */}
              {sizes.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 border-b border-white/20 pb-1">{"Size (*):"}</h3>
                  <div className="flex gap-3">
                    {sizes.map(size => (
                      <button
                        key={size.size_id}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedSize?.size_id === size.size_id
                            ? 'bg-white text-[#9f280a]'
                            : 'bg-black/20 text-white hover:bg-black/30'
                          }`}
                      >
                        {size.size_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Đế bánh */}
              {crusts.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 border-b border-white/20 pb-1">{"Crust (*):"}</h3>
                  <div className="space-y-2">
                    {crusts.map(crust => {
                      // Tìm giá cho tổ hợp đế bánh + size đã chọn
                      const crustPrice = product.prices?.find(
                        (p: any) => p.size_id === selectedSize?.size_id && p.crust_id === crust.crust_id
                      );
                      return (
                        <label
                          key={crust.crust_id}
                          className="flex items-center justify-between cursor-pointer group"
                          onClick={() => setSelectedCrust(crust)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCrust?.crust_id === crust.crust_id ? 'border-white' : 'border-white/50 group-hover:border-white/80'
                              }`}>
                              {selectedCrust?.crust_id === crust.crust_id && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-sm">{crust.crust_name}</span>
                          </div>
                          {crustPrice && (
                            <span className="text-sm font-bold">{formatPrice(crustPrice.dish_price)}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Topping thêm */}
              {toppings.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 border-b border-white/20 pb-1">{"Extra Toppings:"}</h3>
                  <div className="space-y-2">
                    {toppings.map(topping => {
                      const isSelected = selectedToppings.some(t => t.topping_id === topping.topping_id);
                      return (
                        <label
                          key={topping.topping_id}
                          className="flex items-center justify-between cursor-pointer group"
                          onClick={() => handleToppingToggle(topping)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-white/50 group-hover:border-white/80'
                              }`}>
                              {isSelected && <Check size={10} className="text-[#9f280a]" />}
                            </div>
                            <span className="text-sm">
                              {topping.topping_name}
                            </span>
                          </div>
                          <span className="text-sm font-bold">{formatPrice(topping.price_topping)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ghi chú */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b border-white/20 pb-1">{"Note:"}</h3>
                <input
                  type="text"
                  placeholder={"Leave a note about your order here..."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white text-black text-sm outline-none"
                />
              </div>
              </div>
            </div>

            {/* Nút thao tác */}
            <div className="p-4 md:p-6 pt-4 border-t border-white/20 flex flex-col items-center gap-4 bg-[#9f280a] shrink-0">
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
                <span>{"Add to Cart"} : {formatPrice(totalPrice)}</span>
              </button>
            </div>

          </div>
        </div>
      </div>,
      document.body
    );
  }
