'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { X, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';

interface ComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  comboId: number;
  comboName: string;
  comboPrice: number;
  comboDescription: string;
  imageUrl: string;
}

export default function ComboModal({ isOpen, onClose, comboId, comboName, comboPrice, comboDescription, imageUrl }: ComboModalProps) {
  const { addToCart } = useCartStore();
  const { toggleCart, isCartOpen, t } = useUI();

  const [comboDetail, setComboDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({}); // group_id -> selected combo_item_ids
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchComboDetail();
      setQuantity(1);
      setSelections({});
      setNote('');
    }
  }, [isOpen]);

  const fetchComboDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/menu/combos/${comboId}`);
      const json = await res.json();
      if (json.success) {
        setComboDetail(json.data);
        // Initialize selections: pre-select first item in each group
        const initialSelections: Record<string, string[]> = {};
        json.data.groups?.forEach((group: any) => {
          if (group.combo_items?.length > 0) {
            initialSelections[group.group_id] = [String(group.combo_items[0].combo_item_id)];
          }
        });
        setSelections(initialSelections);
      }
    } catch (error) {
      console.error('Failed to fetch combo detail', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleItemToggle = (groupId: string, comboItemId: string, maxSelect: number) => {
    setSelections(prev => {
      const current = prev[groupId] || [];
      if (current.includes(comboItemId)) {
        // Deselect (but keep at least minSelect)
        return { ...prev, [groupId]: current.filter(id => id !== comboItemId) };
      } else {
        if (maxSelect === 1) {
          // Radio behavior
          return { ...prev, [groupId]: [comboItemId] };
        } else {
          // Checkbox behavior with max limit
          if (current.length < maxSelect) {
            return { ...prev, [groupId]: [...current, comboItemId] };
          }
          return prev;
        }
      }
    });
  };

  // Calculate extra price from selected items
  const extraPrice = comboDetail?.groups?.reduce((total: number, group: any) => {
    const selectedItems = selections[group.group_id] || [];
    return total + group.combo_items
      .filter((item: any) => selectedItems.includes(String(item.combo_item_id)))
      .reduce((sum: number, item: any) => sum + (item.price_extra || 0), 0);
  }, 0) || 0;

  const totalPrice = (comboPrice + extraPrice) * quantity;

  const handleAddToCart = () => {
    // Build selected items summary
    const selectedItemNames: string[] = [];
    comboDetail?.groups?.forEach((group: any) => {
      const selectedIds = selections[group.group_id] || [];
      group.combo_items
        .filter((item: any) => selectedIds.includes(String(item.combo_item_id)))
        .forEach((item: any) => {
          const dishName = item.dish_price?.dish?.dish_name || 'Unknown';
          const sizeName = item.dish_price?.size?.size_name;
          const crustName = item.dish_price?.crust?.crust_name;
          let label = dishName;
          if (sizeName) label += ` (${sizeName})`;
          if (crustName) label += ` - ${crustName}`;
          if (item.price_extra > 0) label += ` +${formatPrice(item.price_extra)}`;
          selectedItemNames.push(label);
        });
    });

    addToCart({
      dish_id: comboId,
      dish_price_id: `combo_${comboId}`,
      name: comboName,
      price: comboPrice + extraPrice,
      quantity,
      imageUrl,
      options: {
        toppings: selectedItemNames.join(', '),
        notes: note,
        extraPrice: extraPrice,
      }
    });

    if (!isCartOpen) toggleCart();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="bg-[#294c29] text-white w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative max-h-[none] md:max-h-[90vh]">
        
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 md:top-4 md:right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Left Side: Image */}
          <div className="w-full md:w-1/2 relative h-[30vh] min-h-[200px] md:h-auto md:min-h-full shrink-0">
            <Image 
              src={imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop'}
              alt={comboName}
              fill
              className="object-cover"
            />
            {/* Combo badge */}
            <div className="absolute bottom-4 left-4 bg-[#ee2828] text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
              COMBO
            </div>
          </div>

          {/* Right Side: Details & Options */}
          <div className="w-full md:w-1/2 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col bg-[#294c29] min-h-0">
            <h2 className="text-3xl font-serif font-bold mb-1">{comboName}</h2>
            {comboDescription && (
              <p className="text-sm text-white/80 mb-2">{comboDescription}</p>
            )}
            <div className="text-lg font-bold text-[#f0c14b] mb-4">{formatPrice(comboPrice)}</div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 flex-1">
                {comboDetail?.groups?.map((group: any) => (
                  <div key={group.group_id}>
                    <h3 className="font-bold text-lg mb-1 border-b border-white/20 pb-1">
                      {group.group_name}
                    </h3>
                    <p className="text-xs text-white/60 mb-3">
                      {group.min_select === group.max_select 
                        ? `Chọn ${group.min_select} món`
                        : `Chọn từ ${group.min_select} đến ${group.max_select} món`
                      }
                    </p>
                    <div className="space-y-2">
                      {group.combo_items?.map((item: any) => {
                        const isSelected = (selections[group.group_id] || []).includes(String(item.combo_item_id));
                        const dishName = item.dish_price?.dish?.dish_name || 'Món';
                        const sizeName = item.dish_price?.size?.size_name;
                        const crustName = item.dish_price?.crust?.crust_name;

                        return (
                          <label 
                            key={item.combo_item_id} 
                            className={`flex items-center justify-between cursor-pointer group px-3 py-2 rounded-lg transition-colors ${
                              isSelected ? 'bg-white/15' : 'hover:bg-white/5'
                            }`}
                            onClick={() => handleItemToggle(group.group_id, String(item.combo_item_id), group.max_select || 1)}
                          >
                            <div className="flex items-center gap-3">
                              {group.max_select === 1 ? (
                                // Radio style
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-white' : 'border-white/50 group-hover:border-white/80'
                                }`}>
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                              ) : (
                                // Checkbox style
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'border-white bg-white' : 'border-white/50 group-hover:border-white/80'
                                }`}>
                                  {isSelected && <Check size={10} className="text-[#294c29]" />}
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-medium">{dishName}</span>
                                {(sizeName || crustName) && (
                                  <span className="text-xs text-white/60 ml-2">
                                    {[sizeName, crustName].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.price_extra > 0 && (
                              <span className="text-sm font-bold text-[#f0c14b]">+{formatPrice(item.price_extra)}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Notes */}
                <div>
                  <h3 className="font-bold text-lg mb-3 border-b border-white/20 pb-1">{t('modal.notes')}</h3>
                  <input 
                    type="text"
                    placeholder={t('modal.notesPlaceholder')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white text-black text-sm outline-none"
                  />
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-8 pt-4 border-t border-white/20 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center bg-white text-black rounded-xl overflow-hidden font-bold h-10 shadow-md">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 h-full hover:bg-gray-200 transition-colors flex items-center justify-center text-xl"
                >
                  -
                </button>
                <span className="w-10 text-center text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-4 h-full hover:bg-gray-200 transition-colors flex items-center justify-center text-xl"
                >
                  +
                </button>
              </div>

              <button 
                onClick={handleAddToCart}
                className="w-full sm:w-[90%] bg-[#f0c14b] hover:bg-[#e2b036] text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg text-center text-base"
              >
                {t('modal.addToCart')} : {formatPrice(totalPrice)}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
