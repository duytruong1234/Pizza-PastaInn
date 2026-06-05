import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { API_BASE } from '../lib/config';

// ── Kiểu dữ liệu Topping ───────────────────────────────────────────────────
export type ToppingData = {
  topping_id: number;
  name: string;
  price: number;
  quantity?: number;
};

// ── Kiểu dữ liệu Half-Half ─────────────────────────────────────────────────
export type HalfData = {
  dish_id: number;
  name: string;
  toppings?: ToppingData[];
};

// ── Kiểu dữ liệu lựa chọn Combo ────────────────────────────────────────────
export type ComboSelectionData = {
  group_id: string;
  dish_price_id: string;
  is_half_half?: boolean;
  halves?: HalfData[];
  toppings?: ToppingData[];
};

// ── Kiểu dữ liệu CartItem (lưu frontend + đồng bộ DB) ─────────────────────
export type CartItem = {
  id: string;                   // ID tạm của frontend (Date.now)
  cart_item_id?: number;        // ID thật từ DB (sau khi API trả về)
  type: 'regular' | 'half_half' | 'combo';  // Loại sản phẩm
  dish_id?: number;
  dish_price_id?: string;       // Biến thể sản phẩm (cho món thường)
  combo_id?: number;            // ID combo (cho combo)
  name: string;
  price: number;                // Giá đã tính (bao gồm topping, extra)
  quantity: number;
  imageUrl: string;
  // Thông tin tùy chọn hiển thị trên frontend
  options?: {
    size?: string;
    crust?: string;
    toppings?: ToppingData[];
    notes?: string;
    comboItems?: any[];         // Hiển thị chi tiết combo trên UI
  };
  // Dữ liệu gửi xuống DB
  halves?: HalfData[];
  combo_selections?: ComboSelectionData[];
};

type CartStore = {
  cart_id: number | null;
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncFromDB: () => Promise<void>;
  totalItems: () => number;
  totalPrice: () => number;
};

