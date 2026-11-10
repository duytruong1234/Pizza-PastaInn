import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  dish_id: number;
  dish_name: string;
  image?: string | null;
  ingredient?: string | null;
  category?: string | null;
  dish_type?: string | null;
  min_price?: number;
  prices?: any[];
  added_at: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggleWishlist: (item: Omit<WishlistItem, 'added_at'>) => boolean;
  isWishlisted: (dishId: number) => boolean;
  removeWishlist: (dishId: number) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (item) => {
        const current = get().items;
        const exists = current.some((x) => x.dish_id === item.dish_id);
        if (exists) {
          set({ items: current.filter((x) => x.dish_id !== item.dish_id) });
          return false;
        }
        set({
          items: [
            {
              ...item,
              added_at: new Date().toISOString(),
            },
            ...current,
          ],
        });
        return true;
      },

      isWishlisted: (dishId) => {
        return get().items.some((x) => x.dish_id === dishId);
      },

      removeWishlist: (dishId) => {
        set({ items: get().items.filter((x) => x.dish_id !== dishId) });
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'pizza-inn-wishlist-storage',
    }
  )
);
