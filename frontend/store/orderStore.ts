import { create } from 'zustand';
import { useCartStore, CartItem } from './cartStore';
import { useAuthStore } from './authStore';

// ── Kiểu dữ liệu cho Order ─────────────────────────────────────────────────

export type OrderType = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'vietqr';

export type OrderFormData = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  // Delivery
  customer_address: string;
  customer_lat?: number | null;
  customer_lon?: number | null;
  shipping_fee?: number;
  distance?: number;
  nearest_store_name?: string;
  // Pickup
  store_id: number | null;
  user_address_id?: number | null;
  // Type
  order_type: OrderType;
  // Schedule
  deliver_now: boolean;
  scheduled_date: string;
  scheduled_time: string;
  // Note
  order_note: string;
  // Payment
  payment_method: PaymentMethod;
};

export type CheckoutStep = 'info' | 'payment' | 'success' | 'failure';

export type OrderResult = {
  order_id: number;
  order_status: string;
  total_order: number;
  payment_method: string;
  order_type: string;
  created_at: string;
};

type OrderStore = {
  step: CheckoutStep;
  formData: OrderFormData;
  orderResult: OrderResult | null;
  isSubmitting: boolean;
  error: string | null;
  vietqrAttempt: number;

  setStep: (step: CheckoutStep) => void;
  updateFormData: (data: Partial<OrderFormData>) => void;
  resetForm: () => void;
  submitOrder: (bypassVietQRStep?: boolean) => Promise<boolean>;
};

const initialFormData: OrderFormData = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  customer_address: '',
  customer_lat: null,
  customer_lon: null,
  shipping_fee: 0,
  distance: 0,
  nearest_store_name: '',
  store_id: null,
  user_address_id: null,
  order_type: 'delivery',
  deliver_now: true,
  scheduled_date: '',
  scheduled_time: '',
  order_note: '',
  payment_method: 'cod',
};

const API_URL = 'http://localhost:4000/api/orders';

export const useOrderStore = create<OrderStore>()((set, get) => ({
  step: 'info',
  formData: { ...initialFormData },
  orderResult: null,
  isSubmitting: false,
  error: null,
  vietqrAttempt: 0,

  setStep: (step) => set({ step }),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
      error: null,
    })),

  resetForm: () =>
    set({
      step: 'info',
      formData: { ...initialFormData },
      orderResult: null,
      isSubmitting: false,
      error: null,
      vietqrAttempt: 0,
    }),

  // ── Submit đơn hàng ─────────────────────────────────────────────────────
  submitOrder: async (bypassVietQRStep = false) => {
    const { formData, vietqrAttempt } = get();
    const cartStore = useCartStore.getState();
    const authStore = useAuthStore.getState();

    // Validate
    if (!formData.customer_name) {
      set({ error: 'Vui lòng nhập họ tên người nhận' });
      return false;
    }
    if (!formData.customer_phone) {
      set({ error: 'Vui lòng nhập số điện thoại' });
      return false;
    }
    if (formData.order_type === 'delivery' && !formData.customer_address) {
      set({ error: 'Vui lòng nhập địa chỉ giao hàng' });
      return false;
    }
    if (cartStore.items.length === 0) {
      set({ error: 'Giỏ hàng trống' });
      return false;
    }

    set({ isSubmitting: true, error: null });

    // Chuyển hướng sang màn hình thanh toán VietQR toàn màn hình nếu chọn VietQR và không bỏ qua bước này
    if (formData.payment_method === 'vietqr' && !bypassVietQRStep) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      set({
        step: 'payment',
        isSubmitting: false,
      });
      return true;
    }

    try {
      // Chuyển đổi CartItem → OrderItemInput
      const items = cartStore.items.map((item: CartItem) => ({
        type: item.type,
        dish_price_id: item.dish_price_id || undefined,
        combo_id: item.combo_id || undefined,
        quantity: item.quantity,
        order_price: item.price * item.quantity,
        order_item_note: item.options?.notes || '',
        toppings: (item.options?.toppings || []).map((t) => ({
          topping_id: t.topping_id,
          quantity: t.quantity || 1,
          topping_price: t.price || 0,
        })),
        halves: (item.halves || []).map((h) => ({
          dish_id: h.dish_id,
          toppings: (h.toppings || []).map((t) => ({
            topping_id: t.topping_id,
            quantity: t.quantity || 1,
            topping_price: t.price || 0,
          })),
        })),
        combo_selections: (item.combo_selections || []).map((s) => ({
          group_id: s.group_id,
          dish_price_id: s.dish_price_id,
          is_half_half: s.is_half_half || false,
          halves: (s.halves || []).map((h) => ({
            dish_id: h.dish_id,
            toppings: (h.toppings || []).map((t) => ({
              topping_id: t.topping_id,
              quantity: t.quantity || 1,
              topping_price: t.price || 0,
            })),
          })),
          toppings: (s.toppings || []).map((t) => ({
            topping_id: t.topping_id,
            quantity: t.quantity || 1,
            topping_price: t.price || 0,
          })),
        })),
      }));

      const totalPrice = cartStore.totalPrice();
      const shippingFee = formData.order_type === 'delivery' ? (formData.shipping_fee || 0) : 0;

      // Xử lý pickup_time
      let pickup_time: string | undefined;
      if (!formData.deliver_now && formData.scheduled_date && formData.scheduled_time) {
        pickup_time = new Date(
          `${formData.scheduled_date}T${formData.scheduled_time}`
        ).toISOString();
      }

      const body = {
        user_id: authStore.user?.user_id || null,
        user_address_id: formData.user_address_id || null,
        cart_id: cartStore.cart_id,
        payment_method: formData.payment_method,
        total_price_dish: totalPrice,
        shipping_fee: shippingFee,
        discount_amount: 0,
        total_order: totalPrice + shippingFee,
        order_note: formData.order_note || '',
        order_type: formData.order_type,
        pickup_time,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        customer_address: formData.customer_address,
        store_id: formData.store_id,
        items,
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Xóa giỏ hàng local
        await cartStore.clearCart();

        set({
          orderResult: {
            order_id: data.data.order_id,
            order_status: data.data.order_status,
            total_order: data.data.total_order,
            payment_method: data.data.payment_method,
            order_type: data.data.order_type,
            created_at: data.data.created_at,
          },
          step: 'success',
          isSubmitting: false,
        });
        return true;
      } else {
        set({
          error: data.message || 'Đặt hàng thất bại',
          isSubmitting: false,
        });
        return false;
      }
    } catch (error) {
      console.error('Submit order error:', error);
      set({ error: 'Lỗi kết nối server', isSubmitting: false });
      return false;
    }
  },
}));