const API_URL = `${API_BASE}/cart`;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart_id: null,
      items: [],

      // ── Thêm sản phẩm vào giỏ hàng ─────────────────────────────────────────
      addToCart: async (item) => {
        const newItem: CartItem = { ...item, id: Date.now().toString() };

        // Cập nhật UI ngay lập tức
        set((state) => ({ items: [...state.items, newItem] }));

        // Gọi API đồng bộ với Database
        try {
          // Lấy user_id từ authStore (nếu đã đăng nhập)
          const user_id = useAuthStore.getState().user?.user_id || null;
          let body: any = {};

          switch (item.type) {
            case 'regular':
              body = {
                type: 'regular',
                cart_id: get().cart_id,
                user_id,
                dish_price_id: item.dish_price_id,
                quantity: item.quantity,
                price_cart: item.price,
                cart_item_note: item.options?.notes || '',
                toppings: (item.options?.toppings || []).map(t => ({
                  topping_id: t.topping_id,
                  quantity: t.quantity || 1
                }))
              };
              break;

            case 'half_half':
              body = {
                type: 'half_half',
                cart_id: get().cart_id,
                user_id,
                dish_price_id: item.dish_price_id,
                quantity: item.quantity,
                price_cart: item.price,
                cart_item_note: item.options?.notes || '',
                halves: (item.halves || []).map(h => ({
                  dish_id: h.dish_id,
                  toppings: (h.toppings || []).map(t => ({
                    topping_id: t.topping_id,
                    quantity: t.quantity || 1
                  }))
                })),
                toppings: (item.options?.toppings || []).map(t => ({
                  topping_id: t.topping_id,
                  quantity: t.quantity || 1
                }))
              };
              break;

            case 'combo':
              body = {
                type: 'combo',
                cart_id: get().cart_id,
                user_id,
                combo_id: item.combo_id,
                quantity: item.quantity,
                price_cart: item.price,
                cart_item_note: item.options?.notes || '',
                combo_selections: (item.combo_selections || []).map(s => ({
                  group_id: s.group_id,
                  dish_price_id: s.dish_price_id,
                  is_half_half: s.is_half_half || false,
                  halves: (s.halves || []).map(h => ({
                    dish_id: h.dish_id,
                    toppings: (h.toppings || []).map(t => ({
                      topping_id: t.topping_id,
                      quantity: t.quantity || 1
                    }))
                  })),
                  toppings: (s.toppings || []).map(t => ({
                    topping_id: t.topping_id,
                    quantity: t.quantity || 1
                  }))
                }))
              };
              break;
          }

          const res = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
              // Cập nhật cart_id và cart_item_id từ DB
              set((state) => ({
                cart_id: data.data.cart_id,
                items: state.items.map(i =>
                  i.id === newItem.id
                    ? { ...i, cart_item_id: data.data.cart_item_id }
                    : i
                )
              }));
            }
          }
        } catch (error) {
          console.error('Lỗi đồng bộ thêm vào giỏ hàng với DB', error);
        }
      },

      // ── Xóa 1 mục khỏi giỏ hàng ────────────────────────────────────────────
      removeFromCart: async (id) => {
        const item = get().items.find(i => i.id === id);
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));

        // Đồng bộ xóa trên DB
        if (item?.cart_item_id) {
          try {
            await fetch(`${API_URL}/items/${item.cart_item_id}`, {
              method: 'DELETE',
            });
          } catch (error) {
            console.error('Lỗi đồng bộ xóa giỏ hàng với DB', error);
          }
        }
      },

      // ── Cập nhật số lượng ───────────────────────────────────────────────────
      updateQuantity: async (id, quantity) => {
        if (quantity < 1) {
          return get().removeFromCart(id);
        }

        const item = get().items.find(i => i.id === id);
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));

        // Đồng bộ cập nhật trên DB
        if (item?.cart_item_id) {
          try {
            await fetch(`${API_URL}/items/${item.cart_item_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity }),
            });
          } catch (error) {
            console.error('Lỗi đồng bộ cập nhật giỏ hàng với DB', error);
          }
        }
      },

      // ── Xóa toàn bộ giỏ hàng ───────────────────────────────────────────────
      clearCart: async () => {
        const currentCartId = get().cart_id;
        set({ items: [], cart_id: null });

        if (currentCartId) {
          try {
            await fetch(`${API_URL}/${currentCartId}`, {
              method: 'DELETE',
            });
          } catch (error) {
            console.error('Lỗi đồng bộ xóa giỏ hàng với DB', error);
          }
        }
      },

      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + item.price * item.quantity;
        }, 0);
      },

      // ── Đồng bộ giỏ hàng từ DB (gọi khi mở trang / đăng nhập) ──────────────
      syncFromDB: async () => {
        try {
          const user_id = useAuthStore.getState().user?.user_id;
          if (!user_id) return;

          const res = await fetch(`${API_URL}/user/${user_id}`);
          if (!res.ok) return;

          const data = await res.json();
          if (!data.success || !data.data) return;

          const cart = data.data;
          // Map dữ liệu DB thành CartItem cho frontend
          const mappedItems: CartItem[] = (cart.items || []).map((dbItem: any) => {
            // Xác định loại sản phẩm
            let type: 'regular' | 'half_half' | 'combo' = 'regular';
            if (dbItem.combo_id) type = 'combo';
            else if (dbItem.is_half_half) type = 'half_half';

            // Map toppings từ DB
            const toppings = (dbItem.toppings || []).map((t: any) => ({
              topping_id: t.topping_id,
              name: '',
              price: 0,
              quantity: (t.quantity || 1) / (dbItem.quantity || 1)
            }));

            // Map halves từ DB
            const halves = (dbItem.halves || []).map((h: any) => ({
              dish_id: h.dish_id,
              name: ''
            }));

            // Map combo selections từ DB
            const combo_selections = (dbItem.combos || []).map((c: any) => ({
              group_id: c.group_id,
              dish_price_id: c.dish_price_id,
              is_half_half: c.is_half_half || false,
              halves: (c.halves || []).map((h: any) => ({
                dish_id: h.dish_id,
                name: ''
              })),
              toppings: (c.toppings || []).map((t: any) => ({
                topping_id: t.topping_id,
                quantity: (t.quantity || 1) / (dbItem.quantity || 1)
              }))
            }));

            // Tên hiển thị — lấy từ cart_item_note hoặc dish_price_id
            const name = dbItem.cart_item_note || dbItem.dish_price_id || 'Cart Item';

            return {
              id: `db_${dbItem.cart_item_id}`,
              cart_item_id: dbItem.cart_item_id,
              type,
              dish_id: dbItem.combo_id || undefined,
              dish_price_id: dbItem.dish_price_id || undefined,
              combo_id: dbItem.combo_id || undefined,
              name,
              price: (dbItem.price_cart || 0) / (dbItem.quantity || 1),
              quantity: dbItem.quantity || 1,
              imageUrl: '',
              options: {
                toppings,
                notes: dbItem.cart_item_note || ''
              },
              halves: halves.length > 0 ? halves : undefined,
              combo_selections: combo_selections.length > 0 ? combo_selections : undefined
            } as CartItem;
          });

          set({
            cart_id: cart.cart_id,
            items: mappedItems
          });
        } catch (error) {
          console.error('Lỗi đồng bộ giỏ hàng từ DB', error);
        }
      },
    }),
    {
      name: 'cart-storage', // tên key trong localStorage
    }
  )
);
