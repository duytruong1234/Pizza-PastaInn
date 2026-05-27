import { useCartStore } from '@/store/cartStore';
import { useUI } from '@/components/UIProvider';

export function useAddToCart() {
  const { addToCart } = useCartStore();
  const { toggleCart, isCartOpen } = useUI();

  const handleAddToCart = (item: {
    id: number;
    dish_price_id: string;
    name: string;
    price: number;
    imageUrl: string;
  }) => {
    addToCart({
      type: 'regular',
      dish_id: item.id,
      dish_price_id: item.dish_price_id || '', 
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop',
    });
    
    // Tự động mở giỏ hàng nếu đang đóng
    if (!isCartOpen) {
      toggleCart();
    }
  };

  return { handleAddToCart };
}
