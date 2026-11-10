'use client';

import React, { useState, useEffect, useCallback } from 'react';
import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Search, Phone, Calendar, Clock, CreditCard, Package, AlertCircle, ChevronDown, ChevronUp, MapPin, User, Mail, FileText, X, RotateCcw, Ban, Printer } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { printOrderReceipt } from '@/lib/printReceipt';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useUI } from '@/components/UIProvider';
import { useDialog } from '@/components/ui/dialog-provider';
import { useRouter } from 'next/navigation';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import PizzaTracker, { isActiveOrderStatus } from '@/components/PizzaTracker';
import { reorderOrderItems } from '@/lib/reorder';

interface Topping {
  topping_id: number;
  topping_name: string;
}

interface OrderItemTopping {
  topping_price: number;
  quantity: number;
  topping?: Topping;
}

interface Dish {
  dish_name: string;
  image: string;
}

interface Size {
  size_name: string;
}

interface Crust {
  crust_name: string;
}

interface DishPrice {
  dish?: Dish;
  size?: Size;
  crust?: Crust;
}

interface Combo {
  combo_name: string;
  image_combo: string;
}

interface OrderItemHalf {
  dish?: Dish;
  order_item_toppings?: OrderItemTopping[];
}

interface OrderItemCombo {
  dish_price?: DishPrice;
  is_half_half: boolean;
  toppings?: OrderItemTopping[];
  halves?: OrderItemHalf[];
}

interface OrderItem {
  order_item_id: number;
  type: string;
  quantity: number;
  order_price: number;
  order_item_note: string | null;
  combo_id?: number | null;
  is_half_half?: boolean | null;
  dish_price?: DishPrice;
  combo?: Combo;
  toppings?: OrderItemTopping[];
  combos?: OrderItemCombo[];
  halves?: OrderItemHalf[];
}

interface Order {
  order_id: number;
  payment_method: string;
  payment_status: string;
  total_price_dish: number;
  shipping_fee: number;
  discount_amount: number;
  total_order: number;
  order_note: string | null;
  created_at: string;
  order_status: string;
  order_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_time: string | null;
  estimated_delivery_time?: string | null;
  confirmed_at?: string | null;
  preparing_at?: string | null;
  shipped_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  user_address?: {
    address_line: string;
  };
  items: OrderItem[];
  store?: {
    store_name: string;
    address: string;
  };
}

