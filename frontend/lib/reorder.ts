import { useCartStore, ToppingData, HalfData, ComboSelectionData } from '@/store/cartStore';
import { BACKEND_URL } from '@/lib/config';

const GENERIC_FALLBACK = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop';
const HALF_HALF_FALLBACK = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=300&auto=format&fit=crop';
const COMBO_FALLBACK = 'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=300&auto=format&fit=crop';

const resolveImageUrl = (path?: string | null, fallback = GENERIC_FALLBACK) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
};

const mapOrderToppings = (rawToppings?: any[], itemQty = 1): ToppingData[] => {
  if (!Array.isArray(rawToppings)) return [];
  return rawToppings
    .map((t) => {
      const id = t.topping_id ?? t.topping?.topping_id;
      if (!id) return null;
      const perItemQty = Math.max(1, Math.round((t.quantity || 1) / Math.max(1, itemQty)));
      return {
        topping_id: Number(id),
        name: t.topping?.topping_name || 'Topping',
        price: Number(t.topping_price || 0),
        quantity: perItemQty,
      };
    })
    .filter(Boolean) as ToppingData[];
};

const mapOrderHalves = (rawHalves?: any[], itemQty = 1): HalfData[] => {
  if (!Array.isArray(rawHalves)) return [];
  return rawHalves
    .map((h) => {
      const dishId = h.dish_id ?? h.dish?.dish_id;
      if (!dishId) return null;
      return {
        dish_id: Number(dishId),
        name: h.dish?.dish_name || 'Nửa bánh',
        toppings: mapOrderToppings(h.order_item_toppings, itemQty),
      };
    })
    .filter(Boolean) as HalfData[];
};

/**
 * Tái tạo toàn bộ các món từ một đơn hàng cũ và thêm vào giỏ hàng hiện tại.
 * Trả về số lượng mục đã thêm thành công.
 */
export async function reorderOrderItems(orderItems: any[]): Promise<number> {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return 0;

  const { addToCart } = useCartStore.getState();
  let addedCount = 0;

  for (const item of orderItems) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.order_price) || 0;
    const isCombo = Boolean(item.combo_id);
    const isHalfHalf = Boolean(item.is_half_half);

    if (isCombo && item.combo_id) {
      const comboName = item.combo?.combo_name || `Combo #${item.combo_id}`;
      const imageUrl = resolveImageUrl(item.combo?.image_combo, COMBO_FALLBACK);

      const comboSelections: ComboSelectionData[] = (item.combos || [])
        .map((c: any) => {
          const dpId = c.dish_price_id || c.dish_price?.dish_price_id;
          if (!dpId) return null;
          return {
            group_id: c.group_id || '',
            dish_price_id: String(dpId),
            is_half_half: Boolean(c.is_half_half),
            halves: mapOrderHalves(c.halves, qty),
            toppings: mapOrderToppings(c.toppings, qty),
          };
        })
        .filter(Boolean) as ComboSelectionData[];

      const comboItemsDisplay = (item.combos || []).map((c: any) => ({
        dish_name: c.is_half_half
          ? `Pizza Nửa - Nửa (${(c.halves || []).map((h: any) => h.dish?.dish_name).filter(Boolean).join(' + ')})`
          : c.dish_price?.dish?.dish_name || 'Món trong combo',
        size: c.dish_price?.size?.size_name,
        crust: c.dish_price?.crust?.crust_name,
        toppings: mapOrderToppings(c.toppings, qty),
      }));

      await addToCart({
        type: 'combo',
        combo_id: Number(item.combo_id),
        name: comboName,
        price: unitPrice,
        quantity: qty,
        imageUrl,
        options: {
          notes: item.order_item_note || undefined,
          comboItems: comboItemsDisplay,
        },
        combo_selections: comboSelections,
      });
      addedCount += qty;
    } else if (isHalfHalf) {
      const dishPriceId = item.dish_price_id || item.dish_price?.dish_price_id || undefined;
      const halves = mapOrderHalves(item.halves, qty);
      const halfNames = halves.map((h) => h.name).filter(Boolean);
      const displayName =
        halfNames.length === 2
          ? `Pizza Half & Half (${halfNames[0]} / ${halfNames[1]})`
          : 'Pizza Nửa - Nửa (Half & Half)';

      await addToCart({
        type: 'half_half',
        dish_price_id: dishPriceId ? String(dishPriceId) : undefined,
        name: displayName,
        price: unitPrice,
        quantity: qty,
        imageUrl: HALF_HALF_FALLBACK,
        options: {
          size: item.dish_price?.size?.size_name || undefined,
          crust: item.dish_price?.crust?.crust_name || undefined,
          toppings: mapOrderToppings(item.toppings, qty),
          notes: item.order_item_note || undefined,
        },
        halves,
      });
      addedCount += qty;
    } else {
      const dishId = item.dish_price?.dish?.dish_id || item.dish_id || undefined;
      const dishPriceId = item.dish_price_id || item.dish_price?.dish_price_id || undefined;
      const dishName = item.dish_price?.dish?.dish_name || 'Món ăn';
      const imageUrl = resolveImageUrl(item.dish_price?.dish?.image, GENERIC_FALLBACK);

      await addToCart({
        type: 'regular',
        dish_id: dishId ? Number(dishId) : undefined,
        dish_price_id: dishPriceId ? String(dishPriceId) : undefined,
        name: dishName,
        price: unitPrice,
        quantity: qty,
        imageUrl,
        options: {
          size: item.dish_price?.size?.size_name || undefined,
          crust: item.dish_price?.crust?.crust_name || undefined,
          toppings: mapOrderToppings(item.toppings, qty),
          notes: item.order_item_note || undefined,
        },
      });
      addedCount += qty;
    }
  }

  return addedCount;
}
