'use client';

import React, { useState, useEffect } from 'react';
import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Search, Phone, Calendar, Clock, CreditCard, Truck, Package, AlertCircle, ChevronDown, ChevronUp, MapPin, User, Mail, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useUI } from '@/components/UIProvider';
import { useRouter } from 'next/navigation';

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
  user_address?: {
    address_line: string;
  };
  items: OrderItem[];
}

export default function OrderLookupPage() {
  const { theme } = useUI();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
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
  }, []);

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleLookup = async (phoneToQuery = phoneNumber) => {
    const trimmedPhone = phoneToQuery.trim();
    if (!trimmedPhone) {
      setError('Please enter a phone number to lookup');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    setOrders([]);

    try {
      const res = await fetch(`http://localhost:4000/api/orders/phone/${trimmedPhone}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(json.data);
          // Auto-expand the first order for convenient viewing
          if (json.data.length > 0) {
            setExpandedOrders({ [json.data[0].order_id]: true });
          }
          // Save phone to localStorage for easy revisit
          localStorage.setItem('lookup_phone_number', trimmedPhone);
        } else {
          setError(json.message || 'No matching orders found');
        }
      } else {
        setError('An error occurred while connecting to the server. Please try again later.');
      }
    } catch (err) {
      console.error('Error looking up orders:', err);
      setError('Could not connect to the server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.08)]">
            Pending Approval
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.08)]">
            Confirmed
          </span>
        );
      case 'preparing':
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.08)]">
            Preparing
          </span>
        );
      case 'shipped':
      case 'delivering':
        return (
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.08)]">
            Out for Delivery
          </span>
        );
      case 'arrived':
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.08)]">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.08)]">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/30 text-zinc-400 text-[11px] font-black uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-800'}`}>
      <header className="bg-[#121424]/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
        <HeaderClient storeName="Pizza&PastaInn" />
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-12 w-full select-none">

        {/* Page Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="text-[#f5c043] text-xs font-black tracking-[0.2em] uppercase block">
            ORDER TRACKING
          </span>
          <h1 className={`text-3xl md:text-5xl font-black tracking-wide uppercase leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            ORDER LOOKUP
          </h1>
          <div className="w-16 h-1 bg-[#f5c043] mx-auto rounded-full mt-4"></div>
        </div>

        {/* Center Search Panel */}
        <div className={`border rounded-[28px] p-6 md:p-8 shadow-2xl relative overflow-hidden mb-12 transition-all duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
          {/* Subtle gold glow behind search */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#f5c043]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col space-y-4">
            <h3 className={`text-lg font-bold tracking-wide uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              ENTER ORDER PHONE NUMBER
            </h3>
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
              Please enter the phone number you used to place your order. We will display all your order history, processing status, and items directly.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="flex flex-col md:flex-row gap-3 pt-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Phone size={18} />
                </span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0901234567..."
                  className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#f5c043]/40 text-zinc-200 placeholder-zinc-750' : 'bg-gray-50 border-gray-200 focus:border-[#007a3f]/40 text-gray-800 placeholder-gray-400'}`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`font-black text-xs tracking-widest uppercase px-8 py-4 md:py-0 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-55 cursor-pointer ${theme === 'dark' ? 'bg-[#f5c043] hover:bg-[#e5b33c] text-black' : 'bg-[#007a3f] hover:bg-[#006030] text-white'}`}
              >
                {loading ? (
                  <span className={`w-4 h-4 border-2 rounded-full animate-spin ${theme === 'dark' ? 'border-black border-t-transparent' : 'border-white border-t-transparent'}`}></span>
                ) : (
                  <Search size={16} />
                )}
                <span>LOOKUP</span>
              </button>
            </form>

            {error && (
              <div className="flex items-center gap-2.5 text-red-500 text-xs font-semibold pt-1">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-16 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-[#f5c043] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">FETCHING ORDERS...</p>
            </div>
          )}

          {searched && !loading && orders.length === 0 && !error && (
            <div className={`border border-dashed rounded-[28px] py-16 px-6 text-center space-y-4 ${theme === 'dark' ? 'bg-[#121212]/50 border-white/10' : 'bg-white border-gray-200'}`}>
              <div className={`w-16 h-16 border rounded-full flex items-center justify-center mx-auto shadow-md ${theme === 'dark' ? 'bg-white/[0.03] border-white/[0.06] text-zinc-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                <Package size={28} />
              </div>
              <div className="space-y-1">
                <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>NO ORDERS FOUND</h4>
                <p className={`text-xs font-medium max-w-sm mx-auto leading-relaxed ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                  No order history found matching the phone number <strong className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>{phoneNumber}</strong>. Please double check the number you entered.
                </p>
              </div>
            </div>
          )}

          {orders.map((order) => {
            const isExpanded = !!expandedOrders[order.order_id];
            return (
              <div
                key={order.order_id}
                className={`transition-all duration-300 rounded-[28px] overflow-hidden border ${
                  theme === 'dark' 
                    ? `bg-[#121212] ${isExpanded ? 'border-white/[0.12] shadow-2xl' : 'border-white/[0.04] hover:border-white/[0.08] shadow-md'}` 
                    : `bg-white ${isExpanded ? 'border-gray-300 shadow-2xl' : 'border-gray-200 hover:border-gray-300 shadow-md'}`
                }`}
              >
                {/* Order Summary Header (Clickable to Expand) */}
                <div
                  onClick={() => toggleExpand(order.order_id)}
                  className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors select-none ${
                    theme === 'dark' ? 'hover:bg-white/[0.01]' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center ${
                      theme === 'dark' 
                        ? 'bg-white/[0.03] border-white/[0.06] text-[#f5c043]' 
                        : 'bg-gray-50 border-gray-200 text-[#007a3f]'
                    }`}>
                      <Package size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className={`text-base font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          ORDER ID: #PIZZA-{order.order_id}
                        </h4>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <p className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>
                        Placed on: {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-zinc-500 font-extrabold tracking-wider uppercase block">TOTAL AMOUNT</span>
                      <span className={`text-lg font-black tracking-wide ${theme === 'dark' ? 'text-[#f5c043]' : 'text-[#007a3f]'}`}>
                        {formatPrice(order.total_order)}
                      </span>
                    </div>

                    <button className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08] text-zinc-400' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500'
                    }`}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className={`border-t p-6 md:p-8 space-y-8 animate-fadeIn ${
                    theme === 'dark' 
                      ? 'border-white/[0.06] bg-[#0d0d0d]/40' 
                      : 'border-gray-150 bg-gray-50/50'
                  }`}>

                    {/* Customer & Delivery Specs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-4">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          theme === 'dark' ? 'text-[#f5c043] border-white/5' : 'text-[#007a3f] border-gray-200'
                        }`}>
                          CUSTOMER & DELIVERY INFO
                        </h5>
                        <div className="space-y-3 font-medium">
                          <div className={`flex items-start gap-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            <span className="text-zinc-500 mt-0.5"><User size={15} /></span>
                            <span>Name: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>{order.customer_name}</strong></span>
                          </div>
                          <div className={`flex items-start gap-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            <span className="text-zinc-500 mt-0.5"><Phone size={15} /></span>
                            <span>Phone: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>{order.customer_phone}</strong></span>
                          </div>
                          {order.customer_email && (
                            <div className={`flex items-start gap-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                              <span className="text-zinc-500 mt-0.5"><Mail size={15} /></span>
                              <span>Email: <span className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}>{order.customer_email}</span></span>
                            </div>
                          )}
                          <div className={`flex items-start gap-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            <span className="text-zinc-500 mt-0.5"><MapPin size={15} /></span>
                            <span>
                              {order.order_type === 'delivery' ? (
                                <>
                                  Address: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>{order.user_address?.address_line || 'Delivery Address'}</strong>
                                </>
                              ) : (
                                <>
                                  Order Type: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>Store Pickup</strong>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          theme === 'dark' ? 'text-[#f5c043] border-white/5' : 'text-[#007a3f] border-gray-200'
                        }`}>
                          PAYMENT & DELIVERY TIME
                        </h5>
                        <div className="space-y-3 font-medium">
                          <div className={`flex items-start gap-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            <span className="text-zinc-500 mt-0.5"><CreditCard size={15} /></span>
                            <span>
                              Payment Method: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>{order.payment_method === 'vietqr' ? 'VietQR Transfer' : 'Cash on Delivery (COD)'}</strong>
                            </span>
                          </div>
                          <div className={`flex items-start gap-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            <span className="text-zinc-500 mt-0.5"><Clock size={15} /></span>
                            <span>
                              Payment Status: <strong className={order.payment_status === 'paid' ? 'text-emerald-500 font-bold' : 'text-amber-600 font-bold'}>
                                {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                              </strong>
                            </span>
                          </div>
                          <div className={`flex items-start gap-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>
                            <span className="text-zinc-500 mt-0.5"><Calendar size={15} /></span>
                            <span>
                              {order.pickup_time ? (
                                <>Scheduled Pickup Time: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>{formatDate(order.pickup_time)}</strong></>
                              ) : (
                                <>Delivery Time: <strong className={theme === 'dark' ? 'text-white font-bold' : 'text-gray-800 font-bold'}>Immediate delivery (30-45 mins)</strong></>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Note */}
                    {order.order_note && (
                      <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                        theme === 'dark' ? 'bg-[#121212]/40 border-white/[0.04]' : 'bg-gray-100/50 border-gray-200'
                      }`}>
                        <span className="text-zinc-500 mt-0.5"><FileText size={16} /></span>
                        <div className="text-xs font-medium text-left">
                          <span className={`block uppercase tracking-wider font-extrabold mb-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>ORDER NOTE:</span>
                          <p className={`leading-relaxed italic ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>&ldquo;{order.order_note}&rdquo;</p>
                        </div>
                      </div>
                    )}

                    {/* Order Items & Totals Section */}
                    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-150'}`}>
                      
                      {/* Left: Dishes List */}
                      <div className="lg:col-span-7 space-y-4">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          theme === 'dark' ? 'text-[#f5c043] border-white/5' : 'text-[#007a3f] border-gray-200'
                        }`}>
                          ORDERED DISHES
                        </h5>

                        <div className={`divide-y border p-5 rounded-2xl ${
                          theme === 'dark' 
                            ? 'divide-white/5 bg-[#121212]/30 border-white/[0.04]' 
                            : 'divide-gray-150 bg-white border-gray-200'
                        }`}>
                          {order.items.map((item) => {
                            let dishName = '';
                            let imageSrc = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
                            let itemSpec = '';

                            const isCombo = !!item.combo_id;
                            const isHalfHalf = !!item.is_half_half;

                            if (isCombo) {
                              dishName = item.combo?.combo_name || `Combo #${item.combo_id}`;
                              imageSrc = item.combo?.image_combo || 'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=100&auto=format&fit=crop';
                            } else if (isHalfHalf) {
                              dishName = 'PIZZA HALF & HALF';
                              imageSrc = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=100&auto=format&fit=crop';
                              const size = item.dish_price?.size?.size_name;
                              const crust = item.dish_price?.crust?.crust_name;
                              itemSpec = `${size ? `Size: ${size}` : ''}${crust ? ` - Crust: ${crust}` : ''}`;
                            } else {
                              dishName = item.dish_price?.dish?.dish_name || 'Dish';
                              imageSrc = item.dish_price?.dish?.image || imageSrc;
                              const size = item.dish_price?.size?.size_name;
                              const crust = item.dish_price?.crust?.crust_name;
                              itemSpec = `${size ? `Size: ${size}` : ''}${crust ? ` - Crust: ${crust}` : ''}`;
                            }

                            return (
                              <div key={item.order_item_id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                                <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border shrink-0 shadow-md ${
                                  theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-200'
                                }`}>
                                  <Image
                                    src={imageSrc}
                                    alt={dishName}
                                    fill
                                    className="object-cover"
                                  />
                                </div>

                                <div className="flex-1 flex flex-col justify-between text-left">
                                  <div className="space-y-0.5">
                                    <div className="flex items-start justify-between gap-4">
                                      <h4 className={`font-extrabold text-sm md:text-base tracking-wide leading-snug ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                                      }`}>
                                        {dishName}
                                      </h4>
                                    </div>
                                    
                                    {itemSpec && (
                                      <p className={`text-[11px] font-bold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                                        {itemSpec}
                                      </p>
                                    )}

                                    {/* Render combo details */}
                                    {isCombo && item.combos && item.combos.length > 0 && (
                                      <div className={`mt-2 pl-3 border-l-2 text-xs space-y-2 ${
                                        theme === 'dark' ? 'border-[#f5c043]/30 text-zinc-400' : 'border-[#007a3f]/30 text-gray-500'
                                      }`}>
                                        {item.combos.map((combItem, cIdx) => {
                                          const cName = combItem.dish_price?.dish?.dish_name || 'Dish';
                                          const cSize = combItem.dish_price?.size?.size_name;
                                          const cCrust = combItem.dish_price?.crust?.crust_name;
                                          return (
                                            <div key={cIdx} className="space-y-0.5">
                                              <p className={`font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                                                {cIdx + 1}. {combItem.is_half_half ? 'Pizza Half & Half' : cName}
                                              </p>
                                              
                                              <div className="pl-3 text-[10px] text-zinc-500 space-y-0.5">
                                                {!combItem.is_half_half && (cSize || cCrust) && (
                                                  <p className="font-bold uppercase tracking-wider">
                                                    {cSize ? `Size: ${cSize}` : ''}{cCrust ? ` - Crust: ${cCrust}` : ''}
                                                  </p>
                                                )}

                                                {combItem.is_half_half && combItem.halves && (
                                                  <div className="pl-2 border-l border-blue-400/30 py-0.5 space-y-1">
                                                    {combItem.halves.map((ch, chIdx) => (
                                                      <div key={chIdx} className="text-[11px]">
                                                        <span className="text-zinc-500 font-medium">Half {chIdx + 1}: </span>
                                                        <span className={`font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-700'}`}>{ch.dish?.dish_name}</span>
                                                        {ch.order_item_toppings && ch.order_item_toppings.length > 0 && (
                                                          <span className="block pl-3 text-[10px] text-zinc-500 italic">
                                                            + Toppings: {ch.order_item_toppings.map(t => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                          </span>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}

                                                {combItem.toppings && combItem.toppings.length > 0 && (
                                                  <p className="text-zinc-500 italic">
                                                    + Toppings: {combItem.toppings.map(t => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Render half-half details */}
                                    {isHalfHalf && item.halves && item.halves.length > 0 && (
                                      <div className={`mt-2 pl-3 border-l-2 text-xs space-y-2 ${theme === 'dark' ? 'border-blue-500/30 text-zinc-400' : 'border-blue-400/30 text-gray-500'}`}>
                                        {item.halves.map((half, hIdx) => (
                                          <div key={hIdx} className="text-xs">
                                            <span className={`font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>• Half {hIdx + 1}: </span>
                                            <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{half.dish?.dish_name}</span>
                                            {half.order_item_toppings && half.order_item_toppings.length > 0 && (
                                              <span className="text-zinc-500 block ml-3 italic">
                                                + Toppings riêng: {half.order_item_toppings.map(t => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Render regular toppings */}
                                    {!isCombo && !isHalfHalf && item.toppings && item.toppings.length > 0 && (
                                      <p className="text-[11px] text-zinc-500 font-medium pt-1">
                                        + Toppings: {item.toppings.map((t) => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                      </p>
                                    )}
                                    {isHalfHalf && item.toppings && item.toppings.length > 0 && (
                                      <p className="text-[11px] text-zinc-500 font-medium pt-1">
                                        + Toppings chung: {item.toppings.map((t) => `${t.topping?.topping_name} (+${formatPrice(t.topping_price)})`).join(', ')}
                                      </p>
                                    )}

                                    {item.order_item_note && (
                                      <p className={`text-[10px] border px-2 py-0.5 mt-2 rounded inline-block font-medium ${
                                        theme === 'dark' 
                                          ? 'bg-[#9f280a]/20 text-[#ff8b70] border-[#9f280a]/30' 
                                          : 'bg-red-50 text-red-600 border-red-200'
                                      }`}>
                                        Special Request: {item.order_item_note}
                                      </p>
                                    )}
                                  </div>
                                  <div className={`text-[11px] font-bold tracking-wider mt-1 block ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                                    Quantity: x{item.quantity}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Totals Summary */}
                      <div className="lg:col-span-5 flex flex-col justify-start space-y-4">
                        <h5 className={`text-[11px] font-black uppercase tracking-widest block border-b pb-2 ${
                          theme === 'dark' ? 'text-[#f5c043] border-white/5' : 'text-[#007a3f] border-gray-200'
                        }`}>
                          ORDER SUMMARY
                        </h5>

                        <div className={`p-5 rounded-2xl space-y-3.5 text-xs md:text-sm font-semibold shadow-lg border ${
                          theme === 'dark' 
                            ? 'bg-[#121212]/90 border-white/[0.06]' 
                            : 'bg-white border-gray-200'
                        }`}>
                          <div className={`flex justify-between items-center gap-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            <span className="whitespace-nowrap">Subtotal:</span>
                            <span className={`whitespace-nowrap ${theme === 'dark' ? 'text-zinc-200' : 'text-gray-700'}`}>{formatPrice(order.total_price_dish)}</span>
                          </div>
                          <div className={`flex justify-between items-center gap-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                            <span className="whitespace-nowrap">Shipping Fee:</span>
                            {order.shipping_fee > 0 ? (
                              <span className={`whitespace-nowrap ${theme === 'dark' ? 'text-zinc-200' : 'text-gray-700'}`}>{formatPrice(order.shipping_fee)}</span>
                            ) : (
                              <span className="text-emerald-500 font-bold whitespace-nowrap">Free</span>
                            )}
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between items-center text-red-500 gap-4">
                              <span className="whitespace-nowrap">Discount:</span>
                              <span className="whitespace-nowrap">-{formatPrice(order.discount_amount)}</span>
                            </div>
                          )}
                          <div className={`flex justify-between items-center text-base font-black pt-2.5 border-t gap-4 ${
                            theme === 'dark' ? 'text-white border-white/5' : 'text-gray-800 border-gray-150'
                          }`}>
                            <span className={`whitespace-nowrap ${theme === 'dark' ? 'text-[#f5c043]' : 'text-[#007a3f]'}`}>TOTAL:</span>
                            <span className={`tracking-wide text-lg whitespace-nowrap ${theme === 'dark' ? 'text-[#f5c043]' : 'text-[#007a3f]'}`}>{formatPrice(order.total_order)}</span>
                          </div>
                        </div>

                        {/* Review Button for completed orders */}
                        {(order.order_status.toLowerCase() === 'completed' || order.order_status.toLowerCase() === 'arrived') && (
                          <button
                            onClick={() => router.push(`/reviews?order_id=${order.order_id}`)}
                            className={`w-full font-black text-xs tracking-widest uppercase py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] mt-3 flex items-center justify-center gap-2 cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-[#f5c043] hover:bg-[#e5b33c] text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-[#007a3f] hover:bg-[#006030] text-white hover:shadow-[0_0_15px_rgba(0,122,63,0.2)]'
                            }`}
                          >
                            <span>Review Order</span>
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <div className={`px-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-100 border-t border-gray-200'}`}>
        <Footer />
      </div>
    </div>
  );
}