export default function OrderLookupPage() {
  const { theme, openCart, lang, td } = useUI();
  const { showDanger, showAlert } = useDialog();
  const isDark = theme === 'dark';
  const isEn = lang === 'en';
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // Restore previous lookup from localStorage if exists
  useEffect(() => {
    const savedPhone = localStorage.getItem('lookup_phone_number');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      handleLookup(savedPhone);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const silentRefresh = useCallback(async (phoneToQuery: string) => {
    const trimmed = phoneToQuery.trim();
    if (!trimmed) return;
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/orders/phone/${trimmed}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      }
    } catch {
      // Bỏ qua lỗi mạng khi tự động làm mới nền
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Tự động làm mới mỗi 12 giây nếu có đơn hàng đang xử lý trực tiếp
  const hasActiveOrder = orders.some((o) => isActiveOrderStatus(o.order_status));
  useEffect(() => {
    if (!hasActiveOrder || !phoneNumber.trim()) return;
    const timer = setInterval(() => {
      silentRefresh(phoneNumber);
    }, 12000);
    return () => clearInterval(timer);
  }, [hasActiveOrder, phoneNumber, silentRefresh]);

  const handleReorder = async (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(order.order_id);
    try {
      const count = await reorderOrderItems(order.items);
      if (count > 0) {
        openCart();
        router.push('/');
      }
    } catch (err) {
      console.error('Error reordering items:', err);
    } finally {
      setReorderingId(null);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    const ok = await showDanger(
      'Đơn hàng đang chờ xác nhận sẽ được hủy ngay lập tức.',
      `Hủy đơn hàng #PIZZA-${order.order_id}?`
    );
    if (!ok) return;

    setCancellingId(order.order_id);
    try {
      const res = await fetch(`${API_BASE}/orders/${order.order_id}/cancel`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.order_id === order.order_id
              ? { ...o, order_status: 'cancelled', cancelled_at: new Date().toISOString() }
              : o
          )
        );
      } else {
        await showAlert(
          json.message || 'Đơn hàng đã chuyển trạng thái xử lý, vui lòng liên hệ hotline.',
          'Không thể hủy đơn'
        );
      }
    } catch {
      await showAlert(
        'Không thể kết nối máy chủ để hủy đơn. Vui lòng thử lại.',
        'Lỗi kết nối'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleLookup = async (phoneToQuery = phoneNumber) => {
    const trimmedPhone = phoneToQuery.trim();
    if (!trimmedPhone) {
      setError('Vui lòng nhập số điện thoại để tra cứu đơn hàng');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    setOrders([]);

    try {
      const res = await fetch(`${API_BASE}/orders/phone/${trimmedPhone}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(json.data);
          if (json.data.length > 0) {
            setExpandedOrders({ [json.data[0].order_id]: true });
          }
          localStorage.setItem('lookup_phone_number', trimmedPhone);
        } else {
          setError(json.message || 'Không tìm thấy đơn hàng nào khớp với số điện thoại này');
        }
      } else {
        setError('Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error looking up orders:', err);
      setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/30 text-amber-500 text-[11px] font-black uppercase tracking-wider">
            {isEn ? 'Pending' : 'Chờ xác nhận'}
          </span>
        );
      case 'confirmed':
      case 'preparing':
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/12 border border-blue-500/30 text-blue-500 text-[11px] font-black uppercase tracking-wider">
            {isEn ? 'Preparing' : 'Đang chuẩn bị'}
          </span>
        );
      case 'shipped':
      case 'delivering':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-500/12 border border-indigo-500/30 text-indigo-500 text-[11px] font-black uppercase tracking-wider">
            {isEn ? 'Out for Delivery' : 'Đang giao hàng'}
          </span>
        );
      case 'arrived':
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-emerald-500 text-[11px] font-black uppercase tracking-wider">
            {isEn ? 'Completed' : 'Hoàn thành'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/12 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-wider">
            {isEn ? 'Cancelled' : 'Đã hủy'}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-zinc-500/12 border border-zinc-500/30 text-zinc-400 text-[11px] font-black uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const getStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'cancelled') return -1;
    if (s === 'pending') return 0;
    if (s === 'confirmed' || s === 'preparing' || s === 'processing') return 1;
    if (s === 'shipped' || s === 'delivering') return 2;
    if (s === 'arrived' || s === 'completed') return 3;
    return 0;
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} • ${day}/${month}/${year}`;
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0e0c0a] text-white' : 'bg-[#f6f6f7] text-zinc-900'}`}>
      <HeaderClient storeName="Pizza&PastaInn" />

      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-14 w-full select-none">

        {/* Page Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className={`text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {isEn ? 'TRACK YOUR ORDER' : 'TRA CỨU ĐƠN HÀNG'}
          </h1>
          <p className={`text-xs md:text-sm max-w-xl mx-auto font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isEn
              ? 'Enter the phone number used when placing your order to check live status and invoice details.'
              : 'Nhập số điện thoại bạn đã dùng khi đặt bánh để xem tiến trình xử lý và chi tiết hóa đơn.'}
          </p>
        </div>

        {/* Center Search Panel */}
        <div className={`max-w-2xl mx-auto border rounded-3xl p-6 md:p-7 relative overflow-hidden mb-10 transition-all duration-300 ${
          isDark
            ? 'bg-[#161311] border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.45)]'
            : 'bg-white border-zinc-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
        }`}>
          <div className="relative z-10 flex flex-col space-y-3.5">
            <label htmlFor="lookup-phone-input" className={`text-xs font-extrabold tracking-wider uppercase ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {isEn ? 'Order Phone Number' : 'Số điện thoại đặt hàng'}
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <Phone size={18} />
                </span>
                <input
                  id="lookup-phone-input"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={isEn ? 'e.g., 0901234567...' : 'Ví dụ: 0901234567...'}
                  className={`w-full h-12 border rounded-xl pl-11 pr-10 text-sm font-semibold focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10 focus:border-[#f5c043] focus:ring-2 focus:ring-[#f5c043]/15 text-white placeholder-zinc-500'
                      : 'bg-zinc-50 border-zinc-200 focus:border-[#007a3f] focus:ring-2 focus:ring-[#007a3f]/15 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
                {phoneNumber && (
                  <button
                    type="button"
                    onClick={() => setPhoneNumber('')}
                    aria-label={isEn ? 'Clear phone number' : 'Xóa số điện thoại'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70'
                    }`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`h-12 font-extrabold text-xs tracking-wider uppercase px-6 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-55 cursor-pointer ${
                  isDark
                    ? 'bg-[#f5c043] hover:bg-[#eab308] text-zinc-950'
                    : 'bg-[#007a3f] hover:bg-[#006332] text-white'
                }`}
              >
                {loading ? (
                  <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-950 border-t-transparent' : 'border-white border-t-transparent'}`} />
                ) : (
                  <Search size={16} />
                )}
                <span>{isEn ? 'Track Now' : 'Tra cứu ngay'}</span>
              </button>
            </form>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-semibold pt-1">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-5">
          {loading && (
            <div className="text-center py-14 flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-3 border-[#f5c043] border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                {isEn ? 'Loading your orders...' : 'Đang tải danh sách đơn hàng...'}
              </p>
            </div>
          )}

          {searched && !loading && orders.length === 0 && !error && (
            <div className={`border border-dashed rounded-3xl py-14 px-6 text-center space-y-3 ${
              isDark ? 'bg-[#161311]/60 border-white/10' : 'bg-white border-zinc-200'
            }`}>
              <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center mx-auto ${
                isDark ? 'bg-white/[0.04] border-white/[0.08] text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
              }`}>
                <Package size={26} />
              </div>
              <div className="space-y-1">
                <h4 className={`text-base font-extrabold uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {isEn ? 'No orders found' : 'Không tìm thấy đơn hàng'}
                </h4>
                <p className={`text-xs font-medium max-w-sm mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isEn ? (
                    <>
                      No orders were placed with phone number <strong className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{phoneNumber}</strong>. Please double-check your phone number.
                    </>
                  ) : (
                    <>
                      Chưa có đơn hàng nào được đặt bằng số điện thoại <strong className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{phoneNumber}</strong>. Vui lòng kiểm tra lại số điện thoại của bạn.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {orders.map((order) => {
            const isExpanded = !!expandedOrders[order.order_id];

            return (
              <div
                key={order.order_id}
                className={`transition-all duration-300 rounded-3xl overflow-hidden border ${
                  isDark
                    ? `bg-[#161311] ${isExpanded ? 'border-white/15 shadow-2xl' : 'border-white/[0.07] hover:border-white/12 shadow-md'}`
                    : `bg-white ${isExpanded ? 'border-zinc-300 shadow-xl' : 'border-zinc-200 hover:border-zinc-300 shadow-sm'}`
                }`}
              >
                {/* Order Summary Header (Clickable to Expand) */}
                <div
                  onClick={() => toggleExpand(order.order_id)}
                  className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors select-none ${
                    isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center shrink-0 ${
                      isDark
                        ? 'bg-white/[0.04] border-white/[0.08] text-[#f5c043]'
                        : 'bg-[#007a3f]/10 border-[#007a3f]/20 text-[#007a3f]'
                    }`}>
                      <Package size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className={`text-base font-black uppercase tracking-wide ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {isEn ? `Order #PIZZA-${order.order_id}` : `Đơn hàng #PIZZA-${order.order_id}`}
                        </h4>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {order.order_status.toLowerCase() === 'completed' && order.completed_at ? (
                          <>{isEn ? 'Completed at:' : 'Hoàn thành lúc:'} {formatDateTime(order.completed_at)}</>
                        ) : (
                          <>{isEn ? 'Placed at:' : 'Đặt lúc:'} {formatDateTime(order.created_at)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-zinc-500 font-extrabold tracking-wider uppercase block">
                        {isEn ? 'Total Payment' : 'Tổng thanh toán'}
                      </span>
                      <span className={`text-lg font-black tracking-wide ${isDark ? 'text-[#f5c043]' : 'text-[#ee2828]'}`}>
                        {formatPrice(order.total_order)}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label={isExpanded ? (isEn ? 'Collapse details' : 'Thu gọn chi tiết') : (isEn ? 'Expand details' : 'Mở rộng chi tiết')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.05] border-white/10 hover:bg-white/10 text-zinc-300'
                          : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className={`border-t p-6 md:p-7 space-y-7 animate-fadeIn ${
                    isDark
                      ? 'border-white/[0.08] bg-[#110e0c]'
                      : 'border-zinc-200 bg-zinc-50/60'
                  }`}>

                    {/* Live 5-Step Pizza Tracker */}
                    <PizzaTracker
                      order={order}
                      isDark={isDark}
                      onRefresh={() => silentRefresh(phoneNumber)}
                      refreshing={refreshing}
                    />

                    {/* Customer & Delivery Specs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3.5">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          isDark ? 'text-[#f5c043] border-white/10' : 'text-[#007a3f] border-zinc-200'
                        }`}>
                          {isEn ? 'Recipient & Delivery Info' : 'Thông tin người nhận & giao hàng'}
                        </h5>
                        <div className="space-y-2.5 text-[13px] font-medium">
                          <div className={`flex items-start gap-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <User size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                            <span>
                              {isEn ? 'Recipient:' : 'Người nhận:'}{' '}
                              <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>{order.customer_name}</strong>
                            </span>
                          </div>
                          <div className={`flex items-start gap-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <Phone size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                            <span>
                              {isEn ? 'Phone:' : 'Điện thoại:'}{' '}
                              <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>{order.customer_phone}</strong>
                            </span>
                          </div>
                          {order.customer_email && (
                            <div className={`flex items-start gap-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                              <Mail size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                              <span>Email: <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{order.customer_email}</span></span>
                            </div>
                          )}
                          <div className={`flex items-start gap-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <MapPin size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                            <span>
                              {order.order_type === 'delivery' ? (
                                <>
                                  {isEn ? 'Delivery Address:' : 'Địa chỉ giao:'}{' '}
                                  <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>
                                    {order.user_address?.address_line || (isEn ? 'Home Delivery' : 'Giao hàng tận nơi')}
                                  </strong>
                                </>
                              ) : (
                                <>
                                  {isEn ? 'Order Type:' : 'Hình thức:'}{' '}
                                  <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>
                                    {isEn ? 'Store Pickup' : 'Nhận tại cửa hàng'}
                                  </strong>
                                  {order.store?.address && (
                                    <span className={`block mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                      {isEn ? 'Branch:' : 'Chi nhánh:'} {order.store.store_name} - {order.store.address}
                                    </span>
                                  )}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          isDark ? 'text-[#f5c043] border-white/10' : 'text-[#007a3f] border-zinc-200'
                        }`}>
                          {isEn ? 'Payment & Timing' : 'Thanh toán & thời gian'}
                        </h5>
                        <div className="space-y-2.5 text-[13px] font-medium">
                          <div className={`flex items-start gap-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <CreditCard size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                            <span>
                              {isEn ? 'Method:' : 'Phương thức:'}{' '}
                              <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>
                                {order.payment_method === 'vietqr'
                                  ? isEn
                                    ? 'VietQR Bank Transfer'
                                    : 'Chuyển khoản VietQR'
                                  : isEn
                                    ? 'Cash on Delivery (COD)'
                                    : 'Thanh toán khi nhận hàng (COD)'}
                              </strong>
                            </span>
                          </div>
                          <div className={`flex items-start gap-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <Clock size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                            <span>
                              {isEn ? 'Payment Status:' : 'Trạng thái thanh toán:'}{' '}
                              <strong className={order.payment_status === 'paid' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                                {order.payment_status === 'paid'
                                  ? isEn
                                    ? 'Paid'
                                    : 'Đã thanh toán'
                                  : isEn
                                    ? 'Unpaid'
                                    : 'Chưa thanh toán'}
                              </strong>
                            </span>
                          </div>
                          <div className={`flex items-start gap-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            <Calendar size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                            <span>
                              {order.pickup_time ? (
                                <>{isEn ? 'Pickup Time:' : 'Giờ hẹn nhận:'} <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>{formatDateTime(order.pickup_time)}</strong></>
                              ) : order.estimated_delivery_time ? (
                                <>{isEn ? 'Est. Delivery:' : 'Dự kiến giao:'} <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>{formatDateTime(order.estimated_delivery_time)}</strong></>
                              ) : (
                                <>{isEn ? 'Delivery Time:' : 'Thời gian giao:'} <strong className={isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold'}>{isEn ? 'Standard (30 - 45 mins)' : 'Giao ngay (30 - 45 phút)'}</strong></>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Note */}
                    {order.order_note && (
                      <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                        isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-zinc-200'
                      }`}>
                        <FileText size={16} className="text-zinc-500 mt-0.5 shrink-0" />
                        <div className="text-xs font-medium text-left">
                          <span className={`block uppercase tracking-wider font-extrabold mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {isEn ? 'Order Note:' : 'Ghi chú đơn hàng:'}
                          </span>
                          <p className={`leading-relaxed italic ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>&ldquo;{order.order_note}&rdquo;</p>
                        </div>
                      </div>
                    )}

                    {/* Order Items & Totals Section */}
                    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 border-t ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>

                      {/* Left: Dishes List */}
                      <div className="lg:col-span-7 space-y-3.5">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          isDark ? 'text-[#f5c043] border-white/10' : 'text-[#007a3f] border-zinc-200'
                        }`}>
                          {isEn ? 'Ordered Items' : 'Danh sách món đã đặt'}
                        </h5>

                        <div className={`divide-y border p-4 md:p-5 rounded-2xl ${
                          isDark
                            ? 'divide-white/10 bg-white/[0.02] border-white/[0.06]'
                            : 'divide-zinc-100 bg-white border-zinc-200'
                        }`}>
                          {order.items.map((item) => {
                            let dishName = '';
                            let imageSrc = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
                            let itemSpec = '';

                            const isCombo = !!item.combo_id;
                            const isHalfHalf = !!item.is_half_half;

                            if (isCombo) {
                              dishName = item.combo?.combo_name || `Combo #${item.combo_id}`;
                              const comboImg = item.combo?.image_combo;
                              imageSrc = comboImg
                                ? (comboImg.startsWith('http') ? comboImg : `${BACKEND_URL}${comboImg}`)
                                : 'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=100&auto=format&fit=crop';
                            } else if (isHalfHalf) {
                              dishName = isEn ? 'Half & Half Pizza' : 'Pizza Nửa - Nửa (Half & Half)';
                              imageSrc = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=100&auto=format&fit=crop';
                              const size = item.dish_price?.size?.size_name;
                              const crust = item.dish_price?.crust?.crust_name;
                              itemSpec = `${size ? `${isEn ? 'Size:' : 'Cỡ:'} ${td(size)}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` • ${isEn ? 'Crust:' : 'Đế:'} ${td(crust)}` : ''}`;
                            } else {
                              dishName = td(item.dish_price?.dish?.dish_name || (isEn ? 'Dish' : 'Món ăn'));
                              const dishImg = item.dish_price?.dish?.image;
                              imageSrc = dishImg
                                ? (dishImg.startsWith('http') ? dishImg : `${BACKEND_URL}${dishImg}`)
                                : imageSrc;
                              const isPizza = dishName.toLowerCase().includes('pizza');
                              if (isPizza) {
                                const size = item.dish_price?.size?.size_name;
                                const crust = item.dish_price?.crust?.crust_name;
                                itemSpec = `${size ? `${isEn ? 'Size:' : 'Cỡ:'} ${td(size)}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` • ${isEn ? 'Crust:' : 'Đế:'} ${td(crust)}` : ''}`;
                              }
                            }

                            return (
                              <div key={item.order_item_id} className="py-3.5 first:pt-0 last:pb-0 flex gap-3.5">
                                <div className={`relative w-14 h-14 rounded-full overflow-hidden border shrink-0 shadow-sm ${
                                  isDark ? 'border-white/10' : 'border-zinc-200'
                                }`}>
                                  <Image
                                    src={imageSrc}
                                    alt={dishName}
                                    fill
                                    className="object-cover"
                                    unoptimized={shouldBypassNextImageOptimization(imageSrc)}
                                  />
                                </div>

                                <div className="flex-1 flex flex-col justify-start text-left">
                                  <div className="space-y-0.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className={`font-extrabold text-sm md:text-[15px] leading-snug ${
                                        isDark ? 'text-white' : 'text-zinc-900'
                                      }`}>
                                        {dishName}
                                      </h4>
                                      <span className={`text-xs font-extrabold whitespace-nowrap ${isDark ? 'text-[#f5c043]' : 'text-[#ee2828]'}`}>
                                        {formatPrice(item.order_price * item.quantity)}
                                      </span>
                                    </div>
                                    <div className={`text-[11.5px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                      {isEn ? `Quantity: x${item.quantity}` : `Số lượng: x${item.quantity}`}
                                    </div>

                                    {itemSpec && (
                                      <p className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {itemSpec}
                                      </p>
                                    )}

                                    {/* Render combo details */}
                                    {isCombo && item.combos && item.combos.length > 0 && (
                                      <div className={`mt-2 pl-3 border-l-2 text-xs space-y-1.5 ${
                                        isDark ? 'border-[#f5c043]/30 text-zinc-400' : 'border-[#007a3f]/30 text-zinc-600'
                                      }`}>
                                        {item.combos.map((combItem, cIdx) => {
                                          const cName = td(combItem.dish_price?.dish?.dish_name || (isEn ? 'Dish' : 'Món ăn'));
                                          const cSize = combItem.dish_price?.size?.size_name;
                                          const cCrust = combItem.dish_price?.crust?.crust_name;
                                          const cIsPizza = cName.toLowerCase().includes('pizza');
                                          const cSpec = cIsPizza && (cSize || cCrust)
                                            ? `${cSize ? `${isEn ? 'Size:' : 'Cỡ:'} ${td(cSize)}` : ''}${cCrust && cCrust.toLowerCase() !== 'none' ? ` • ${isEn ? 'Crust:' : 'Đế:'} ${td(cCrust)}` : ''}`
                                            : '';
                                          return (
                                            <div key={cIdx} className="space-y-0.5">
                                              <p className={`font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                                {cIdx + 1}. {combItem.is_half_half ? (isEn ? 'Half & Half Pizza' : 'Pizza Nửa - Nửa') : cName}
                                              </p>

                                              <div className="pl-3 text-[11px] text-zinc-500 space-y-0.5">
                                                {cSpec && <p className="font-semibold">{cSpec}</p>}

                                                {combItem.is_half_half && combItem.halves && (
                                                  <div className="pl-2 border-l border-blue-400/30 py-0.5 space-y-1">
                                                    {combItem.halves.map((ch, chIdx) => (
                                                      <div key={chIdx} className="text-[11px]">
                                                        <span className="text-zinc-500 font-medium">{isEn ? `Half ${chIdx + 1}: ` : `Nửa ${chIdx + 1}: `}</span>
                                                        <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{td(ch.dish?.dish_name || '')}</span>
                                                        {ch.order_item_toppings && ch.order_item_toppings.length > 0 && (
                                                          <span className="block pl-3 text-[10px] text-zinc-500 italic">
                                                            + Topping: {ch.order_item_toppings.map(t => `${td(t.topping?.topping_name || '')} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                          </span>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}

                                                {combItem.toppings && combItem.toppings.length > 0 && (
                                                  <p className="text-zinc-500 italic">
                                                    + Topping: {combItem.toppings.map(t => `${td(t.topping?.topping_name || '')} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Render half-half details */}
                                    {isCombo ? null : (isHalfHalf && item.halves && item.halves.length > 0 && (
                                      <div className={`mt-2 pl-3 border-l-2 text-xs space-y-1.5 ${isDark ? 'border-blue-500/30 text-zinc-400' : 'border-blue-400/30 text-zinc-600'}`}>
                                        {item.halves.map((half, hIdx) => (
                                          <div key={hIdx} className="text-xs">
                                            <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{isEn ? `Half ${hIdx + 1}: ` : `Nửa ${hIdx + 1}: `}</span>
                                            <span className={`font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{td(half.dish?.dish_name || '')}</span>
                                            {half.order_item_toppings && half.order_item_toppings.length > 0 && (
                                              <span className="text-zinc-500 block ml-3 italic">
                                                + Topping: {half.order_item_toppings.map(t => `${td(t.topping?.topping_name || '')} (+${formatPrice(t.topping_price)})`).join(', ')}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ))}

                                    {/* Render regular toppings */}
                                    {!isCombo && !isHalfHalf && item.toppings && item.toppings.length > 0 && (
                                      <p className="text-[11px] text-zinc-500 font-medium pt-0.5">
                                        + Topping: {item.toppings.map((t) => `${td(t.topping?.topping_name || '')} (+${formatPrice(t.topping_price)})`).join(', ')}
                                      </p>
                                    )}
                                    {isHalfHalf && item.toppings && item.toppings.length > 0 && (
                                      <p className="text-[11px] text-zinc-500 font-medium pt-0.5">
                                        + Topping: {item.toppings.map((t) => `${td(t.topping?.topping_name || '')} (+${formatPrice(t.topping_price)})`).join(', ')}
                                      </p>
                                    )}

                                    {item.order_item_note && (
                                      <p className={`text-[10.5px] border px-2 py-0.5 mt-1.5 rounded inline-block font-medium ${
                                        isDark
                                          ? 'bg-[#9f280a]/20 text-[#ff8b70] border-[#9f280a]/30'
                                          : 'bg-red-50 text-red-600 border-red-200'
                                      }`}>
                                        {isEn ? 'Note:' : 'Ghi chú món:'} {item.order_item_note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Totals Summary */}
                      <div className="lg:col-span-5 flex flex-col justify-start space-y-3.5">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          isDark ? 'text-[#f5c043] border-white/10' : 'text-[#007a3f] border-zinc-200'
                        }`}>
                          {isEn ? 'Payment Summary' : 'Tóm tắt thanh toán'}
                        </h5>

                        <div className={`p-5 rounded-2xl space-y-3 text-xs md:text-sm font-semibold border ${
                          isDark
                            ? 'bg-white/[0.02] border-white/[0.06]'
                            : 'bg-white border-zinc-200'
                        }`}>
                          <div className={`flex justify-between items-center gap-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            <span>{isEn ? 'Subtotal:' : 'Tạm tính:'}</span>
                            <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{formatPrice(order.total_price_dish)}</span>
                          </div>
                          <div className={`flex justify-between items-center gap-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            <span>{isEn ? 'Delivery Fee:' : 'Phí giao hàng:'}</span>
                            {order.shipping_fee > 0 ? (
                              <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{formatPrice(order.shipping_fee)}</span>
                            ) : (
                              <span className="text-emerald-500 font-bold">{isEn ? 'Free' : 'Miễn phí'}</span>
                            )}
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between items-center text-red-500 gap-4">
                              <span>{isEn ? 'Discount:' : 'Giảm giá:'}</span>
                              <span>-{formatPrice(order.discount_amount)}</span>
                            </div>
                          )}
                          <div className={`flex justify-between items-center text-base font-black pt-3 border-t gap-4 ${
                            isDark ? 'text-white border-white/10' : 'text-zinc-900 border-zinc-200'
                          }`}>
                            <span className={isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'}>
                              {isEn ? 'TOTAL:' : 'TỔNG CỘNG:'}
                            </span>
                            <span className={`tracking-wide text-lg ${isDark ? 'text-[#f5c043]' : 'text-[#ee2828]'}`}>{formatPrice(order.total_order)}</span>
                          </div>
                        </div>

                        {order.payment_method === 'vietqr' &&
                          order.payment_status !== 'paid' &&
                          order.order_status.toLowerCase() !== 'cancelled' && (
                            <div
                              className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2.5 ${
                                isDark
                                  ? 'bg-[#1a1408] border-[#f5c043]/25 text-zinc-200'
                                  : 'bg-amber-50/70 border-amber-200 text-zinc-800'
                              }`}
                            >
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500">
                                {isEn ? 'Scan VietQR to Pay Now' : 'Quét mã VietQR để thanh toán ngay'}
                              </span>
                              <div className="w-44 h-44 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm">
                                <img
                                  src={`https://qr.sepay.vn/img?acc=0944368230&bank=MB&amount=${order.total_order}&des=PIZZA_INN_${order.order_id}`}
                                  alt={`VietQR #${order.order_id}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="text-[11px] leading-relaxed">
                                <p className="font-bold">MB Bank • 0944368230 • PIZZA&amp;PASTA INN</p>
                                <p>
                                  {isEn ? 'Transfer Note:' : 'Nội dung CK:'} <strong className="font-mono">PIZZA_INN_{order.order_id}</strong>
                                </p>
                              </div>
                            </div>
                          )}

                        {/* Action Buttons: Reorder / Review / Cancel */}
                        <div className="space-y-2.5 pt-1">
                          <button
                            type="button"
                            disabled={reorderingId === order.order_id}
                            onClick={() => handleReorder(order)}
                            className={`w-full font-extrabold text-xs tracking-wider uppercase py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                              isDark
                                ? 'bg-[#ee2828] hover:bg-[#d82020] text-white'
                                : 'bg-[#ee2828] hover:bg-[#d82020] text-white'
                            }`}
                          >
                            <RotateCcw size={15} className={reorderingId === order.order_id ? 'animate-spin' : ''} />
                            <span>
                              {reorderingId === order.order_id
                                ? isEn
                                  ? 'Adding to cart...'
                                  : 'Đang thêm vào giỏ...'
                                : isEn
                                  ? 'Reorder This Order'
                                  : 'Đặt lại đơn này'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              printOrderReceipt({
                                order_id: order.order_id,
                                created_at: order.created_at,
                                customer_name: order.customer_name,
                                customer_phone: order.customer_phone,
                                customer_email: order.customer_email,
                                customer_address: order.user_address?.address_line || '',
                                order_type: order.order_type,
                                store_name: order.store?.store_name || 'Pizza & Pasta Inn',
                                payment_method: order.payment_method,
                                payment_status: order.payment_status,
                                order_status: order.order_status,
                                order_note: order.order_note,
                                subtotal: order.total_price_dish,
                                shipping_fee: order.shipping_fee,
                                discount_amount: order.discount_amount || 0,
                                total_order: order.total_order,
                                items: order.items.map((it) => ({
                                  name: it.combo_id
                                    ? it.combo?.combo_name || `Combo #${it.combo_id}`
                                    : it.is_half_half
                                    ? 'Pizza Nửa - Nửa (Half & Half)'
                                    : it.dish_price?.dish?.dish_name || 'Món ăn',
                                  quantity: it.quantity,
                                  totalPrice: it.order_price * it.quantity,
                                  spec: [
                                    it.dish_price?.size?.size_name ? `Cỡ: ${it.dish_price.size.size_name}` : '',
                                    it.dish_price?.crust?.crust_name &&
                                    it.dish_price.crust.crust_name.toLowerCase() !== 'none'
                                      ? `Đế: ${it.dish_price.crust.crust_name}`
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' • '),
                                  subDetails: it.combos
                                    ? it.combos.map((c) =>
                                        c.is_half_half
                                          ? 'Pizza Nửa - Nửa'
                                          : c.dish_price?.dish?.dish_name || 'Món trong combo'
                                      )
                                    : it.halves
                                    ? it.halves.map((h, i) => `Nửa ${i + 1}: ${h.dish?.dish_name || ''}`)
                                    : [],
                                  note: it.order_item_note,
                                })),
                              })
                            }
                            className={`w-full font-extrabold text-xs tracking-wider uppercase py-3 rounded-xl border transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                              isDark
                                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/15 text-zinc-200'
                                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                            }`}
                          >
                            <Printer size={14} />
                            <span>{isEn ? 'Print / Save Receipt (PDF)' : 'In / Lưu biên lai (PDF)'}</span>
                          </button>

                          {(order.order_status.toLowerCase() === 'completed' || order.order_status.toLowerCase() === 'arrived') && (
                            <button
                              type="button"
                              onClick={() => router.push(`/reviews?order_id=${order.order_id}`)}
                              className={`w-full font-extrabold text-xs tracking-wider uppercase py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                                isDark
                                  ? 'bg-[#f5c043] hover:bg-[#eab308] text-zinc-950'
                                  : 'bg-[#007a3f] hover:bg-[#006332] text-white'
                              }`}
                            >
                              <span>{isEn ? 'Rate This Order' : 'Đánh giá đơn hàng'}</span>
                            </button>
                          )}

                          {order.order_status.toLowerCase() === 'pending' && (
                            <button
                              type="button"
                              disabled={cancellingId === order.order_id}
                              onClick={() => handleCancelOrder(order)}
                              className={`w-full font-bold text-xs tracking-wider uppercase py-3 rounded-xl border transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                                isDark
                                  ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                              }`}
                            >
                              <Ban size={14} />
                              <span>
                                {cancellingId === order.order_id
                                  ? isEn
                                    ? 'Cancelling...'
                                  : 'Đang hủy đơn...'
                                  : isEn
                                    ? 'Cancel Order'
                                    : 'Hủy đơn hàng'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <div className="px-6">
        <Footer />
      </div>
    </div>
  );
}
