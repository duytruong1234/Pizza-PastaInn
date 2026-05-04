import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string; // unique id for cart item (frontend generated)
  dish_id: number;
  dish_price_id: string; // The specific variant to save to DB
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  options?: {
    size?: string;
    crust?: string;
    toppings?: string;
    notes?: string;
    extraPrice?: number;
  };
};

type CartStore = {
  cart_id: number | null;
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (id: string, dish_price_id: string) => Promise<void>;
  updateQuantity: (id: string, dish_price_id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart_id: null,
      items: [],
      addToCart: async (item) => {
        // Optimistic UI update
        const newItem = { ...item, id: Date.now().toString() };
        set((state) => ({ items: [...state.items, newItem] }));

        // API Call to Database
        try {
          const res = await fetch('http://localhost:4000/api/cart/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart_id: get().cart_id,
              dish_price_id: item.dish_price_id,
              quantity: item.quantity,
              price_cart: item.price + (item.options?.extraPrice || 0),
              cart_item_note: item.options?.notes || '',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data?.cart_id) {
              set({ cart_id: data.data.cart_id });
            }
          }
        } catch (error) {
          console.error('Failed to sync add to cart with DB', error);
        }
      },
      removeFromCart: async (id, dish_price_id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        const currentCartId = get().cart_id;
        if (currentCartId) {
          try {
            await fetch('http://localhost:4000/api/cart/items', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cart_id: currentCartId,
                dish_price_id,
              }),
            });
          } catch (error) {
            console.error('Failed to sync remove from cart with DB', error);
          }
        }
      },
      updateQuantity: async (id, dish_price_id, quantity) => {
        if (quantity < 1) return;
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));

        const currentCartId = get().cart_id;
        if (currentCartId) {
          try {
            await fetch('http://localhost:4000/api/cart/items', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cart_id: currentCartId,
                dish_price_id,
                quantity,
              }),
            });
          } catch (error) {
            console.error('Failed to sync update cart with DB', error);
          }
        }
      },
      clearCart: () => set({ items: [], cart_id: null }),
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      totalPrice: () => {
        return get().items.reduce((total, item) => {
          const itemPrice = item.price + (item.options?.extraPrice || 0);
          return total + itemPrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'cart-storage', // name of item in localStorage
    }
  )
);
