'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '@/lib/utils';
import { X, Gift, ShoppingCart, Check, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';

const CustomSelect = ({ value, options, onChange }: { value: any, options: { value: any, label: string }[], onChange: (val: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative">
      <div
        className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/15 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm truncate">{selectedOption ? selectedOption.label : "Select..."}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-[#8b2006] border border-white/20 rounded-lg shadow-2xl max-h-56 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${value === option.value
                  ? 'bg-white/20 font-bold'
                  : 'hover:bg-white/10'
                  }`}
                onClick={() => {
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
}

export default function ComboModal({ isOpen, onClose, comboId, comboName, comboPrice, comboDescription, imageUrl }: ComboModalProps) {
  const { addToCart } = useCartStore();
  const { toggleCart, isCartOpen } = useUI();

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
    if (isOpen) {
      fetchComboDetail();
      fetchToppings();
      setQuantity(1);
      setSelections({});
      setPizzaDishSelections({});
      setPizzaDish2Selections({});
      setPizzaHalfSelections({});
      setPizzaSizeSelections({});
      setPizzaCrustSelections({});
      setPastaCategorySelections({});
      setSelectedToppings({});
      setNote('');
    }
  }, [isOpen]);

  const fetchToppings = async () => {
    try {
      const [pizzaRes, spaRes, crustsRes, hhRes] = await Promise.all([
        fetch('http://localhost:4000/api/menu/toppings?type=pizza'),
        fetch('http://localhost:4000/api/menu/toppings?type=spaghetti'),
        fetch('http://localhost:4000/api/menu/crusts'),
        fetch('http://localhost:4000/api/menu/dishes/65/prices')
      ]);
      const pizzaData = await pizzaRes.json();
      const spaData = await spaRes.json();
      const crustsData = await crustsRes.json();
      const hhData = await hhRes.json();
      if (pizzaData.success) setPizzaToppingsList(pizzaData.data);
      if (spaData.success) setSpaghettiToppingsList(spaData.data);
      if (crustsData.success) setCrustsList(crustsData.data);
      if (hhData.success) setHalfHalfPrices(hhData.data || []);
    } catch (e) { }
  };

  const getPastaCatMap = (items: any[]) => {
    const map: Record<string, any[]> = { 'Risotto': [], 'Grantin': [], 'Spaghetti': [], 'Other': [] };
    items.forEach(item => {
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
      const res = await fetch(`http://localhost:4000/api/menu/combos/${comboId}`);
      const json = await res.json();
      if (json.success) {
        setComboDetail(json.data);

        const initialSelections: Record<string, string[]> = {};
        const initialPizzaDishes: Record<string, number> = {};
        const initialPizzaDishes2: Record<string, number> = {};
        const initialPizzaHalf: Record<string, boolean> = {};
        const initialPizzaCrusts: Record<string, number> = {};
        const initialPastaCats: Record<string, string> = {};

        json.data.groups?.forEach((group: any) => {
          if (group.combo_items?.length > 0) {
            const groupNameLower = group.group_name.toLowerCase();
            const isPizzaGroup = groupNameLower.includes('pizza');
            const isPastaGroup = groupNameLower.includes('spaghetti') || groupNameLower.includes('grantin') || groupNameLower.includes('risotto') || groupNameLower.includes('gratin');
            const isFixed = group.combo_items.length === 1 && group.min_select === group.max_select;

            if (isFixed) {
              initialSelections[group.group_id] = [String(group.combo_items[0].combo_item_id)];
            } else if (isPizzaGroup) {
              const firstItem = group.combo_items[0];
              initialPizzaDishes[group.group_id] = firstItem.dish_price.dish_id;

              const secondItem = group.combo_items.find((i: any) => i.dish_price.dish_id !== firstItem.dish_price.dish_id) || firstItem;
              initialPizzaDishes2[group.group_id] = secondItem.dish_price.dish_id;
              initialPizzaHalf[group.group_id] = false;

              setPizzaSizeSelections(prev => ({ ...prev, [group.group_id]: firstItem.dish_price.size_id || 0 }));
              initialPizzaCrusts[group.group_id] = firstItem.dish_price.crust_id || 0;
              initialSelections[group.group_id] = [String(firstItem.combo_item_id)];
            } else if (isPastaGroup) {
              const catMap = getPastaCatMap(group.combo_items);
              const firstCat = ['Risotto', 'Grantin', 'Spaghetti'].find(c => catMap[c] && catMap[c].length > 0) || 'Other';
              initialPastaCats[group.group_id] = firstCat;
              const firstItemInCat = catMap[firstCat]?.[0] || group.combo_items[0];
              initialSelections[group.group_id] = [String(firstItemInCat.combo_item_id)];
            } else {
              initialSelections[group.group_id] = [String(group.combo_items[0].combo_item_id)];
            }
          }
        });

        setSelections(initialSelections);
        setPizzaDishSelections(initialPizzaDishes);
        setPizzaDish2Selections(initialPizzaDishes2);
        setPizzaHalfSelections(initialPizzaHalf);
        setPizzaCrustSelections(initialPizzaCrusts);
        setPastaCategorySelections(initialPastaCats);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết combo', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSelection = (groupId: string, comboItemId: string) => {
    setSelections(prev => ({ ...prev, [groupId]: [comboItemId] }));
  };

  const handleToppingToggle = (groupId: string, topping: any) => {
    setSelectedToppings(prev => {
      const current = prev[groupId] || [];
      if (current.find(t => t.topping_id === topping.topping_id)) {
        return { ...prev, [groupId]: current.filter(t => t.topping_id !== topping.topping_id) };
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
        let itemExtra = item.price_extra || 0;

        if (isHalf && dish2Id) {
          const dish2Item = group.combo_items.find((i: any) =>
            i.dish_price?.dish_id === dish2Id &&
            i.dish_price?.size_id === item.dish_price?.size_id &&
            i.dish_price?.crust_id === item.dish_price?.crust_id
          );
          const item2Extra = dish2Item?.price_extra || 0;
          // Theo mặc định, lấy mức phụ thu cao hơn giữa 2 nửa (có thể đổi sang trung bình cộng nếu cần)
          extraItemsPrice += Math.max(itemExtra, item2Extra);
        } else {
          extraItemsPrice += itemExtra;
        }
      }
    });
  });

  let extraToppingsPrice = 0;
  Object.values(selectedToppings).forEach(toppingsArray => {
    toppingsArray.forEach(t => {
      extraToppingsPrice += t.price_topping || 0;
    });
  });

  const totalPrice = (comboPrice + extraItemsPrice + extraToppingsPrice) * quantity;

  const sortedGroups = [...(comboDetail?.groups || [])].sort((a: any, b: any) => {
    const getScore = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('pizza')) return 1;
      if (lower.includes('salad')) return 2;
      if (lower.includes('gratin') || lower.includes('grantin') || lower.includes('risotto') || lower.includes('spaghetti')) return 3;
      return 4;
    };
    return getScore(a.group_name) - getScore(b.group_name);
  });

  const handleAddToCart = () => {
    const selectedItemNames: string[] = [];
    const structuredItems: any[] = [];
    // Dữ liệu lựa chọn combo để lưu vào bảng cart_item_combos
    const comboSelectionsForDB: any[] = [];

    sortedGroups.forEach((group: any) => {
      const selectedItemIds = selections[group.group_id] || [];
      group.combo_items.forEach((item: any) => {
        if (selectedItemIds.includes(String(item.combo_item_id))) {
          const dishName = item.dish_price?.dish?.dish_name || '';
          const selectedCrustId = pizzaCrustSelections[group.group_id] || item.dish_price?.crust_id;
          const crustObj = crustsList.find(c => c.crust_id === selectedCrustId);
          const crustName = crustObj ? crustObj.crust_name : item.dish_price?.crust?.crust_name;
          const sizeName = item.dish_price?.size?.size_name;

          let label = '';
          const isHalf = pizzaHalfSelections[group.group_id];
          const dish2Id = pizzaDish2Selections[group.group_id];
          let finalDishName = dishName;

          if (isHalf && dish2Id) {
            const dish2Name = group.combo_items.find((i: any) => i.dish_price?.dish_id === dish2Id)?.dish_price?.dish?.dish_name || '';
            finalDishName = `[Half-Half] ${dishName} / ${dish2Name}`;
            label = finalDishName;
          } else {
            label = dishName;
          }

          if (crustName && crustName !== 'None') label += ` (${crustName})`;
          if (sizeName && sizeName !== 'Standard') label += ` - ${sizeName}`;

          const groupToppings = selectedToppings[group.group_id] || [];
          if (groupToppings.length > 0) {
            label += ` + [${groupToppings.map(t => t.topping_name).join(', ')}]`;
          }

          let qtyPrefix = '';
          if (group.max_select > 1 && group.combo_items.length === 1) {
            qtyPrefix = `${group.max_select} x `;
            label = `${qtyPrefix}${label}`;
          } else if (comboName.toLowerCase().includes('happy family') && dishName.toLowerCase() === 'pepsi') {
            // Ngoại lệ cho Combo Happy Family: tự động hiển thị 4 x khi thêm vào giỏ hàng
            qtyPrefix = '4 x ';
            label = `${qtyPrefix}${label}`;
          }

          selectedItemNames.push(label);

          structuredItems.push({
            name: qtyPrefix + finalDishName,
            size: sizeName && sizeName !== 'Standard' ? sizeName : undefined,
            crust: crustName && crustName !== 'None' ? crustName : undefined,
            toppings: groupToppings.map(t => ({ topping_id: t.topping_id, name: t.topping_name, price: t.price_topping || 0 }))
          });

          // Xây dựng dữ liệu combo_selection cho DB
          // Nếu half-half: tìm dish_price_id của món Half-Half (dish_id=65) theo size_id + crust_id
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
            toppings: groupToppings.map(t => ({
              topping_id: t.topping_id,
              quantity: 1
            }))
          };

          // Nếu pizza half-half trong combo
          if (isHalf && dish2Id) {
            comboSelection.halves = [
              { dish_id: item.dish_price?.dish_id || 0, name: dishName },
              { dish_id: dish2Id, name: group.combo_items.find((i: any) => i.dish_price?.dish_id === dish2Id)?.dish_price?.dish?.dish_name || '' }
            ];
          }

          comboSelectionsForDB.push(comboSelection);
        }
      });
    });

    addToCart({
      type: 'combo',
      combo_id: comboId,
      dish_id: comboId,
      name: comboName,
      price: comboPrice + extraItemsPrice + extraToppingsPrice,
      quantity,
      imageUrl,
      // Dữ liệu lựa chọn combo để lưu vào DB (bảng cart_item_combos + cart_item_half + cart_item_topping)
      combo_selections: comboSelectionsForDB,
      options: {
        comboItems: structuredItems,
        notes: note,
      }
    });

    if (!isCartOpen) toggleCart();
    onClose();
  };

  const fixedGroups: any[] = [];
  const choiceGroups: any[] = [];


  sortedGroups.forEach((group: any) => {
    // Không lọc theo dish_status nữa để hiển thị cả những món ẩn/hết hàng nhưng thuộc combo
    const activeItems = group.combo_items || [];
    if (!activeItems || activeItems.length === 0) return; // Nếu nhóm không có món nào thì bỏ qua

    const activeGroup = { ...group, combo_items: activeItems };
    const isFixed = activeItems.length === 1 && activeGroup.min_select === activeGroup.max_select;

    if (isFixed) fixedGroups.push(activeGroup);
    else choiceGroups.push(activeGroup);
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#9f280a] text-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 md:p-6 relative shrink-0 bg-black/15">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
          >
            <X size={18} />
          </button>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide pr-8 mb-2">{comboName?.normalize('NFC')}</h2>
          <div className="text-white/90 text-[15px] mb-3 flex items-baseline gap-2">
            <span>Price:</span>
            <span className="text-2xl font-bold text-[#f0c14b] tracking-wide">
              {formatPrice(comboPrice)}
            </span>
          </div>
          {comboDescription && (
            <p className="text-white/80 text-sm">{comboDescription?.normalize('NFC')}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar border-t border-white/20">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              {choiceGroups.map((group, index) => {
                const groupNameLower = group.group_name.toLowerCase();
                const isPizzaGroup = groupNameLower.includes('pizza');
                const isPastaGroup = groupNameLower.includes('spaghetti') || groupNameLower.includes('grantin') || groupNameLower.includes('risotto') || groupNameLower.includes('gratin');

                const isDrink = groupNameLower.includes('pepsi') || groupNameLower.includes('coca') || groupNameLower.includes('nước') || groupNameLower.includes('drink');
                return (
                  <div key={group.group_id} className={isDrink ? 'order-3' : 'order-1'}>
                    <h3 className="font-bold text-lg mb-1 border-b border-white/20 pb-1">{group.group_name}</h3>
                    <p className="text-xs text-white/60 mb-4">
                      {group.min_select === group.max_select
                        ? `Select ${group.min_select}`
                        : `Select ${group.min_select} - ${group.max_select}`
                      }
                    </p>

                    {isPizzaGroup ? (
                      (() => {
                        const dishMap = new Map();
                        group.combo_items.forEach((item: any) => {
                          const dishId = item.dish_price.dish_id;
                          if (!dishMap.has(dishId)) {
                            dishMap.set(dishId, { dish: item.dish_price.dish, items: [] });
                          }
                          dishMap.get(dishId).items.push(item);
                        });
                        const uniqueDishes = Array.from(dishMap.values());
                        const selectedDishId = pizzaDishSelections[group.group_id];
                        const currentDishData = dishMap.get(selectedDishId);
                        const selectedComboItemId = selections[group.group_id]?.[0];

                        const dishOptions = uniqueDishes
                          .filter((ud: any) => !ud.dish.dish_name.toLowerCase().includes('half-half') && !ud.dish.dish_name.toLowerCase().includes('half half'))
                          .map((ud: any) => ({
                            value: ud.dish.dish_id,
                            label: ud.dish.dish_name
                          }));

                        const sizeMap = new Map();
                        const isHalf = pizzaHalfSelections[group.group_id] || false;
                        const dish2Id = pizzaDish2Selections[group.group_id];
                        const currentDishData2 = (isHalf && dish2Id) ? dishMap.get(dish2Id) : null;

                        currentDishData?.items.forEach((item1: any) => {
                          const sizeId = item1.dish_price.size_id || 0;
                          const crustId = item1.dish_price.crust_id || 0;

                          if (isHalf && currentDishData2) {
                            const hasMatch = currentDishData2.items.some((item2: any) =>
                              (item2.dish_price.size_id || 0) === sizeId
                            );
                            if (!hasMatch) return; // Nửa 2 không có size này thì bỏ qua
                          }

                          if (!sizeMap.has(sizeId)) {
                            sizeMap.set(sizeId, { size: item1.dish_price.size, items: [] });
                          }
                          sizeMap.get(sizeId).items.push(item1);
                        });
                        const uniqueSizes = Array.from(sizeMap.values());

                        // Lấy size đang chọn hoặc mặc định size đầu tiên nếu chưa chọn
                        const rawSelectedSizeId = pizzaSizeSelections[group.group_id];
                        let activeSizeData = sizeMap.get(rawSelectedSizeId);
                        if (!activeSizeData && uniqueSizes.length > 0) {
                          activeSizeData = uniqueSizes[0];
                        }
                        const activeSizeId = activeSizeData?.size?.size_id || 0;

                        return (
                          <div>
                            {crustsList.length > 0 && (
                              <div className="mb-6 pb-6 border-b border-white/10">
                                <label className="block text-sm font-bold text-white mb-3">Crust (*)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {crustsList.filter(c => c.is_visible !== false && c.crust_name !== 'None').map(crust => {
                                    const selectedCrustId = pizzaCrustSelections[group.group_id] || 0;
                                    return (
                                      <label key={crust.crust_id} className="flex items-center gap-3 cursor-pointer group" onClick={() => {
                                        setPizzaCrustSelections(prev => ({ ...prev, [group.group_id]: crust.crust_id }));
                                        const match = group.combo_items.find((i: any) => i.dish_price?.dish_id === selectedDishId && (i.dish_price?.size_id || 0) === activeSizeId && (i.dish_price?.crust_id || 0) === crust.crust_id);
                                        if (match) handleSelection(group.group_id, String(match.combo_item_id));
                                      }}>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedCrustId === crust.crust_id ? 'border-white' : 'border-white/50 group-hover:border-white/80'}`}>
                                          {selectedCrustId === crust.crust_id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-white text-sm">{crust.crust_name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="block text-sm font-bold text-white">Pizza (*)</label>
                                  {dishOptions.length > 1 && (
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isHalf ? 'bg-[#f0c14b] border-[#f0c14b]' : 'border-white/50 group-hover:border-white'}`}>
                                        {isHalf && (
                                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-sm font-semibold text-white">Half-Half</span>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={isHalf}
                                        onChange={() => setPizzaHalfSelections(prev => ({ ...prev, [group.group_id]: !prev[group.group_id] }))}
                                      />
                                    </label>
                                  )}
                                </div>

                                {!isHalf ? (
                                  <CustomSelect
                                    value={selectedDishId}
                                    options={dishOptions}
                                    onChange={(newDishId) => {
                                      setPizzaDishSelections(prev => ({ ...prev, [group.group_id]: newDishId }));
                                      const items = dishMap.get(newDishId).items;
                                      const firstSizeId = items[0].dish_price.size_id || 0;
                                      setPizzaSizeSelections(prev => ({ ...prev, [group.group_id]: firstSizeId }));
                                      handleSelection(group.group_id, String(items[0].combo_item_id));
                                    }}
                                  />
                                ) : (
                                  <div className="space-y-3 p-3 bg-black/20 rounded-lg border border-white/10">
                                    <div>
                                      <label className="block text-xs text-white/80 mb-1 font-semibold">Nửa 1:</label>
                                      <CustomSelect
                                        value={selectedDishId}
                                        options={dishOptions}
                                        onChange={(newDishId) => {
                                          setPizzaDishSelections(prev => ({ ...prev, [group.group_id]: newDishId }));
                                          const items = dishMap.get(newDishId).items;
                                          const firstSizeId = items[0].dish_price.size_id || 0;
                                          setPizzaSizeSelections(prev => ({ ...prev, [group.group_id]: firstSizeId }));
                                          handleSelection(group.group_id, String(items[0].combo_item_id));
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-white/80 mb-1 font-semibold">Nửa 2:</label>
                                      <CustomSelect
                                        value={pizzaDish2Selections[group.group_id] || dishOptions[0]?.value}
                                        options={dishOptions}
                                        onChange={(newDishId) => {
                                          setPizzaDish2Selections(prev => ({ ...prev, [group.group_id]: newDishId }));
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {uniqueSizes.length > 1 && (
                                <div>
                                  <label className="block text-sm font-bold text-white mb-2">Size (*)</label>
                                  <div className="flex gap-3">
                                    {uniqueSizes.map((szData: any) => {
                                      const sId = szData.size?.size_id || 0;
                                      return (
                                        <button
                                          key={sId}
                                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeSizeId === sId
                                            ? 'bg-white text-[#9f280a]'
                                            : 'bg-black/20 text-white hover:bg-black/30'
                                            }`}
                                          onClick={() => {
                                            setPizzaSizeSelections(prev => ({ ...prev, [group.group_id]: sId }));
                                            if (szData.items.length > 0) {
                                              handleSelection(group.group_id, String(szData.items[0].combo_item_id));
                                            }
                                          }}
                                        >
                                          {szData.size ? szData.size.size_name : 'Standard'}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}


                            </div>

                            {(() => {
                              const selectedItemForSize = activeSizeData?.items.find((item: any) => String(item.combo_item_id) === selectedComboItemId);
                              const selectedSizeIdTopping = selectedItemForSize?.dish_price?.size_id;
                              const availableToppings = pizzaToppingsList.filter(t => !t.size_id || t.size_id === selectedSizeIdTopping);

                              if (availableToppings.length === 0) return null;
                              return (
                                <div className="mt-6">
                                  <label className="block text-sm font-bold text-white mb-3">Extra Toppings</label>
                                  <div className="space-y-3">
                                    {availableToppings.map(topping => {
                                      const isSelected = (selectedToppings[group.group_id] || []).some(t => t.topping_id === topping.topping_id);
                                      return (
                                        <label key={topping.topping_id} className="flex items-center justify-between cursor-pointer group" onClick={() => handleToppingToggle(group.group_id, topping)}>
                                          <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-white/50 group-hover:border-white/80'}`}>
                                              {isSelected && <Check size={10} className="text-[#9f280a]" />}
                                            </div>
                                            <span className="text-white text-sm">
                                              {topping.topping_name}
                                              {(() => {
                                                const matchingItem = currentDishData?.items.find((item: any) => item.dish_price?.size_id === topping.size_id);
                                                return matchingItem?.dish_price?.size ? ` - Size ${matchingItem.dish_price.size.size_name}` : '';
                                              })()}
                                            </span>
                                          </div>
                                          <span className="text-white font-bold text-sm">{formatPrice(topping.price_topping)}</span>
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
                                <label className="block text-sm font-bold text-white mb-2">Phân loại</label>
                                <div className="space-y-3">
                                  {['Risotto', 'Grantin', 'Spaghetti'].filter(c => catMap[c] && catMap[c].length > 0).map(cat => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group" onClick={() => {
                                      setPastaCategorySelections(prev => ({ ...prev, [group.group_id]: cat }));
                                      const newItems = catMap[cat];
                                      if (newItems.length > 0) {
                                        handleSelection(group.group_id, String(newItems[0].combo_item_id));
                                      }
                                    }}>
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCat === cat ? 'border-white' : 'border-white/50 group-hover:border-white/80'}`}>
                                        {selectedCat === cat && <div className="w-2 h-2 bg-white rounded-full" />}
                                      </div>
                                      <span className="text-white text-sm">{cat}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-white mb-2">Options</label>
                                <CustomSelect
                                  value={selectedComboItemId}
                                  options={itemsInCat.map((item: any) => ({
                                    value: String(item.combo_item_id),
                                    label: item.dish_price.dish.dish_name
                                  }))}
                                  onChange={(newComboItemId) => handleSelection(group.group_id, String(newComboItemId))}
                                />
                              </div>
                            </div>

                            {(() => {
                              const selectedItem = itemsInCat.find((i: any) => String(i.combo_item_id) === selectedComboItemId);
                              const selectedSizeIdTopping = selectedItem?.dish_price?.size_id;

                              // Hiện tất cả topping is_for_spaghetti từ API
                              const availableToppings = spaghettiToppingsList;

                              if (availableToppings.length === 0) return null;
                              return (
                                <div className="mt-6">
                                  <label className="block text-sm font-bold text-white mb-3">Extra Toppings</label>
                                  <div className="space-y-3">
                                    {availableToppings.map(topping => {
                                      const isSelected = (selectedToppings[group.group_id] || []).some(t => t.topping_id === topping.topping_id);
                                      return (
                                        <label key={topping.topping_id} className="flex items-center justify-between cursor-pointer group" onClick={() => handleToppingToggle(group.group_id, topping)}>
                                          <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-white/50 group-hover:border-white/80'}`}>
                                              {isSelected && <Check size={10} className="text-[#9f280a]" />}
                                            </div>
                                            <span className="text-white text-sm">{topping.topping_name}</span>
                                          </div>
                                          <span className="text-white font-bold text-sm">{formatPrice(topping.price_topping)}</span>
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
                          <div className="space-y-3">
                            {group.combo_items.map((item: any) => {
                              let displayDishName = item.dish_price.dish.dish_name;
                              if (comboName.toLowerCase().includes('happy family') && displayDishName.toLowerCase() === 'pepsi') {
                                displayDishName = '4 x ' + displayDishName;
                              }
                              return (
                                <label key={item.combo_item_id} className="flex items-center justify-between cursor-pointer group" onClick={() => handleSelection(group.group_id, String(item.combo_item_id))}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedComboItemId === String(item.combo_item_id) ? 'border-white' : 'border-white/50 group-hover:border-white/80'}`}>
                                      {selectedComboItemId === String(item.combo_item_id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-white text-sm">{displayDishName}</span>
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
                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2 border-b border-white/20 pb-1">Included in Combo</h3>
                    <ul className="list-disc pl-5 space-y-1 mt-3">
                      {fixedGroups.map(g => {
                        const groupNameLower = g.group_name.toLowerCase();
                        const isPizza = groupNameLower.includes('pizza');
                        const isPasta = groupNameLower.includes('spaghetti') || groupNameLower.includes('grantin') || groupNameLower.includes('risotto') || groupNameLower.includes('gratin');
                        const selectedSizeIdTopping = g.combo_items[0]?.dish_price?.size_id;

                        let availableToppings: any[] = [];
                        if (isPizza) {
                          availableToppings = pizzaToppingsList.filter(t => !t.size_id || t.size_id === selectedSizeIdTopping);
                        } else if (isPasta) {
                          // Hiện tất cả topping is_for_spaghetti từ API
                          availableToppings = [...spaghettiToppingsList];
                        }

                        return (
                          <li key={g.group_id} className="text-white text-sm mb-3">
                            <span className="font-semibold leading-relaxed">{g.group_name}</span>
                            {availableToppings.length > 0 && (
                              <div className="mt-2 ml-4">
                                <label className="block text-xs font-bold text-white/70 mb-2">Extra Toppings:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {availableToppings.map(topping => {
                                    const isSelected = (selectedToppings[g.group_id] || []).some(t => t.topping_id === topping.topping_id);
                                    return (
                                      <label key={topping.topping_id} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleToppingToggle(g.group_id, topping)}>
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-white bg-white' : 'border-white/50 group-hover:border-white/80'}`}>
                                          {isSelected && <Check size={10} className="text-[#9f280a]" />}
                                        </div>
                                        <span className="text-white text-xs">{topping.topping_name} <span className="font-bold text-[#f0c14b] ml-1">+{formatPrice(topping.price_topping)}</span></span>
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
                <h3 className="font-bold text-lg mb-3 border-b border-white/20 pb-1">Note</h3>
                <input
                  type="text"
                  placeholder="Leave a note about your order here..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white text-black rounded-lg p-3 outline-none text-sm mt-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 flex flex-col items-center gap-4 shrink-0">
          <div className="flex items-center justify-center bg-white text-black rounded-xl overflow-hidden font-bold h-10 w-20 shadow-md">
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
            className="w-auto px-8 sm:px-12 bg-[#f0c14b] hover:bg-[#e2b036] text-black font-bold h-12 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2.5 text-base"
          >
            <ShoppingCart size={20} />
            Add to Cart : {formatPrice(totalPrice)}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

