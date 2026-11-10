'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '@/lib/utils';
import { X, ShoppingCart, Check, ChevronDown, Minus, Plus } from 'lucide-react';
import { useCartStore, CartItem } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';
import { API_BASE } from '@/lib/config';

const CustomSelect = ({
  value,
  options,
  onChange,
  isLight,
}: {
  value: any;
  options: { value: any; label: string }[];
  onChange: (val: any) => void;
  isLight?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <div
        className={`w-full border rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
          isLight
            ? 'bg-white border-[#dfd3bf] text-[#1c1208] hover:border-[#cd3645]'
            : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium truncate">
          {selectedOption ? selectedOption.label : 'Chọn...'}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            className={`absolute z-20 top-full left-0 right-0 mt-2 border rounded-lg max-h-56 overflow-y-auto custom-scrollbar ${
              isLight
                ? 'bg-white border-[#dfd3bf] text-[#1c1208] shadow-xl'
                : 'bg-[#8b2006] border-white/20 text-white shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  value === option.value
                    ? isLight
                      ? 'bg-[#ee2828]/10 text-[#ee2828] font-bold'
                      : 'bg-white/20 font-bold'
                    : isLight
                      ? 'hover:bg-stone-100'
                      : 'hover:bg-white/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setIsOpen(false);
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

interface ComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  comboId: number;
  comboName: string;
  comboPrice: number;
  comboDescription: string;
  imageUrl: string;
  editCartItem?: CartItem | null;
}

export default function ComboModal({
  isOpen,
  onClose,
  comboId,
  comboName,
  comboPrice,
  comboDescription,
  imageUrl,
  editCartItem,
}: ComboModalProps) {
  const { addToCart, removeFromCart } = useCartStore();
  const { theme, lang, td, tc } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const [comboDetail, setComboDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [pizzaDishSelections, setPizzaDishSelections] = useState<Record<string, number>>({});
  const [pizzaDish2Selections, setPizzaDish2Selections] = useState<Record<string, number>>({});
  const [pizzaHalfSelections, setPizzaHalfSelections] = useState<Record<string, boolean>>({});
  const [pizzaSizeSelections, setPizzaSizeSelections] = useState<Record<string, number>>({});
  const [pizzaCrustSelections, setPizzaCrustSelections] = useState<Record<string, number>>({});
  const [pastaCategorySelections, setPastaCategorySelections] = useState<Record<string, string>>({});

  const [pizzaToppingsList, setPizzaToppingsList] = useState<any[]>([]);
  const [spaghettiToppingsList, setSpaghettiToppingsList] = useState<any[]>([]);
  const [crustsList, setCrustsList] = useState<any[]>([]);
  const [halfHalfPrices, setHalfHalfPrices] = useState<any[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<Record<string, any[]>>({});

  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchComboDetail();
      fetchToppings();
      if (editCartItem) {
        setQuantity(editCartItem.quantity);
        setNote(editCartItem.options?.notes || '');
      } else {
        setQuantity(1);
        setNote('');
        setSelectedToppings({});
      }
      setSelections({});
      setPizzaDishSelections({});
      setPizzaDish2Selections({});
      setPizzaHalfSelections({});
      setPizzaSizeSelections({});
      setPizzaCrustSelections({});
      setPastaCategorySelections({});
    }
  }, [isOpen]);

  const fetchToppings = async () => {
    try {
      const [pizzaRes, spaRes, crustsRes, hhRes] = await Promise.all([
        fetch(`${API_BASE}/menu/toppings?type=pizza`),
        fetch(`${API_BASE}/menu/toppings?type=spaghetti`),
        fetch(`${API_BASE}/menu/crusts`),
        fetch(`${API_BASE}/menu/dishes/65/prices`),
      ]);
      const pizzaData = await pizzaRes.json();
      const spaData = await spaRes.json();
      const crustsData = await crustsRes.json();
      const hhData = await hhRes.json();

      let pToppings: any[] = [];
      let sToppings: any[] = [];

      if (pizzaData.success) {
        pToppings = pizzaData.data;
        setPizzaToppingsList(pizzaData.data);
      }
      if (spaData.success) {
        sToppings = spaData.data;
        setSpaghettiToppingsList(spaData.data);
      }
      if (crustsData.success) setCrustsList(crustsData.data);
      if (hhData.success) setHalfHalfPrices(hhData.data || []);

      if (editCartItem && editCartItem.combo_selections) {
        const resolvedToppings: Record<string, any[]> = {};
        editCartItem.combo_selections.forEach((sel: any) => {
          if (sel.toppings && sel.toppings.length > 0) {
            resolvedToppings[sel.group_id] = sel.toppings.map((st: any) => {
              const found =
                pToppings.find((t: any) => t.topping_id === st.topping_id) ||
                sToppings.find((t: any) => t.topping_id === st.topping_id);
              return (
                found || {
                  topping_id: st.topping_id,
                  topping_name: st.name || '',
                  price_topping: st.price || 0,
                }
              );
            });
          }
        });
        setSelectedToppings((prev) => ({ ...prev, ...resolvedToppings }));
      }
    } catch (e) {}
  };

  const getPastaCatMap = (items: any[]) => {
    const map: Record<string, any[]> = {
      Risotto: [],
      Grantin: [],
      Spaghetti: [],
      Other: [],
    };
    items.forEach((item) => {
      const name = item.dish_price?.dish?.dish_name?.toLowerCase() || '';
      if (name.includes('risotto')) map['Risotto'].push(item);
      else if (name.includes('grantin') || name.includes('gratin')) map['Grantin'].push(item);
      else if (name.includes('spaghetti')) map['Spaghetti'].push(item);
      else map['Other'].push(item);
    });
    return map;
  };

  const fetchComboDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/menu/combos/${comboId}`);
      const json = await res.json();
      if (json.success) {
        setComboDetail(json.data);

        const initialSelections: Record<string, string[]> = {};
        const initialPizzaDishes: Record<string, number> = {};
        const initialPizzaDishes2: Record<string, number> = {};
        const initialPizzaHalf: Record<string, boolean> = {};
        const initialPizzaCrusts: Record<string, number> = {};
        const initialPastaCats: Record<string, string> = {};

        if (editCartItem && editCartItem.combo_selections) {
          editCartItem.combo_selections.forEach((sel: any) => {
            const group = json.data.groups?.find((g: any) => g.group_id === sel.group_id);
            if (!group) return;

            const groupNameLower = group.group_name.toLowerCase();
            const isPizzaGroup = groupNameLower.includes('pizza');
            const isPastaGroup =
              groupNameLower.includes('spaghetti') ||
              groupNameLower.includes('grantin') ||
              groupNameLower.includes('risotto') ||
              groupNameLower.includes('gratin');

            let matchItem = group.combo_items?.find(
              (item: any) => item.dish_price_id === sel.dish_price_id
            );
            if (!matchItem && sel.is_half_half && sel.halves && sel.halves.length > 0) {
              matchItem = group.combo_items?.find(
                (item: any) => item.dish_price?.dish?.category_id
              );
            }

            if (matchItem) {
              initialSelections[sel.group_id] = [String(matchItem.combo_item_id)];
            }

            if (isPizzaGroup) {
              if (sel.is_half_half && sel.halves && sel.halves.length >= 2) {
                initialPizzaHalf[sel.group_id] = true;
                initialPizzaDishes[sel.group_id] = sel.halves[0].dish_id;
                initialPizzaDishes2[sel.group_id] = sel.halves[1].dish_id;
              } else {
                initialPizzaHalf[sel.group_id] = false;
                if (matchItem?.dish_price?.dish_id) {
                  initialPizzaDishes[sel.group_id] = matchItem.dish_price.dish_id;
                }
              }

              if (matchItem?.dish_price) {
                setPizzaSizeSelections((prev) => ({
                  ...prev,
                  [sel.group_id]: matchItem.dish_price.size_id || 0,
                }));
                initialPizzaCrusts[sel.group_id] = matchItem.dish_price.crust_id || 0;
              }
            } else if (isPastaGroup && matchItem) {
              const catMap = getPastaCatMap(group.combo_items);
              const cat =
                ['Risotto', 'Grantin', 'Spaghetti'].find((c) =>
                  catMap[c]?.some((i: any) => i.combo_item_id === matchItem.combo_item_id)
                ) || 'Other';
              initialPastaCats[sel.group_id] = cat;
            }
          });

          json.data.groups?.forEach((group: any) => {
            if (!initialSelections[group.group_id] && group.combo_items?.length > 0) {
              initialSelections[group.group_id] = [String(group.combo_items[0].combo_item_id)];
            }
          });
        } else {
          json.data.groups?.forEach((group: any) => {
            if (group.combo_items?.length > 0) {
              const groupNameLower = group.group_name.toLowerCase();
              const isPizzaGroup = groupNameLower.includes('pizza');
              const isPastaGroup =
                groupNameLower.includes('spaghetti') ||
                groupNameLower.includes('grantin') ||
                groupNameLower.includes('risotto') ||
                groupNameLower.includes('gratin');
              const isFixed =
                group.combo_items.length === 1 && group.min_select === group.max_select;

              if (isFixed) {
                initialSelections[group.group_id] = [String(group.combo_items[0].combo_item_id)];
              } else if (isPizzaGroup) {
                const nonHalfItems = group.combo_items.filter(
                  (i: any) => !i.dish_price?.dish?.dish_name?.toLowerCase().includes('half')
                );
                const firstItem = nonHalfItems[0] || group.combo_items[0];
                initialPizzaDishes[group.group_id] = firstItem.dish_price.dish_id;

                const secondItem =
                  nonHalfItems.find(
                    (i: any) => i.dish_price.dish_id !== firstItem.dish_price.dish_id
                  ) || firstItem;
                initialPizzaDishes2[group.group_id] = secondItem.dish_price.dish_id;
                initialPizzaHalf[group.group_id] = false;

                setPizzaSizeSelections((prev) => ({
                  ...prev,
                  [group.group_id]: firstItem.dish_price.size_id || 0,
                }));
                initialPizzaCrusts[group.group_id] = firstItem.dish_price.crust_id || 0;
                initialSelections[group.group_id] = [String(firstItem.combo_item_id)];
              } else if (isPastaGroup) {
                const catMap = getPastaCatMap(group.combo_items);
                const firstCat =
                  ['Risotto', 'Grantin', 'Spaghetti'].find(
                    (c) => catMap[c] && catMap[c].length > 0
                  ) || 'Other';
                initialPastaCats[group.group_id] = firstCat;
                const firstItemInCat = catMap[firstCat]?.[0] || group.combo_items[0];
                initialSelections[group.group_id] = [String(firstItemInCat.combo_item_id)];
              } else {
                initialSelections[group.group_id] = [String(group.combo_items[0].combo_item_id)];
              }
            }
          });
        }

        setSelections(initialSelections);
        setPizzaDishSelections(initialPizzaDishes);
        setPizzaDish2Selections(initialPizzaDishes2);
        setPizzaHalfSelections(initialPizzaHalf);
        setPizzaCrustSelections(initialPizzaCrusts);
        setPastaCategorySelections(initialPastaCats);
      }
    } catch (error) {
      console.error('Error fetching combo details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSelection = (groupId: string, comboItemId: string) => {
    setSelections((prev) => ({ ...prev, [groupId]: [comboItemId] }));
  };

  const handleToppingToggle = (groupId: string, topping: any) => {
    setSelectedToppings((prev) => {
      const current = prev[groupId] || [];
      if (current.find((t) => t.topping_id === topping.topping_id)) {
        return {
          ...prev,
          [groupId]: current.filter((t) => t.topping_id !== topping.topping_id),
        };
      } else {
        return { ...prev, [groupId]: [...current, topping] };
      }
    });
  };

  let extraItemsPrice = 0;
  comboDetail?.groups?.forEach((group: any) => {
    const selectedItemIds = selections[group.group_id] || [];
    const isHalf = pizzaHalfSelections[group.group_id];
    const dish2Id = pizzaDish2Selections[group.group_id];

    group.combo_items.forEach((item: any) => {
      if (selectedItemIds.includes(String(item.combo_item_id))) {
        const itemExtra = item.price_extra || 0;

        if (isHalf && dish2Id) {
          const dish2Item = group.combo_items.find(
            (i: any) =>
              i.dish_price?.dish_id === dish2Id &&
              i.dish_price?.size_id === item.dish_price?.size_id &&
              i.dish_price?.crust_id === item.dish_price?.crust_id
          );
          const item2Extra = dish2Item?.price_extra || 0;
          extraItemsPrice += Math.max(itemExtra, item2Extra);
        } else {
          extraItemsPrice += itemExtra;
        }
      }
    });
  });

  let extraToppingsPrice = 0;
  Object.values(selectedToppings).forEach((toppingsArray) => {
    toppingsArray.forEach((t) => {
      extraToppingsPrice += t.price_topping || 0;
    });
  });

  const totalPrice =
    ((comboDetail?.combo_price ?? comboPrice) + extraItemsPrice + extraToppingsPrice) *
    quantity;

  const sortedGroups = [...(comboDetail?.groups || [])].sort((a: any, b: any) => {
    const desc = (comboDetail?.description || '').toLowerCase();
    if (!desc) return 0;
    const getPos = (groupName: string) => {
      const parts = groupName.toLowerCase().split(/\s+/);
      for (const part of parts) {
        if (part.length > 2) {
          const idx = desc.indexOf(part);
          if (idx >= 0) return idx;
        }
      }
      return 9999;
    };
    return getPos(a.group_name) - getPos(b.group_name);
  });

  const handleAddToCart = async () => {
    const selectedItemNames: string[] = [];
    const structuredItems: any[] = [];
    const comboSelectionsForDB: any[] = [];

    sortedGroups.forEach((group: any) => {
      const selectedItemIds = selections[group.group_id] || [];
      group.combo_items.forEach((item: any) => {
        if (selectedItemIds.includes(String(item.combo_item_id))) {
          const dishName = item.dish_price?.dish?.dish_name || '';
          const selectedCrustId =
            pizzaCrustSelections[group.group_id] || item.dish_price?.crust_id;
          const crustObj = crustsList.find((c) => c.crust_id === selectedCrustId);
          const crustName = crustObj
            ? crustObj.crust_name
            : item.dish_price?.crust?.crust_name;
          const sizeName = item.dish_price?.size?.size_name;

          let label = '';
          const isHalf = pizzaHalfSelections[group.group_id];
          const dish2Id = pizzaDish2Selections[group.group_id];
          let finalDishName = dishName;

          if (isHalf && dish2Id) {
            const dish2Name =
              group.combo_items.find((i: any) => i.dish_price?.dish_id === dish2Id)
                ?.dish_price?.dish?.dish_name || '';
            finalDishName = `[Half-Half] ${dishName} / ${dish2Name}`;
            label = finalDishName;
          } else {
            label = dishName;
          }

          if (crustName && crustName !== 'None') label += ` (${crustName})`;
          if (sizeName && sizeName !== 'Standard') label += ` - ${sizeName}`;

          const groupToppings = selectedToppings[group.group_id] || [];
          if (groupToppings.length > 0) {
            label += ` + [${groupToppings.map((t) => t.topping_name).join(', ')}]`;
          }

          let qtyPrefix = '';
          if (group.max_select > 1 && group.combo_items.length === 1) {
            qtyPrefix = `${group.max_select} x `;
            label = `${qtyPrefix}${label}`;
          } else if (
            comboName.toLowerCase().includes('happy family') &&
            dishName.toLowerCase() === 'pepsi'
          ) {
            qtyPrefix = '4 x ';
            label = `${qtyPrefix}${label}`;
          }

          selectedItemNames.push(label);

          structuredItems.push({
            name: qtyPrefix + finalDishName,
            size: sizeName && sizeName !== 'Standard' ? sizeName : undefined,
            crust: crustName && crustName !== 'None' ? crustName : undefined,
            toppings: groupToppings.map((t) => ({
              topping_id: t.topping_id,
              name: t.topping_name,
              price: t.price_topping || 0,
            })),
          });

          let finalDishPriceId = item.dish_price_id || '';
          if (isHalf && dish2Id) {
            const sizeId = item.dish_price?.size_id;
            const crustId = selectedCrustId || item.dish_price?.crust_id;
            const hhMatch = halfHalfPrices.find(
              (hh: any) => hh.size_id === sizeId && hh.crust_id === crustId
            );
            if (hhMatch) finalDishPriceId = hhMatch.dish_price_id;
          }

          const comboSelection: any = {
            group_id: group.group_id,
            dish_price_id: finalDishPriceId,
            is_half_half: !!(isHalf && dish2Id),
            toppings: groupToppings.map((t) => ({
              topping_id: t.topping_id,
              quantity: 1,
            })),
          };

          if (isHalf && dish2Id) {
            comboSelection.halves = [
              { dish_id: item.dish_price?.dish_id || 0, name: dishName },
              {
                dish_id: dish2Id,
                name:
                  group.combo_items.find((i: any) => i.dish_price?.dish_id === dish2Id)
                    ?.dish_price?.dish?.dish_name || '',
              },
            ];
          }

          comboSelectionsForDB.push(comboSelection);
        }
      });
    });

    if (editCartItem) {
      await removeFromCart(editCartItem.id);
    }

    addToCart({
      type: 'combo',
      combo_id: comboId,
      dish_id: comboId,
      name: comboName,
      price: (comboDetail?.combo_price ?? comboPrice) + extraItemsPrice + extraToppingsPrice,
      quantity,
      imageUrl,
      combo_selections: comboSelectionsForDB,
      options: {
        comboItems: structuredItems,
        notes: note,
      },
    });

    onClose();
  };

  const fixedGroups: any[] = [];
  const choiceGroups: any[] = [];

  sortedGroups.forEach((group: any) => {
    const activeItems = group.combo_items || [];
    if (!activeItems || activeItems.length === 0) return;

    const activeGroup = { ...group, combo_items: activeItems };
    const isFixed =
      activeItems.length === 1 && activeGroup.min_select === activeGroup.max_select;

    if (isFixed) fixedGroups.push(activeGroup);
    else choiceGroups.push(activeGroup);
  });

  const sectionBorderClass = isLight ? 'border-[#e6dccb]' : 'border-white/20';

  return createPortal(
    <div
      data-modal-portal="true"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors ${
          isLight
            ? 'bg-[#fbf8f2] text-[#1c1208] border border-[#dfd3bf]'
            : 'bg-[#9f280a] text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 md:p-6 relative shrink-0 ${
            isLight ? 'bg-[#f4efe4]' : 'bg-black/15'
          }`}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              isLight
                ? 'bg-black/[0.06] hover:bg-black/[0.12] text-[#1c1208]'
                : 'bg-black/40 hover:bg-black/60 text-white'
            }`}
            aria-label={isEn ? 'Close' : 'Đóng'}
          >
            <X size={18} />
          </button>
          <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide pr-8 mb-1.5">
            {comboName?.normalize('NFC')}
          </h2>
          <div className="text-[15px] mb-2 flex items-baseline gap-2">
            <span className={isLight ? 'text-[#6e6254] font-medium' : 'text-white/90'}>
              {isEn ? 'Price:' : 'Giá:'}
            </span>
            <span
              className={`text-xl font-black tracking-wide ${
                isLight ? 'text-[#cd3645]' : 'text-[#f0c14b]'
              }`}
            >
              {formatPrice(comboPrice)}
            </span>
          </div>
          {comboDescription && (
            <p className={`text-sm ${isLight ? 'text-[#5c4d3c]' : 'text-white/80'}`}>
              {tc(comboDescription?.normalize('NFC'))}
            </p>
          )}
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar border-t ${sectionBorderClass}`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className={`w-8 h-8 border-2 rounded-full animate-spin ${
                  isLight
                    ? 'border-stone-300 border-t-[#cd3645]'
                    : 'border-white/30 border-t-white'
                }`}
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              {choiceGroups.map((group) => {
                const groupNameLower = group.group_name.toLowerCase();
                const isPizzaGroup = groupNameLower.includes('pizza');
                const isPastaGroup =
                  groupNameLower.includes('spaghetti') ||
                  groupNameLower.includes('grantin') ||
                  groupNameLower.includes('risotto') ||
                  groupNameLower.includes('gratin');

                const isDrink =
                  groupNameLower.includes('pepsi') ||
                  groupNameLower.includes('coca') ||
                  groupNameLower.includes('nước') ||
                  groupNameLower.includes('drink');

                return (
                  <div key={group.group_id} className={isDrink ? 'order-3' : 'order-1'}>
                    <h3 className={`font-bold text-base mb-1 border-b pb-1.5 ${sectionBorderClass}`}>
                      {tc(group.group_name)}
                    </h3>
                    <p
                      className={`text-xs mb-4 ${
                        isLight ? 'text-[#8c7d6b]' : 'text-white/60'
                      }`}
                    >
                      {group.min_select === group.max_select
                        ? isEn ? `Select ${group.min_select}` : `Chọn ${group.min_select}`
                        : isEn ? `Select ${group.min_select} - ${group.max_select}` : `Chọn ${group.min_select} - ${group.max_select}`}
                    </p>

                    {isPizzaGroup ? (
                      (() => {
                        const dishMap = new Map();
                        group.combo_items.forEach((item: any) => {
                          const dishId = item.dish_price.dish_id;
                          if (!dishMap.has(dishId)) {
                            dishMap.set(dishId, {
                              dish: item.dish_price.dish,
                              items: [],
                            });
                          }
                          dishMap.get(dishId).items.push(item);
                        });
                        const uniqueDishes = Array.from(dishMap.values());
                        const selectedDishId = pizzaDishSelections[group.group_id];
                        const currentDishData = dishMap.get(selectedDishId);
                        const selectedComboItemId = selections[group.group_id]?.[0];

                        const dishOptions = uniqueDishes
                          .filter(
                            (ud: any) =>
                              !ud.dish.dish_name.toLowerCase().includes('half-half') &&
                              !ud.dish.dish_name.toLowerCase().includes('half half')
                          )
                          .map((ud: any) => ({
                            value: ud.dish.dish_id,
                            label: ud.dish.dish_name,
                          }));

                        const sizeMap = new Map();
                        const isHalf = pizzaHalfSelections[group.group_id] || false;
                        const dish2Id = pizzaDish2Selections[group.group_id];
                        const currentDishData2 =
                          isHalf && dish2Id ? dishMap.get(dish2Id) : null;

                        currentDishData?.items.forEach((item1: any) => {
                          const sizeId = item1.dish_price.size_id || 0;

                          if (isHalf && currentDishData2) {
                            const hasMatch = currentDishData2.items.some(
                              (item2: any) => (item2.dish_price.size_id || 0) === sizeId
                            );
                            if (!hasMatch) return;
                          }

                          if (!sizeMap.has(sizeId)) {
                            sizeMap.set(sizeId, {
                              size: item1.dish_price.size,
                              items: [],
                            });
                          }
                          sizeMap.get(sizeId).items.push(item1);
                        });
                        const uniqueSizes = Array.from(sizeMap.values());

                        const rawSelectedSizeId = pizzaSizeSelections[group.group_id];
                        let activeSizeData = sizeMap.get(rawSelectedSizeId);
                        if (!activeSizeData && uniqueSizes.length > 0) {
                          activeSizeData = uniqueSizes[0];
                        }
                        const activeSizeId = activeSizeData?.size?.size_id || 0;

                        return (
                          <div>
                            {crustsList.length > 0 && (
                              <div className={`mb-5 pb-5 border-b ${sectionBorderClass}`}>
                                <label className="block text-sm font-bold mb-3">
                                  {isEn ? 'Crust (*)' : 'Đế bánh (*)'}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                                  {crustsList
                                    .filter(
                                      (c) => c.is_visible !== false && c.crust_name !== 'None'
                                    )
                                    .map((crust) => {
                                      const selectedCrustId =
                                        pizzaCrustSelections[group.group_id] || 0;
                                      const isSelected = selectedCrustId === crust.crust_id;
                                      return (
                                        <label
                                          key={crust.crust_id}
                                          className="flex items-center gap-2.5 cursor-pointer group select-none"
                                          onClick={() => {
                                            setPizzaCrustSelections((prev) => ({
                                              ...prev,
                                              [group.group_id]: crust.crust_id,
                                            }));
                                            const match = group.combo_items.find(
                                              (i: any) =>
                                                i.dish_price?.dish_id === selectedDishId &&
                                                (i.dish_price?.size_id || 0) === activeSizeId &&
                                                (i.dish_price?.crust_id || 0) === crust.crust_id
                                            );
                                            if (match)
                                              handleSelection(
                                                group.group_id,
                                                String(match.combo_item_id)
                                              );
                                          }}
                                        >
                                          <div
                                            className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
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
                                            className={`text-sm ${
                                              isSelected ? 'font-bold' : 'font-medium'
                                            }`}
                                          >
                                            {td(crust.crust_name)}
                                          </span>
                                        </label>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="block text-sm font-bold">Pizza (*)</label>
                                  {dishOptions.length > 1 && (
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                      <div
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                          isHalf
                                            ? isLight
                                              ? 'bg-[#ee2828] border-[#ee2828] text-white'
                                              : 'bg-[#f0c14b] border-[#f0c14b] text-black'
                                            : isLight
                                              ? 'border-stone-400 group-hover:border-stone-600'
                                              : 'border-white/50 group-hover:border-white'
                                        }`}
                                      >
                                        {isHalf && <Check size={11} strokeWidth={3} />}
                                      </div>
                                      <span className="text-sm font-semibold">Half-Half</span>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={isHalf}
                                        onChange={() =>
                                          setPizzaHalfSelections((prev) => ({
                                            ...prev,
                                            [group.group_id]: !prev[group.group_id],
                                          }))
                                        }
                                      />
                                    </label>
                                  )}
                                </div>

                                {!isHalf ? (
                                  <CustomSelect
                                    isLight={isLight}
                                    value={selectedDishId}
                                    options={dishOptions}
                                    onChange={(newDishId) => {
                                      setPizzaDishSelections((prev) => ({
                                        ...prev,
                                        [group.group_id]: newDishId,
                                      }));
                                      const items = dishMap.get(newDishId).items;
                                      const firstSizeId = items[0].dish_price.size_id || 0;
                                      setPizzaSizeSelections((prev) => ({
                                        ...prev,
                                        [group.group_id]: firstSizeId,
                                      }));
                                      handleSelection(
                                        group.group_id,
                                        String(items[0].combo_item_id)
                                      );
                                    }}
                                  />
                                ) : (
                                  <div
                                    className={`space-y-3 p-3 rounded-lg border ${
                                      isLight
                                        ? 'bg-[#f4efe4] border-[#dfd3bf]'
                                        : 'bg-black/20 border-white/10'
                                    }`}
                                  >
                                    <div>
                                      <label
                                        className={`block text-xs mb-1 font-semibold ${
                                          isLight ? 'text-[#5c4d3c]' : 'text-white/80'
                                        }`}
                                      >
                                        {isEn ? 'Half 1:' : 'Nửa 1:'}
                                      </label>
                                      <CustomSelect
                                        isLight={isLight}
                                        value={selectedDishId}
                                        options={dishOptions}
                                        onChange={(newDishId) => {
                                          setPizzaDishSelections((prev) => ({
                                            ...prev,
                                            [group.group_id]: newDishId,
                                          }));
                                          const items = dishMap.get(newDishId).items;
                                          const firstSizeId = items[0].dish_price.size_id || 0;
                                          setPizzaSizeSelections((prev) => ({
                                            ...prev,
                                            [group.group_id]: firstSizeId,
                                          }));
                                          handleSelection(
                                            group.group_id,
                                            String(items[0].combo_item_id)
                                          );
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label
                                        className={`block text-xs mb-1 font-semibold ${
                                          isLight ? 'text-[#5c4d3c]' : 'text-white/80'
                                        }`}
                                      >
                                        {isEn ? 'Half 2:' : 'Nửa 2:'}
                                      </label>
                                      <CustomSelect
                                        isLight={isLight}
                                        value={
                                          pizzaDish2Selections[group.group_id] ||
                                          dishOptions[0]?.value
                                        }
                                        options={dishOptions}
                                        onChange={(newDishId) => {
                                          setPizzaDish2Selections((prev) => ({
                                            ...prev,
                                            [group.group_id]: newDishId,
                                          }));
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {uniqueSizes.length > 1 && (
                                <div>
                                  <label className="block text-sm font-bold mb-2">
                                    {isEn ? 'Size (*)' : 'Cỡ (*)'}
                                  </label>
                                  <div className="flex flex-wrap gap-2.5">
                                    {uniqueSizes.map((szData: any) => {
                                      const sId = szData.size?.size_id || 0;
                                      const isSelected = activeSizeId === sId;
                                      return (
                                        <button
                                          key={sId}
                                          type="button"
                                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                                            isSelected
                                              ? isLight
                                                ? 'bg-[#ee2828] text-white shadow-sm'
                                                : 'bg-white text-[#9f280a]'
                                              : isLight
                                                ? 'bg-black/[0.06] text-[#1c1208] hover:bg-black/[0.12]'
                                                : 'bg-black/20 text-white hover:bg-black/30'
                                          }`}
                                          onClick={() => {
                                            setPizzaSizeSelections((prev) => ({
                                              ...prev,
                                              [group.group_id]: sId,
                                            }));
                                            if (szData.items.length > 0) {
                                              handleSelection(
                                                group.group_id,
                                                String(szData.items[0].combo_item_id)
                                              );
                                            }
                                          }}
                                        >
                                          {szData.size ? td(szData.size.size_name) : isEn ? 'Standard' : 'Tiêu chuẩn'}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {(() => {
                              const selectedItemForSize = activeSizeData?.items.find(
                                (item: any) => String(item.combo_item_id) === selectedComboItemId
                              );
                              const selectedSizeIdTopping =
                                selectedItemForSize?.dish_price?.size_id;
                              const availableToppings = pizzaToppingsList.filter(
                                (t) => !t.size_id || t.size_id === selectedSizeIdTopping
                              );

                              if (availableToppings.length === 0) return null;
                              return (
                                <div className="mt-5">
                                  <label className="block text-sm font-bold mb-2.5">
                                    {isEn ? 'Extra Toppings' : 'Thêm Topping'}
                                  </label>
                                  <div className="space-y-2.5">
                                    {availableToppings.map((topping) => {
                                      const isSelected = (
                                        selectedToppings[group.group_id] || []
                                      ).some((t) => t.topping_id === topping.topping_id);
                                      return (
                                        <label
                                          key={topping.topping_id}
                                          className="flex items-center justify-between cursor-pointer group select-none"
                                          onClick={() =>
                                            handleToppingToggle(group.group_id, topping)
                                          }
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
                                                    : 'border-white/50 group-hover:border-white/80'
                                              }`}
                                            >
                                              {isSelected && <Check size={11} strokeWidth={3} />}
                                            </div>
                                            <span className="text-sm">
                                              {td(topping.topping_name)}
                                              {(() => {
                                                const matchingItem =
                                                  currentDishData?.items.find(
                                                    (item: any) =>
                                                      item.dish_price?.size_id ===
                                                      topping.size_id
                                                  );
                                                return matchingItem?.dish_price?.size
                                                  ? ` - ${isEn ? 'Size' : 'Cỡ'} ${td(matchingItem.dish_price.size.size_name)}`
                                                  : '';
                                              })()}
                                            </span>
                                          </div>
                                          <span
                                            className={`font-bold text-sm ${
                                              isLight ? 'text-[#cd3645]' : 'text-[#f0c14b]'
                                            }`}
                                          >
                                            +{formatPrice(topping.price_topping)}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()
                    ) : isPastaGroup ? (
                      (() => {
                        const catMap = getPastaCatMap(group.combo_items);
                        const selectedCat = pastaCategorySelections[group.group_id];
                        const itemsInCat = catMap[selectedCat] || [];
                        const selectedComboItemId = selections[group.group_id]?.[0];

                        return (
                          <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                              <div>
                                <label className="block text-sm font-bold mb-2">
                                  {isEn ? 'Category' : 'Thể loại'}
                                </label>
                                <div className="space-y-2.5">
                                  {['Risotto', 'Grantin', 'Spaghetti']
                                    .filter((c) => catMap[c] && catMap[c].length > 0)
                                    .map((cat) => {
                                      const isSelected = selectedCat === cat;
                                      return (
                                        <label
                                          key={cat}
                                          className="flex items-center gap-3 cursor-pointer group select-none"
                                          onClick={() => {
                                            setPastaCategorySelections((prev) => ({
                                              ...prev,
                                              [group.group_id]: cat,
                                            }));
                                            const newItems = catMap[cat];
                                            if (newItems.length > 0) {
                                              handleSelection(
                                                group.group_id,
                                                String(newItems[0].combo_item_id)
                                              );
                                            }
                                          }}
                                        >
                                          <div
                                            className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                              isSelected
                                                ? isLight
                                                  ? 'border-[#ee2828] bg-[#ee2828] text-white'
                                                  : 'border-white bg-white text-[#9f280a]'
                                                : isLight
                                                  ? 'border-stone-400 group-hover:border-stone-600'
                                                  : 'border-white/50 group-hover:border-white/80'
                                            }`}
                                          >
                                            {isSelected && <Check size={11} strokeWidth={3} />}
                                          </div>
                                          <span
                                            className={`text-sm ${
                                              isSelected ? 'font-bold' : 'font-medium'
                                            }`}
                                          >
                                            {td(cat === 'Grantin' ? 'Gratin' : cat)}
                                          </span>
                                        </label>
                                      );
                                    })}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-bold mb-2">
                                  {isEn ? 'Selection' : 'Lựa chọn'}
                                </label>
                                <CustomSelect
                                  isLight={isLight}
                                  value={selectedComboItemId}
                                  options={itemsInCat.map((item: any) => ({
                                    value: String(item.combo_item_id),
                                    label: td(item.dish_price.dish.dish_name),
                                  }))}
                                  onChange={(newComboItemId) =>
                                    handleSelection(group.group_id, String(newComboItemId))
                                  }
                                />
                              </div>
                            </div>

                            {(() => {
                              const availableToppings = spaghettiToppingsList;
                              if (availableToppings.length === 0) return null;
                              return (
                                <div className="mt-5">
                                  <label className="block text-sm font-bold mb-2.5">
                                    {isEn ? 'Extra Toppings' : 'Thêm Topping'}
                                  </label>
                                  <div className="space-y-2.5">
                                    {availableToppings.map((topping) => {
                                      const isSelected = (
                                        selectedToppings[group.group_id] || []
                                      ).some((t) => t.topping_id === topping.topping_id);
                                      return (
                                        <label
                                          key={topping.topping_id}
                                          className="flex items-center justify-between cursor-pointer group select-none"
                                          onClick={() =>
                                            handleToppingToggle(group.group_id, topping)
                                          }
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
                                                    : 'border-white/50 group-hover:border-white/80'
                                              }`}
                                            >
                                              {isSelected && <Check size={11} strokeWidth={3} />}
                                            </div>
                                            <span className="text-sm">{td(topping.topping_name)}</span>
                                          </div>
                                          <span
                                            className={`font-bold text-sm ${
                                              isLight ? 'text-[#cd3645]' : 'text-[#f0c14b]'
                                            }`}
                                          >
                                            +{formatPrice(topping.price_topping)}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const selectedComboItemId = selections[group.group_id]?.[0];
                        return (
                          <div className="space-y-2.5">
                            {group.combo_items.map((item: any) => {
                              let displayDishName = td(item.dish_price.dish.dish_name);
                              if (
                                comboName.toLowerCase().includes('happy family') &&
                                displayDishName.toLowerCase() === 'pepsi'
                              ) {
                                displayDishName = '4 x ' + displayDishName;
                              }
                              const isSelected =
                                selectedComboItemId === String(item.combo_item_id);
                              return (
                                <label
                                  key={item.combo_item_id}
                                  className="flex items-center justify-between cursor-pointer group select-none"
                                  onClick={() =>
                                    handleSelection(group.group_id, String(item.combo_item_id))
                                  }
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
                                            : 'border-white/50 group-hover:border-white/80'
                                      }`}
                                    >
                                      {isSelected && <Check size={11} strokeWidth={3} />}
                                    </div>
                                    <span
                                      className={`text-sm ${
                                        isSelected ? 'font-bold' : 'font-medium'
                                      }`}
                                    >
                                      {displayDishName}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                );
              })}

              {/* Fixed items */}
              <div className="order-2">
                {fixedGroups.length > 0 && (
                  <div>
                    <h3 className={`font-bold text-base mb-2 border-b pb-1.5 ${sectionBorderClass}`}>
                      {isEn ? 'Included in Combo' : 'Đã bao gồm trong Combo'}
                    </h3>
                    <ul className="list-disc pl-5 space-y-1.5 mt-3">
                      {fixedGroups.map((g) => {
                        const groupNameLower = g.group_name.toLowerCase();
                        const isPizza = groupNameLower.includes('pizza');
                        const isPasta =
                          groupNameLower.includes('spaghetti') ||
                          groupNameLower.includes('grantin') ||
                          groupNameLower.includes('risotto') ||
                          groupNameLower.includes('gratin');
                        const selectedSizeIdTopping =
                          g.combo_items[0]?.dish_price?.size_id;

                        let availableToppings: any[] = [];
                        if (isPizza) {
                          availableToppings = pizzaToppingsList.filter(
                            (t) => !t.size_id || t.size_id === selectedSizeIdTopping
                          );
                        } else if (isPasta) {
                          availableToppings = [...spaghettiToppingsList];
                        }

                        return (
                          <li key={g.group_id} className="text-sm mb-3">
                            <span className="font-semibold leading-relaxed">
                              {tc(g.group_name)}
                            </span>
                            {availableToppings.length > 0 && (
                              <div className="mt-2 ml-4">
                                <label
                                  className={`block text-xs font-bold mb-2 ${
                                    isLight ? 'text-[#5c4d3c]' : 'text-white/70'
                                  }`}
                                >
                                  {isEn ? 'Extra Toppings:' : 'Thêm Topping:'}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {availableToppings.map((topping) => {
                                    const isSelected = (
                                      selectedToppings[g.group_id] || []
                                    ).some((t) => t.topping_id === topping.topping_id);
                                    return (
                                      <label
                                        key={topping.topping_id}
                                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                                        onClick={() =>
                                          handleToppingToggle(g.group_id, topping)
                                        }
                                      >
                                        <div
                                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                            isSelected
                                              ? isLight
                                                ? 'border-[#ee2828] bg-[#ee2828] text-white'
                                                : 'border-white bg-white text-[#9f280a]'
                                              : isLight
                                                ? 'border-stone-400 group-hover:border-stone-600'
                                                : 'border-white/50 group-hover:border-white/80'
                                          }`}
                                        >
                                          {isSelected && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <span className="text-xs">
                                          {td(topping.topping_name)}{' '}
                                          <span
                                            className={`font-bold ml-1 ${
                                              isLight ? 'text-[#cd3645]' : 'text-[#f0c14b]'
                                            }`}
                                          >
                                            +{formatPrice(topping.price_topping)}
                                          </span>
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="order-4">
                <h3 className={`font-bold text-base mb-2.5 border-b pb-1.5 ${sectionBorderClass}`}>
                  {isEn ? 'Special Instructions' : 'Ghi chú'}
                </h3>
                <input
                  type="text"
                  placeholder={isEn ? 'Notes for your order...' : 'Ghi chú cho đơn hàng của bạn...'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={`w-full rounded-lg p-3 outline-none text-sm border transition-all ${
                    isLight
                      ? 'bg-white text-[#1c1208] placeholder:text-stone-400 border-[#dfd3bf] focus:border-[#ee2828]'
                      : 'bg-white text-black placeholder:text-gray-400 border-transparent focus:ring-2 focus:ring-yellow-400'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 sm:px-6 border-t flex items-center justify-between gap-3 shrink-0 ${
            isLight
              ? 'border-[#e6dccb] bg-[#f4efe4]/60'
              : 'border-white/20 bg-black/15'
          }`}
        >
          <div
            className={`flex items-center justify-between rounded-xl overflow-hidden font-bold h-12 w-28 shrink-0 shadow-sm border ${
              isLight
                ? 'bg-white text-[#1c1208] border-[#dfd3bf]'
                : 'bg-white text-black border-transparent'
            }`}
          >
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex-1 h-full hover:bg-stone-100 transition-colors flex items-center justify-center cursor-pointer"
              aria-label={isEn ? 'Decrease quantity' : 'Giảm số lượng'}
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="w-8 text-center text-base">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex-1 h-full hover:bg-stone-100 transition-colors flex items-center justify-center cursor-pointer"
              aria-label={isEn ? 'Increase quantity' : 'Tăng số lượng'}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-[#f0c14b] hover:bg-[#e2b036] text-black font-extrabold h-12 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer active:scale-[0.99]"
          >
            <ShoppingCart size={18} strokeWidth={2.4} />
            <span>
              {editCartItem
                ? isEn
                  ? 'Update Cart'
                  : 'Cập nhật giỏ'
                : isEn
                  ? 'Add to Cart'
                  : 'Thêm vào giỏ'}{' '}
              • {formatPrice(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
