'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Phone, Mail, User, Clock, FileText, CreditCard, Store, Truck, Package, CheckCircle, QrCode, Search, Loader, AlertTriangle, RotateCcw, BookOpen, Sparkles, Bell, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import AddressPickerVN from '@/components/AddressPickerVN';
import { API_BASE } from '@/lib/config';

// ── Component: Thông tin người nhận ─────────────────────────────────────────
function CustomerInfoSection() {
  const { formData, updateFormData } = useOrderStore();

  return (
    <div className="checkout-card">
      <div className="checkout-card-header">
        <div className="checkout-icon-badge">
          <User size={18} />
        </div>
        <h3>THÔNG TIN NGƯỜI NHẬN</h3>
      </div>

      <div className="checkout-form-group">
        <label className="checkout-label">HỌ TÊN NGƯỜI NHẬN (*)</label>
        <input
          type="text"
          className="checkout-input"
          placeholder="Nhập tên người nhận..."
          value={formData.customer_name}
          onChange={(e) => updateFormData({ customer_name: e.target.value })}
        />
      </div>

      <div className="checkout-form-row">
        <div className="checkout-form-group">
          <label className="checkout-label">SỐ ĐIỆN THOẠI (*)</label>
          <input
            type="tel"
            className="checkout-input"
            placeholder="Nhập số điện thoại..."
            value={formData.customer_phone}
            onChange={(e) => updateFormData({ customer_phone: e.target.value })}
          />
        </div>
        <div className="checkout-form-group">
          <label className="checkout-label">EMAIL (*)</label>
          <input
            type="email"
            className="checkout-input"
            placeholder="Nhập email..."
            value={formData.customer_email}
            onChange={(e) => updateFormData({ customer_email: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}


// ── Component: Address Selector (No Map) ──────────────────────────────────────────
function AddressMapSelector() {
  const { formData, updateFormData } = useOrderStore();

  return (
    <div className="checkout-form-group">
      <label className="checkout-label">ĐỊA CHỈ GIAO HÀNG (*)</label>
      <AddressPickerVN
        initialAddress={formData.customer_address}
        onChange={(fullAddress) => {
          updateFormData({ customer_address: fullAddress });
        }}
        onSelectCoordinates={(lat, lon) => {
          updateFormData({ customer_lat: lat, customer_lon: lon });
        }}
      />
    </div>
  );
}


// ── Component: Phương thức nhận hàng ────────────────────────────────────────
function DeliveryMethodSection({
  isLoggedIn,
  addresses,
  loadingAddresses,
  onOpenAddressModal,
  stores,
}: {
  isLoggedIn: boolean;
  addresses: any[];
  loadingAddresses: boolean;
  onOpenAddressModal: () => void;
  stores: any[];
}) {
  const { formData, updateFormData } = useOrderStore();
  const { user } = useAuthStore();

  const activeAddress = addresses.find(a => a.user_address_id === formData.user_address_id) || addresses.find(a => a.is_default) || addresses[0];

  return (
    <div className="checkout-card">
      {/* Tabs */}
      <div className="checkout-delivery-tabs">
        <button
          className={`checkout-tab ${formData.order_type === 'delivery' ? 'active' : ''}`}
          onClick={() => updateFormData({ order_type: 'delivery' })}
        >
          <Truck size={16} />
          GIAO HÀNG TẬN NƠI
        </button>
        <button
          className={`checkout-tab ${formData.order_type === 'pickup' ? 'active' : ''}`}
          onClick={() => updateFormData({ order_type: 'pickup' })}
        >
          <Store size={16} />
          ĐẾN CỬA HÀNG LẤY
        </button>
      </div>

      {/* Delivery content */}
      {formData.order_type === 'delivery' && (
        <div className="checkout-delivery-content">
          {isLoggedIn ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden mb-6">
              <div className="checkout-envelope-border" />
              <div className="p-5">
                <div className="flex items-center gap-2 text-[#cd3645] font-bold text-[14px] mb-3">
                  <MapPin size={16} />
                  <span>Địa Chỉ Nhận Hàng</span>
                </div>
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 text-[13.5px] leading-relaxed text-white/95">
                    <span className="font-extrabold text-white mr-3">
                      {formData.customer_name || activeAddress?.recipient_name || 'Họ Tên'} {formData.customer_phone ? `(${formData.customer_phone})` : activeAddress?.recipient_phone ? `(${activeAddress.recipient_phone})` : ''}
                    </span>
                    <span className="text-white/80 block">
                      {formData.customer_address || activeAddress?.address_detail || 'Chưa chọn địa chỉ giao hàng'}
                    </span>
                    <span className="text-white/60 text-xs mt-1 block">
                      Email: {formData.customer_email || user?.email || 'N/A'}
                    </span>
                    {activeAddress?.is_default && (
                      <span className="border border-[#cd3645] text-[#cd3645] text-[10px] px-1 rounded-sm font-bold uppercase mt-1 inline-block">Mặc Định</span>
                    )}
                  </div>
                  <button className="text-[#3b82f6] font-bold text-[13px] hover:underline whitespace-nowrap focus:outline-none transition" onClick={onOpenAddressModal}>
                    Thay Đổi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <AddressMapSelector />
          )}
        </div>
      )}

      {/* Pickup content */}
      {formData.order_type === 'pickup' && (
        <div className="checkout-pickup-content">
          {stores.length === 0 ? (
            <p className="checkout-empty-text">Đang tải danh sách chi nhánh...</p>
          ) : (
            stores.map((store) => (
              <div
                key={store.store_id}
                className={`checkout-store-card ${formData.store_id === store.store_id ? 'selected' : ''}`}
                onClick={() => updateFormData({ store_id: store.store_id })}
              >
                <div className="checkout-store-info">
                  <h4 className="checkout-store-name">{store.store_name}</h4>
                  <p className="checkout-store-address">{store.address}</p>
                  {store.hotline && (
                    <p className="checkout-store-phone">
                      <Phone size={12} /> {store.hotline}
                    </p>
                  )}
                </div>
                <div className={`checkout-radio ${formData.store_id === store.store_id ? 'checked' : ''}`} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Component: Hẹn giờ giao ──────────────────────────────────────────────────
function ScheduleSection() {
  const { formData, updateFormData } = useOrderStore();

  // 1. Tạo danh sách 7 ngày từ ngày đặt (Hôm nay + 6 ngày kế tiếp)
  const dateOptions: { display: string; value: string }[] = [];
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const todayDate = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(todayDate.getDate() + i);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let prefix = '';
    if (i === 0) prefix = ' (Hôm nay)';
    else if (i === 1) prefix = ' (Ngày mai)';
    else prefix = ` (${daysOfWeek[d.getDay()]})`;

    dateOptions.push({
      display: `${day}/${month}/${year}${prefix}`,
      value: `${year}-${month}-${day}`
    });
  }

  // 2. Tạo danh sách Giờ hoạt động (09:30 đến 21:30) dựa trên ngày được chọn
  const timeOptions: string[] = [];
  const now = new Date();

  // Xác định ngày hôm nay dưới dạng YYYY-MM-DD
  const todayValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isSelectedToday = formData.scheduled_date === todayValue;

  // Thêm 30 phút chuẩn bị làm mốc thời gian tối thiểu có thể đặt
  const minTime = new Date(now.getTime() + 30 * 60 * 1000);
  const minHour = minTime.getHours();
  const minMinute = minTime.getMinutes();

  for (let hour = 9; hour <= 21; hour++) {
    for (let min of [0, 15, 30, 45]) {
      if (hour === 9 && min < 30) continue;
      if (hour === 21 && min > 30) break;

      // Nếu là ngày hôm nay, chỉ lấy khung giờ còn khả dụng (sau giờ hiện tại + 30p chuẩn bị)
      if (isSelectedToday) {
        if (hour < minHour || (hour === minHour && min < minMinute)) {
          continue;
        }
      }

      const hStr = String(hour).padStart(2, '0');
      const mStr = String(min).padStart(2, '0');
      timeOptions.push(`${hStr}:${mStr}`);
    }
  }

  // 3. Khởi tạo & Đồng bộ tự động các giá trị Ngày / Giờ khi người dùng tương tác
  useEffect(() => {
    if (!formData.deliver_now) {
      // 3.1. Gán ngày mặc định (Hôm nay) nếu chưa có
      if (!formData.scheduled_date) {
        updateFormData({ scheduled_date: dateOptions[0].value });
        return;
      }

      // 3.2. Nếu hôm nay hết giờ khả dụng -> tự chuyển ngày mặc định sang Ngày mai
      if (formData.scheduled_date === dateOptions[0].value && timeOptions.length === 0) {
        updateFormData({
          scheduled_date: dateOptions[1].value,
          scheduled_time: '09:30'
        });
        return;
      }

      // 3.3. Đảm bảo giờ đã chọn luôn nằm trong các khung giờ khả dụng của ngày đó
      if (!formData.scheduled_time || !timeOptions.includes(formData.scheduled_time)) {
        updateFormData({ scheduled_time: timeOptions[0] || '09:30' });
      }
    }
  }, [formData.deliver_now, formData.scheduled_date]);

  return (
    <div className="checkout-card checkout-card-half">
      <h3 className="checkout-section-title">HẸN GIỜ GIAO</h3>
      <div className="checkout-radio-group">
        <label className="checkout-radio-label">
          <input
            type="radio"
            name="schedule"
            checked={formData.deliver_now}
            onChange={() => updateFormData({ deliver_now: true })}
            className="checkout-radio-input"
          />
          <span className="checkout-radio-custom" />
          Giao ngay lập tức
        </label>
        <label className="checkout-radio-label">
          <input
            type="radio"
            name="schedule"
            checked={!formData.deliver_now}
            onChange={() => updateFormData({ deliver_now: false })}
            className="checkout-radio-input"
          />
          <span className="checkout-radio-custom" />
          Giao vào thời gian cụ thể
        </label>
      </div>

      {!formData.deliver_now && (
        <div className="checkout-schedule-inputs flex gap-3 mt-3">
          <div className="relative flex-1">
            <select
              className="checkout-input w-full appearance-none pr-8 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              value={formData.scheduled_date}
              onChange={(e) => updateFormData({ scheduled_date: e.target.value })}
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-black text-white">
                  {opt.display}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-[10px]">▼</div>
          </div>

          <div className="relative flex-1">
            <select
              className="checkout-input w-full appearance-none pr-8 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              value={formData.scheduled_time}
              onChange={(e) => updateFormData({ scheduled_time: e.target.value })}
            >
              {timeOptions.map((t) => (
                <option key={t} value={t} className="bg-black text-white">
                  {t}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-[10px]">▼</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component: Ghi chú ──────────────────────────────────────────────────────
function NoteSection() {
  const { formData, updateFormData } = useOrderStore();

  return (
    <div className="checkout-card checkout-card-half">
      <h3 className="checkout-section-title">GHI CHÚ (KHÔNG BẮT BUỘC)</h3>
      <textarea
        className="checkout-textarea"
        placeholder="Nhập ghi chú cho đơn hàng của bạn..."
        value={formData.order_note}
        onChange={(e) => updateFormData({ order_note: e.target.value })}
        rows={4}
      />
    </div>
  );
}

// ── Component: Tóm tắt đơn hàng (sidebar) ─────────────────────────────────
function OrderSummary() {
  const { items, totalItems, totalPrice } = useCartStore();
  const { formData, submitOrder, isSubmitting, updateFormData, error, setEmailVerified } = useOrderStore();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // OTP state for guest checkout
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => setIsMounted(true), []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const displayItems = isMounted ? items : [];
  const displayTotal = isMounted ? totalPrice() : 0;
  const displayCount = isMounted ? totalItems() : 0;
  const shippingFee = isMounted && formData.order_type === 'delivery' ? (formData.shipping_fee || 0) : 0;

  // Send OTP to guest email
  const handleSendOtp = async () => {
    if (!formData.customer_email) return;
    setSendingOtp(true);
    setOtpError('');
    try {
      const r = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.customer_email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      setOtpError(err.message || 'Không thể gửi mã OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and submit order
  const handleVerifyAndSubmit = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) { setOtpError('Vui lòng nhập đủ 6 số'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.customer_email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // OTP verified → set emailVerified to true and submit order
      setEmailVerified(true);
      setShowOtpModal(false);
      await submitOrder();
    } catch (err: any) {
      setOtpError(err.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpValues(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Handle order button click
  const handleOrderClick = async () => {
    // Basic validation
    if (!formData.customer_name) {
      useOrderStore.setState({ error: 'Vui lòng nhập họ tên người nhận' });
      return;
    }
    if (!formData.customer_phone) {
      useOrderStore.setState({ error: 'Vui lòng nhập số điện thoại' });
      return;
    }
    if (!formData.customer_email) {
      useOrderStore.setState({ error: 'Vui lòng nhập email' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customer_email)) {
      useOrderStore.setState({ error: 'Định dạng email không hợp lệ' });
      return;
    }
    if (formData.order_type === 'delivery' && !formData.customer_address) {
      useOrderStore.setState({ error: 'Vui lòng nhập địa chỉ giao hàng' });
      return;
    }

    // Logged-in user → submit directly
    if (user) {
      await submitOrder();
      return;
    }

    // Guest → send OTP and show modal
    setOtpError('');
    setOtpValues(['', '', '', '', '', '']);
    setShowOtpModal(true);
    await handleSendOtp();
  };

  return (
    <div className="checkout-summary">
      <div className="checkout-summary-header">
        <h3>TÓM TẮT ĐƠN HÀNG</h3>
        <span className="checkout-summary-count">{displayCount} ITEMS</span>
      </div>

      <div className="checkout-summary-items">
        {displayItems.map((item) => (
          <div key={item.id} className="checkout-summary-item">
            <div className="checkout-summary-qty">
              <span>x{item.quantity}</span>
            </div>
            <div className="checkout-summary-item-image">
              <Image
                src={item.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop'}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="checkout-summary-item-info">
              <h4>{item.name}</h4>
              {item.options?.comboItems ? (
                <div className="flex flex-col gap-1 mt-1 text-[11px] text-white/80">
                  {item.options.comboItems.map((ci: any, idx: number) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-white font-bold">{idx + 1}. {ci.name}</span>
                      <div className="ml-3 font-normal text-white/70 space-y-0.5">
                        {ci.size && <span>Size: {ci.size}<br /></span>}
                        {ci.crust && <span>Crust: {ci.crust}<br /></span>}
                        {ci.toppings && ci.toppings.length > 0 && ci.toppings.map((tp: any, tidx: number) => (
                          <span key={tidx} className="italic text-white/60 ml-2 block">
                            • topping: {tp.name} (+{formatPrice(tp.price)})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {item.options?.notes && (
                    <div className="bg-[#9f280a] inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] text-white self-start">
                      Note: {item.options.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-white/80 space-y-0.5">
                  {item.options?.size && <p>Size: {item.options.size}</p>}
                  {item.options?.crust && <p>Crust: {item.options.crust}</p>}
                  {item.options?.toppings && (
                    Array.isArray(item.options.toppings) && item.options.toppings.length > 0 ? (
                      <div className="ml-1 mt-0.5">
                        {item.options.toppings.map((tp: any, tidx: number) => (
                          <span key={tidx} className="italic text-white/60 block">
                            • topping: {tp.name} (+{formatPrice(tp.price)})
                          </span>
                        ))}
                      </div>
                    ) : typeof item.options.toppings === 'string' && (item.options.toppings as string).length > 0 ? (
                      <p>Topping: {item.options.toppings as string}</p>
                    ) : null
                  )}
                  {item.options?.notes && (
                    <div className="bg-[#9f280a] inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] text-white">
                      Note: {item.options.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="checkout-summary-totals">
        <div className="checkout-summary-row">
          <span>TẠM TÍNH</span>
          <span>{formatPrice(displayTotal)}</span>
        </div>
        <div className="checkout-summary-row" style={{ flexDirection: 'column', gap: '4px' }}>
          <span>PHÍ VẬN CHUYỂN</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, lineHeight: 1.4 }}>
            PHÍ SHIP SẼ ĐƯỢC GỬI VỀ EMAIL KHI CỬA HÀNG XÁC NHẬN KHOẢNG CÁCH GIAO HÀNG CỦA BẠN
          </span>
        </div>
        <div className="checkout-summary-total-row">
          <span>TOTAL PRICE</span>
          <span className="checkout-total-price">{formatPrice(displayTotal)}</span>
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div className="border-t border-white/8 mt-4 pt-4">
        <h4 className="text-[12px] font-black text-[#d4a017] uppercase tracking-wider mb-3">
          PHƯƠNG THỨC THANH TOÁN
        </h4>
        <div className="checkout-payment-options flex flex-col gap-2">
          <label className={`checkout-payment-option ${formData.payment_method === 'vietqr' ? 'selected' : ''}`} style={{ padding: '0.75rem 1rem' }}>
            <div className="checkout-payment-option-header text-[12px] flex items-center gap-2 font-bold">
              <QrCode size={16} />
              <span>CHUYỂN KHOẢN VIETQR</span>
            </div>
            <input type="radio" name="payment" value="vietqr" checked={formData.payment_method === 'vietqr'} onChange={() => updateFormData({ payment_method: 'vietqr' })} className="checkout-radio-input" />
            <span className={`checkout-radio-dot ${formData.payment_method === 'vietqr' ? 'active' : ''}`} />
          </label>
          <label className={`checkout-payment-option ${formData.payment_method === 'cod' ? 'selected' : ''}`} style={{ padding: '0.75rem 1rem' }}>
            <div className="checkout-payment-option-header text-[12px] flex items-center gap-2 font-bold">
              <Package size={16} />
              <span>TIỀN MẶT (COD)</span>
            </div>
            <input type="radio" name="payment" value="cod" checked={formData.payment_method === 'cod'} onChange={() => updateFormData({ payment_method: 'cod' })} className="checkout-radio-input" />
            <span className={`checkout-radio-dot ${formData.payment_method === 'cod' ? 'active' : ''}`} />
          </label>
        </div>
      </div>

      {error && <p className="checkout-error mt-3 mb-2">{error}</p>}

      <button
        className="checkout-pay-btn mt-3"
        onClick={handleOrderClick}
        disabled={isSubmitting || displayItems.length === 0}
      >
        {isSubmitting ? (
          <span className="checkout-spinner" />
        ) : (
          `XÁC NHẬN ĐẶT HÀNG: ${formatPrice(displayTotal)}`
        )}
      </button>

      {/* OTP Modal for Guest */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-[15px] font-black text-white uppercase tracking-wider">Xác thực Email</h3>
              <button
                className="text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
                onClick={() => setShowOtpModal(false)}
              >
                <span className="text-[22px] leading-none font-light">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-white/60 text-[13px] text-center mb-1">
                Mã OTP đã được gửi đến email:
              </p>
              <p className="text-white font-bold text-[14px] text-center mb-5">
                {formData.customer_email}
              </p>

              {otpError && (
                <p className="text-red-400 text-[12px] text-center font-semibold mb-3">{otpError}</p>
              )}

              <div className="flex gap-2 justify-center mb-5" onPaste={handleOtpPaste}>
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '44px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      border: val ? '2px solid #c0392b' : '2px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      outline: 'none',
                      transition: 'border 0.2s',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyAndSubmit}
                disabled={otpLoading || otpValues.join('').length !== 6}
                className="w-full py-3 rounded-xl font-bold text-[14px] uppercase tracking-wider transition"
                style={{
                  background: otpLoading || otpValues.join('').length !== 6 ? 'rgba(255,255,255,0.08)' : '#c0392b',
                  color: '#fff',
                  border: 'none',
                  cursor: otpLoading || otpValues.join('').length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: otpLoading || otpValues.join('').length !== 6 ? 0.5 : 1,
                }}
              >
                {otpLoading ? 'Đang xác thực...' : 'Xác nhận và đặt hàng'}
              </button>

              <div className="text-center mt-3">
                {countdown > 0 ? (
                  <span className="text-[12px] text-white/40">Gửi lại mã sau {countdown}s</span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="text-[12px] font-semibold"
                    style={{ color: '#eab308', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {sendingOtp ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






// ── Component: Đặt hàng thành công ──────────────────────────────────────────


function OrderSuccess() {
  const { orderResult, formData, resetForm, cartBackup } = useOrderStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  if (!orderResult) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 select-none">
      {/* Icon checkmark xanh lá phát sáng */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-[#0c2a1c] rounded-full flex items-center justify-center border border-[#10b981]/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-fadeIn">
          <div className="w-12 h-12 bg-[#10b981] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <svg className="w-6 h-6 text-[#0c2a1c] stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Thông báo chờ cập nhật phí ship */}
      <div className="max-w-2xl mx-auto bg-red-950/20 border border-red-500/20 rounded-2xl p-5 md:p-6 text-center shadow-lg animate-fadeIn">
        <p className="text-[#ef4444] font-black text-sm md:text-base lg:text-lg tracking-widest uppercase">
          ĐƠN HÀNG ĐANG CHỜ CỬA HÀNG CẬP NHẬT PHÍ VẬN CHUYỂN.
        </p>
        <p className="text-white/70 text-xs md:text-sm font-bold mt-2.5 uppercase tracking-wider">
          HÓA ĐƠN CHÍNH THỨC SẼ ĐƯỢC GỬI VÀO EMAIL CỦA BẠN NGAY KHI HOÀN TẤT!
        </p>
      </div>

      {/* Mã đơn hàng */}
      <p className="text-center text-[11px] font-extrabold text-white/40 tracking-[0.25em] mt-5 uppercase">
        MÃ ĐƠN HÀNG TẠM THỜI: #PIZZA-{orderResult.order_id}
      </p>



      {/* Hộp nội dung chi tiết đơn hàng */}
      <div className="bg-[#121212] border border-white/[0.06] rounded-[24px] p-6 md:p-8 mt-10 space-y-6 shadow-2xl shadow-black/50 text-left">
        {/* Mục 1: Xác nhận thông tin */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 flex items-center justify-center text-[#eab308] flex-shrink-0 mt-0.5 shadow-[0_0_15px_rgba(234,179,8,0.05)]">
            <Mail size={18} />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-extrabold text-white">Xác nhận thông tin đơn hàng</h4>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium mt-1">
              Hệ thống đang tính toán phí vận chuyển chính xác đến địa chỉ của bạn. Hóa đơn tổng sẽ được gửi về email trong vòng 3 - 5 phút.
              <br />
              <span className="text-[#ef4444] font-bold">Lưu ý:</span> Quý khách muốn thay đổi thông tin hoặc hủy đơn hàng, vui lòng liên hệ số Hotline: <strong className="font-black text-white">02839240343</strong>
            </p>
          </div>
        </div>

        {/* Mục 2: Vận chuyển */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] flex-shrink-0 mt-0.5 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
            <Truck size={18} />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-extrabold text-white">Lưu ý về chi phí vận chuyển</h4>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium mt-1">
              Hệ thống áp dụng chính sách <strong className="font-extrabold text-white">miễn phí vận chuyển trong phạm vi 4km</strong>. Nếu địa chỉ của bạn xa hơn <strong className="font-extrabold text-white">4km</strong> so với chi nhánh gần nhất, phí vận chuyển cố định <strong className="font-extrabold text-[#eab308]">20.000đ</strong> sẽ được áp dụng khi nhân viên xác nhận đơn.
            </p>
          </div>
        </div>

        {/* Accordion chi tiết đơn hàng ẩn/hiện */}
        {showDetails && (
          <div className="border-t border-white/[0.06] pt-5 mt-4 space-y-4 animate-fadeIn">
            <h5 className="text-[11px] font-extrabold text-[#d4a017] tracking-[0.15em] uppercase">THÔNG TIN TÓM TẮT ĐƠN HÀNG</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
              <div className="space-y-2.5">
                <p className="text-white/50 font-bold"><span className="text-white/30 font-medium uppercase text-[10px] tracking-wider block mb-0.5">Người nhận hàng</span>{formData.customer_name}</p>
                <p className="text-white/50 font-bold"><span className="text-white/30 font-medium uppercase text-[10px] tracking-wider block mb-0.5">Số điện thoại</span>{formData.customer_phone}</p>
                <p className="text-white/50 font-bold"><span className="text-white/30 font-medium uppercase text-[10px] tracking-wider block mb-0.5">Email</span>{formData.customer_email}</p>
                <p className="text-white/50 font-bold"><span className="text-white/30 font-medium uppercase text-[10px] tracking-wider block mb-0.5">Địa chỉ giao nhận</span>{formData.customer_address || 'Nhận trực tiếp tại chi nhánh cửa hàng'}</p>
              </div>
              <div className="space-y-2.5">
                {formData.nearest_store_name && (
                  <p className="text-white/50 font-bold"><span className="text-white/30 font-medium uppercase text-[10px] tracking-wider block mb-0.5">Chi nhánh xử lý</span>{formData.nearest_store_name}</p>
                )}
                <p className="text-white/50 font-bold"><span className="text-white/30 font-medium uppercase text-[10px] tracking-wider block mb-0.5">Thời gian</span>{formData.deliver_now ? 'Giao ngay lập tức (30-45 phút)' : `${formData.scheduled_date} ${formData.scheduled_time}`}</p>
                <p className="text-white/50 font-bold">
                  <span className="text-white/30 font-medium uppercase text-[10px] tracking-wider block mb-0.5">Thanh toán</span>
                  <span className="text-[#10b981]">
                    {orderResult.payment_method === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt (COD)'}
                  </span>
                </p>
              </div>
            </div>

            {/* Chi tiết món đã đặt */}
            {cartBackup && cartBackup.length > 0 && (
              <div className="mt-4">
                <h5 className="text-[11px] font-extrabold text-[#d4a017] tracking-[0.15em] uppercase mb-3">CHI TIẾT MÓN ĐÃ ĐẶT</h5>
                <div className="space-y-2">
                  {cartBackup.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                      <span className="text-[10px] font-black text-[#cd3645] bg-[#cd3645]/10 px-2 py-1 rounded-md flex-shrink-0">x{item.quantity}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 font-bold text-xs">{item.name}</p>
                        <div className="text-[10px] text-white/40 space-y-0.5 mt-0.5">
                          {item.options?.size && <span className="block">Size: {item.options.size}</span>}
                          {item.options?.crust && <span className="block">Đế: {item.options.crust}</span>}
                          {item.options?.toppings && Array.isArray(item.options.toppings) && item.options.toppings.length > 0 && (
                            <span className="block">Toppings: {item.options.toppings.map((t: any) => t.name || t.topping_name).join(', ')}</span>
                          )}
                          {item.options?.comboItems && item.options.comboItems.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.options.comboItems.map((ci: any, cidx: number) => (
                                <span key={cidx} className="block">{cidx + 1}. {ci.name}{ci.size ? ` (${ci.size})` : ''}{ci.crust ? ` - ${ci.crust}` : ''}</span>
                              ))}
                            </div>
                          )}
                          {item.options?.notes && (
                            <span className="block text-[#ef4444]/60 italic">Ghi chú: {item.options.notes}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white/50 whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.order_note && (
              <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-xs text-white/50 mt-2">
                <span className="font-extrabold text-white/30 block text-[9px] uppercase tracking-wider mb-1">Ghi chú của bạn</span>
                &quot;{formData.order_note}&quot;
              </div>
            )}
            <div className="border-t border-white/[0.04] pt-3 flex justify-between items-center text-xs md:text-sm font-extrabold text-white">
              <span className="text-white/40 uppercase tracking-wider text-[10px]">TỔNG CỘNG THANH TOÁN</span>
              <span className="text-lg text-[#cd3645]">{formatPrice(orderResult.total_order)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Nút Xem chi tiết đơn hàng */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mt-6 bg-[#141414] hover:bg-[#1a1a1a] border border-white/[0.05] hover:border-white/10 text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm shadow-xl hover:shadow-black/50 active:scale-[0.99]"
      >
        <BookOpen size={16} className="text-[#eab308]" />
        <span>{showDetails ? 'ẨN CHI TIẾT ĐƠN HÀNG CỦA BẠN' : 'XEM CHI TIẾT ĐƠN HÀNG CỦA BẠN TẠI ĐÂY'}</span>
      </button>

      {/* Nút Về trang chủ */}
      <div className="text-center">
        <button
          onClick={() => {
            resetForm();
            router.push('/');
          }}
          className="mt-8 inline-flex items-center gap-2 text-xs md:text-sm font-extrabold text-white/50 hover:text-white transition-all tracking-[0.25em] uppercase hover:gap-3 duration-300"
        >
          <ArrowLeft size={16} />
          <span>VỀ TRANG CHỦ</span>
        </button>
      </div>

      {/* Lời cảm ơn chân thành ở chân trang */}
      <p className="text-[10px] md:text-xs font-semibold text-white/15 tracking-[0.35em] uppercase mt-16 text-center">
        CẢM ƠN BẠN ĐÃ LỰA CHỌN PIZZA&PASTA INN
      </p>
    </div>
  );
}

// ── Component: Đặt hàng thất bại ──────────────────────────────────────────
function OrderFailure() {
  const { setStep, resetForm } = useOrderStore();
  const router = useRouter();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 select-none">
      {/* Icon tam giác cảnh báo đỏ phát sáng */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-[#2d0e10] rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse">
          <div className="w-12 h-12 bg-[#ef4444] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <AlertTriangle size={24} className="text-[#2d0e10] stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Tiêu đề chính */}
      <h2 className="text-2xl md:text-3xl font-black text-white text-center tracking-wide uppercase leading-tight">
        RẤT TIẾC, ĐƠN HÀNG <br />
        <span className="text-[#ef4444] drop-shadow-[0_0_12px_rgba(239,68,68,0.4)] block mt-1">CHƯA THỂ HOÀN TẤT!</span>
      </h2>

      {/* Subhead trạng thái lỗi */}
      <p className="text-center text-[11px] font-extrabold text-white/40 tracking-[0.25em] mt-3 uppercase">
        HỆ THỐNG GHI NHẬN SỰ CỐ GIÁN ĐOẠN
      </p>

      {/* Hộp nội dung chi tiết */}
      <div className="bg-[#121212] border border-white/[0.06] rounded-[24px] p-6 md:p-8 mt-8 space-y-6 shadow-2xl shadow-black/50">
        {/* Mục 1: Lý do lỗi */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center text-[#ef4444] flex-shrink-0 mt-0.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <CreditCard size={18} />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-extrabold text-white">Lý do gián đoạn thanh toán</h4>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium mt-1">
              Giao dịch chuyển khoản qua mã VietQR chưa được ghi nhận do kết nối từ phía ngân hàng bị gián đoạn hoặc hết thời gian chờ (Timeout). <strong className="font-extrabold text-white">Tài khoản ngân hàng của bạn hoàn toàn chưa bị trừ tiền.</strong>
            </p>
          </div>
        </div>

        {/* Mục 2: Giải pháp khắc phục */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981] flex-shrink-0 mt-0.5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-extrabold text-white">Giải pháp dành cho bạn</h4>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium mt-1">
              Để không làm gián đoạn bữa ăn, bạn có thể quay lại màn hình thanh toán để thử lại hoặc chọn phương thức <strong className="font-extrabold text-[#eab308]">Tiền mặt (COD)</strong> để được giao bánh trước, trả tiền sau.
            </p>
          </div>
        </div>
      </div>

      {/* Cụm nút hành động bên dưới */}
      <div className="mt-8 space-y-3 w-full">
        {/* Nút 1: Quay lại thử lại */}
        <button
          onClick={() => setStep('info')}
          className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm shadow-xl shadow-red-950/20 active:scale-[0.99]"
        >
          <RotateCcw size={16} />
          <span>QUAY LẠI TRANG THANH TOÁN VÀ THỬ LẠI</span>
        </button>

        {/* Nút 2: Gọi tổng đài trợ giúp */}
        <a
          href="tel:0287896770"
          className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-white/[0.05] hover:border-white/10 text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm shadow-xl hover:shadow-black/50 active:scale-[0.99]"
        >
          <Phone size={16} className="text-[#eab308]" />
          <span>GỌI TỔNG ĐÀI HỖ TRỢ ĐẶT HÀNG NGAY: 028 7896770</span>
        </a>
      </div>

      {/* Chân trang cam kết */}
      <p className="text-[10px] md:text-xs font-semibold text-white/15 tracking-[0.35em] uppercase mt-16 text-center">
        PIZZA&PASTA INN LUÔN SẴN SÀNG HỖ TRỢ BẠN HẾT MÌNH
      </p>
    </div>
  );
}

// ── Component: Xác thực thanh toán VietQR ────────────────────────────────────
function OrderPaymentModal() {
  const { totalPrice } = useCartStore();
  const { formData, setStep, submitOrder, vietqrAttempt, updateFormData, orderResult, cancelActiveOrder } = useOrderStore();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600 seconds)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const displayTotal = totalPrice();
  const shippingFee = formData.order_type === 'delivery' ? (formData.shipping_fee || 0) : 0;
  // Lấy tổng số tiền thực tế của đơn hàng (giá gốc + phí shipping)
  const totalOrder = orderResult?.total_order || (displayTotal + shippingFee);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      useOrderStore.setState({ vietqrAttempt: 1 });
      updateFormData({ payment_method: 'cod' });
      setStep('failure');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, setStep, updateFormData]);

  // Real bank payment polling check
  useEffect(() => {
    if (!orderResult?.order_id) return;

    let isMounted = true;
    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderResult.order_id}`);
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          const order = json.data;
          // Nếu đơn hàng đã được cập nhật thanh toán thành công trong database
          if (order.payment_status === 'paid' || order.order_status === 'confirmed') {
            if (isMounted) {
              setStep('success');
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi khi kiểm tra trạng thái thanh toán đơn hàng:', err);
      }
    };

    // Gọi kiểm tra ngay lập tức, sau đó polling mỗi 3 giây
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderResult, setStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0ab8] backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-5xl bg-[#0c0c0c] border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl text-white relative animate-scaleUp">

        {/* Close Button / Top header */}
        <button
          onClick={() => cancelActiveOrder()}
          className="absolute right-6 top-6 text-white/50 hover:text-white hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition focus:outline-none"
        >
          <span className="text-2xl font-light">&times;</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-4">

          {/* Cột trái: Mã QR Code */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Thẻ chứa QR Code bo góc dày viền vàng */}
            <div className="w-72 h-72 md:w-80 md:h-80 bg-white rounded-[32px] p-4 flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] border-4 border-white relative overflow-hidden">
              {orderResult?.order_id ? (
                <img
                  src={`https://qr.sepay.vn/img?acc=0944368230&bank=MB&amount=${totalOrder}&des=PIZZA_INN_${orderResult.order_id}`}
                  alt="Mã QR thanh toán VietQR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eab308]"></div>
                  <span className="text-[10px] md:text-xs text-black/40 font-bold uppercase tracking-wider">Đang tải mã QR...</span>
                </div>
              )}
            </div>

            {/* Pill đếm ngược thời gian hết hạn */}
            <div className="mt-5 bg-[#1a1408] border border-[#eab308]/20 px-5 py-2.5 rounded-full flex items-center gap-2 text-xs md:text-sm font-extrabold text-[#eab308] shadow-lg">
              <Clock size={16} className="animate-spin text-[#eab308]" style={{ animationDuration: '4s' }} />
              <span>Mã QR hết hạn sau: <span className="font-mono text-sm">{formatTime(timeLeft)}</span></span>
            </div>

            <p className="mt-4 text-[10px] md:text-xs text-white/40 italic font-medium">
              Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử để quét mã
            </p>
          </div>

          {/* Cột phải: Thông tin & Trạng thái thanh toán */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">

            {/* Nhãn bước cuối cùng */}
            <div className="self-start">
              <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                BƯỚC CUỐI CÙNG
              </span>
            </div>

            {/* Tiêu đề thanh toán */}
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide leading-tight mt-4">
              THANH TOÁN ĐƠN HÀNG <br />
              <span className="text-[#eab308] drop-shadow-[0_0_10px_rgba(234,179,8,0.25)]">QUA VIETQR</span>
            </h2>

            {/* Hộp 1: Số tiền & nội dung chuyển khoản */}
            <div className="bg-[#121212] border border-white/[0.06] rounded-[20px] p-5 mt-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-white/50 font-semibold">Số tiền cần thanh toán:</span>
                <span className="text-lg md:text-xl font-black text-[#eab308] tracking-wide">
                  {formatPrice(totalOrder)}
                </span>
              </div>
              <div className="border-t border-white/[0.04] pt-3 flex justify-between items-center text-xs md:text-sm">
                <span className="text-white/50 font-semibold">Nội dung chuyển khoản:</span>
                <span className="font-mono text-sm md:text-base font-extrabold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10 uppercase tracking-wider">
                  PIZZA_INN_{orderResult?.order_id}
                </span>
              </div>
            </div>

            {/* Hộp 2: Lưu ý dành cho bạn */}
            <div className="bg-[#121212] border border-white/[0.06] rounded-[20px] p-5 mt-4 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-[#eab308] font-extrabold text-xs md:text-sm">
                <Bell size={16} className="text-[#eab308]" />
                <span>Lưu ý dành cho bạn</span>
              </div>
              <div className="space-y-2 text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                <p>
                  Hệ thống đang tự động kiểm tra giao dịch của bạn. Đơn hàng sẽ chính thức được xác nhận khi tài khoản ghi nhận thanh toán thành công.
                </p>
                <p className="text-white/40">
                  Nếu quá 10 phút bạn chưa hoàn tất quét mã, đơn hàng sẽ tự động hủy.
                </p>
              </div>
            </div>

            {/* Hành động ở chân */}
            <div className="mt-8 space-y-3">
              {/* Nút Thay đổi phương thức */}
              <button
                onClick={() => cancelActiveOrder()}
                className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-[#eab308]/20 hover:border-[#eab308]/40 text-[#eab308] rounded-xl py-3.5 flex items-center justify-center gap-2 font-extrabold tracking-wider text-xs md:text-sm shadow-md transition-all active:scale-[0.99]"
              >
                <CreditCard size={16} />
                <span>THAY ĐỔI PHƯƠNG THỨC THANH TOÁN</span>
              </button>

              {/* Nút Hủy đơn hàng */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs font-extrabold text-red-500/80 hover:text-red-500 transition-all tracking-wider uppercase border border-red-500/20 bg-red-500/5 px-5 py-2.5 rounded-xl flex items-center gap-2 active:scale-[0.99]"
                >
                  <Trash2 size={14} />
                  <span>HỦY ĐẶT ĐƠN HÀNG NÀY</span>
                </button>
              </div>
            </div>

            {/* Custom Premium Confirm Modal Dialog */}
            {showCancelConfirm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-[3px] z-[10001] flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-[380px] p-6 shadow-2xl flex flex-col items-center text-center animate-scaleUp">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-4">
                    <AlertTriangle size={22} className="animate-pulse" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider mb-2">Xác nhận hủy đặt hàng</h3>
                  <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium mb-6">
                    Bạn có chắc chắn muốn hủy đặt đơn hàng này? Giỏ hàng của bạn sẽ được giữ nguyên.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#252525] border border-white/5 rounded-xl text-white font-extrabold text-xs md:text-sm transition-all duration-200 active:scale-[0.98]"
                    >
                      Trở lại
                    </button>
                    <button
                      onClick={() => cancelActiveOrder()}
                      className="flex-1 py-3 bg-[#cd3645] hover:bg-[#b52a38] text-white font-black text-xs md:text-sm rounded-xl transition-all duration-200 shadow-lg shadow-red-950/20 active:scale-[0.98]"
                    >
                      Hủy đơn
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

// ── Component: Modal Chọn Địa Chỉ ─────────────────────────────────────────
interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: any[];
  selectedAddressId: number | null;
  onSelect: (addr: any) => void;
  onAddNew: () => void;
  onEdit: (addr: any) => void;
}

function AddressSelectionModal({
  isOpen,
  onClose,
  addresses,
  selectedAddressId,
  onSelect,
  onAddNew,
  onEdit,
}: AddressSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-[580px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-100 transition-all">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-[16px] font-black text-white uppercase tracking-wider">Địa Chỉ Của Tôi</h3>
          <button className="text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition flex items-center justify-center focus:outline-none" onClick={onClose}>
            <span className="text-[22px] leading-none font-light">&times;</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin size={40} className="text-white/20 mb-3" />
              <p className="text-white/50 text-sm">Bạn chưa có địa chỉ giao hàng nào.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.user_address_id;
                return (
                  <div
                    key={addr.user_address_id}
                    className="flex items-start gap-4 py-5 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.01] transition px-2"
                    onClick={() => onSelect(addr)}
                  >
                    <div className={`mt-1.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-[#cd3645]' : 'border-white/30'}`}>
                      {isSelected && <div className="w-[10px] h-[10px] rounded-full bg-[#cd3645]" />}
                    </div>
                    <div className="flex-1 text-[13.5px] leading-relaxed">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-white">{addr.recipient_name}</span>
                        <span className="text-white/20">|</span>
                        <span className="text-white/60">{addr.recipient_phone}</span>
                      </div>
                      <div className="text-white/80 mb-1">{addr.address_detail}</div>
                      {addr.is_default && (
                        <span className="border border-[#cd3645] text-[#cd3645] text-[10px] px-1 rounded-sm font-bold uppercase inline-block">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between self-stretch">
                      <button
                        className="text-[#3b82f6] font-bold text-[13px] hover:underline focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(addr);
                        }}
                      >
                        Cập nhật
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-white/10 flex gap-4 bg-[#0d0d0d]">
          <button className="flex-1 flex items-center justify-center gap-2 p-3.5 border border-dashed border-white/20 rounded-xl text-white font-bold text-[14px] hover:border-[#cd3645] hover:text-[#cd3645] hover:bg-[#cd3645]/[0.03] transition-all focus:outline-none" onClick={onAddNew}>
            <span className="text-lg font-bold">+</span> Thêm Địa Chỉ Mới
          </button>
          <button className="flex-1 p-3.5 bg-gradient-to-r from-[#cd3645] to-[#a02030] rounded-xl text-white font-black text-[14px] hover:scale-[1.01] hover:shadow-lg hover:shadow-[#cd3645]/20 transition-all text-center focus:outline-none" onClick={onClose}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component: Modal Thêm/Sửa Địa Chỉ ──────────────────────────────────────
interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: any | null; // null for add, object for edit
  onSave: (payload: any) => void;
  onDelete?: (id: number) => void;
}

function AddressFormModal({
  isOpen,
  onClose,
  address,
  onSave,
  onDelete,
}: AddressFormModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [initialFormAddress, setInitialFormAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [coordLat, setCoordLat] = useState<number | null>(null);
  const [coordLon, setCoordLon] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  // Track if coords came from an explicit suggestion pick (vs loaded from existing address)
  const [coordsConfirmed, setCoordsConfirmed] = useState(false);

  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      if (address) {
        setName(address.recipient_name || '');
        setPhone(address.recipient_phone || '');
        setAddressDetail(address.address_detail || '');
        setInitialFormAddress(address.address_detail || '');
        setIsDefault(!!address.is_default);
        setCoordLat(address.latitude ?? null);
        setCoordLon(address.longitude ?? null);
        // Existing saved addresses with coords are considered confirmed
        setCoordsConfirmed(!!(address.latitude && address.longitude));
      } else {
        // Thêm mới: pre-fill từ profile user nếu đã đăng nhập
        setName(user?.username || '');
        setPhone(user?.phone || '');
        setAddressDetail('');
        setInitialFormAddress('');
        setIsDefault(false);
        setCoordLat(null);
        setCoordLon(null);
        setCoordsConfirmed(false);
      }
    }
  }, [address, isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Vui lòng nhập họ tên');
    if (!phone.trim()) return alert('Vui lòng nhập số điện thoại');
    if (!addressDetail.trim()) return alert('Vui lòng nhập/chọn địa chỉ giao hàng');

    let lat = coordLat;
    let lon = coordLon;

    // If no coordinates yet, try to geocode the address automatically before saving
    if (lat == null || lon == null) {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `${API_BASE}/shipping/geocode?q=${encodeURIComponent(addressDetail)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const feature = data.data[0];
            lon = feature.geometry?.coordinates?.[0] ?? feature.center?.[0] ?? null;
            lat = feature.geometry?.coordinates?.[1] ?? feature.center?.[1] ?? null;
            if (lat && lon) {
              setCoordLat(lat);
              setCoordLon(lon);
              setCoordsConfirmed(true);
            }
          }
        }
      } catch (err) {
        console.warn('[AddressForm] Auto-geocode failed, saving without coordinates:', err);
      } finally {
        setIsGeocoding(false);
      }
    }

    onSave({
      recipient_name: name,
      recipient_phone: phone,
      address_detail: addressDetail,
      is_default: isDefault,
      latitude: lat,
      longitude: lon,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-100 transition-all">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-[16px] font-black text-white uppercase tracking-wider">{address ? 'Cập Nhật Địa Chỉ' : 'Địa Chỉ Mới'}</h3>
          <button className="text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition flex items-center justify-center focus:outline-none" onClick={onClose}>
            <span className="text-[22px] leading-none font-light">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Họ tên người nhận (*)</label>
                <input
                  type="text"
                  className="checkout-input w-full"
                  placeholder="Nhập tên người nhận..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Số điện thoại (*)</label>
                <input
                  type="tel"
                  className="checkout-input w-full"
                  placeholder="Nhập số điện thoại..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Địa chỉ giao hàng (*)</label>
                  {/* Coordinate status badge */}
                  {coordsConfirmed ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>
                      Tọa độ đã xác nhận
                    </span>
                  ) : addressDetail.trim() ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>
                      Chọn gợi ý để chính xác hơn
                    </span>
                  ) : null}
                </div>
                <AddressPickerVN
                  initialAddress={initialFormAddress}
                  onChange={(val) => {
                    setAddressDetail(val);
                    // Clear coordinates when address text changes via typing (not suggestion pick)
                    // They will be re-set by onSelectCoordinates if user picks a suggestion
                    setCoordLat(null);
                    setCoordLon(null);
                    setCoordsConfirmed(false);
                  }}
                  onSelectCoordinates={(lat, lon) => {
                    setCoordLat(lat);
                    setCoordLon(lon);
                    setCoordsConfirmed(true);
                  }}
                />
                {!coordsConfirmed && addressDetail.trim() && (
                  <p className="mt-1.5 text-[11px] text-amber-400/80 leading-snug">
                    💡 Chọn địa chỉ từ danh sách gợi ý để lưu tọa độ chính xác và tính phí ship chuẩn hơn.
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-white/80 text-[13.5px] cursor-pointer user-select-none mt-2">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="cursor-pointer w-4 h-4 accent-[#cd3645]"
                  />
                  <span>Đặt làm địa chỉ mặc định</span>
                </label>
              </div>
            </div>
          </div>
          <div className="p-5 border-t border-white/10 flex gap-3 bg-[#0d0d0d]">
            {address && onDelete && (
              <button
                type="button"
                className="p-3.5 px-5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-[14px] hover:bg-red-500/15 hover:border-red-500 transition focus:outline-none"
                onClick={() => onDelete(address.user_address_id)}
              >
                Xóa
              </button>
            )}
            <button type="button" className="flex-1 p-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-[14px] hover:bg-white/10 transition text-center focus:outline-none" onClick={onClose} disabled={isGeocoding}>
              Trở Lại
            </button>
            <button
              type="submit"
              disabled={isGeocoding}
              className="flex-1 p-3.5 bg-gradient-to-r from-[#cd3645] to-[#a02030] rounded-xl text-white font-black text-[14px] hover:scale-[1.01] hover:shadow-lg hover:shadow-[#cd3645]/20 transition-all text-center focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isGeocoding ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Đang xác định vị trí...
                </>
              ) : 'Hoàn Thành'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





// ── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { step, formData, updateFormData, error, orderResult, setEmailVerified } = useOrderStore();
  const [isMounted, setIsMounted] = useState(false);

  // States cho address management
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Stores coordinates state
  const [stores, setStores] = useState<any[]>([]);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setLoadingAddresses(true);
    try {
      const res = await fetch(`${API_BASE}/addresses`, {
        headers: {
          'Authorization': `Bearer ${ token }`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.data);
        // Chọn địa chỉ mặc định
        const active = data.data.find((a: any) => a.is_default) || data.data[0];
        if (active) {
          updateFormData({
            user_address_id: active.user_address_id,
            customer_name: active.recipient_name,
            customer_phone: active.recipient_phone,
            customer_address: active.address_detail,
            customer_lat: active.latitude ?? null,
            customer_lon: active.longitude ?? null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  }, [token, updateFormData]);

  // Fetch active stores on mount
  useEffect(() => {
    fetch(`${API_BASE}/stores`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setStores(d.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching stores for distance calc:', err);
      });
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token, fetchAddresses]);

  // Đồng bộ thông tin user khi đăng nhập (name, phone, email)
  // Người dùng đã đăng nhập = đã xác thực email lúc đăng ký => auto verify
  useEffect(() => {
    if (user) {
      // User đã đăng nhập => email đã xác thực
      setEmailVerified(true);

      const updates: Record<string, any> = {};
      if (user.email && !formData.customer_email) {
        updates.customer_email = user.email;
      }
      if (user.username && !formData.customer_name) {
        updates.customer_name = user.username;
      }
      if (user.phone && !formData.customer_phone) {
        updates.customer_phone = user.phone;
      }
      if (Object.keys(updates).length > 0) {
        updateFormData(updates);
      }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps



  const handleSaveAddress = async (payload: {
    recipient_name: string;
    recipient_phone: string;
    address_detail: string;
    is_default: boolean;
    latitude: number | null;
    longitude: number | null;
  }) => {
    if (!token) return;
    try {
      const url = editingAddress
        ? `${API_BASE}/addresses/${editingAddress.user_address_id}`
        : `${API_BASE}/addresses`;
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ token }`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAddresses();
        setShowFormModal(false);
        setEditingAddress(null);
      } else {
        alert(data.message || 'Lỗi khi lưu địa chỉ');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Không thể kết nối đến máy chủ');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      const res = await fetch(`${API_BASE}/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ token }`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAddresses();
        setShowFormModal(false);
        setEditingAddress(null);
      } else {
        alert(data.message || 'Lỗi khi xóa địa chỉ');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Không thể kết nối đến máy chủ');
    }
  };

  if (!isMounted) return null;

  // Success page
  if (step === 'success') {
    return (
      <div className="checkout-page flex items-center justify-center min-h-screen">
        <OrderSuccess />
      </div>
    );
  }

  // Failure page
  if (step === 'failure') {
    return (
      <div className="checkout-page flex items-center justify-center min-h-screen">
        <OrderFailure />
      </div>
    );
  }

  // Payment page (kept for backward compatibility but no longer used in normal flow)
  // VietQR payment is now handled via email QR code
  if (step === 'payment') {
    return (
      <div className="checkout-page flex items-center justify-center min-h-screen">
        <OrderPaymentModal />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <button className="checkout-back-btn" onClick={() => router.back()}>
          <ArrowLeft size={24} />
          <span>THANH TOÁN ĐƠN HÀNG CỦA BẠN</span>
        </button>
      </div>

      {/* Error global */}
      {error && (
        <div className="checkout-global-error">
          {error}
        </div>
      )}

      <div className="checkout-content">
        {/* Left column */}
        <div className="checkout-left">
          {(!user || formData.order_type === 'pickup') && <CustomerInfoSection />}
          <DeliveryMethodSection
            isLoggedIn={!!user}
            addresses={addresses}
            loadingAddresses={loadingAddresses}
            onOpenAddressModal={() => setShowAddressModal(true)}
            stores={stores}
          />
          <div className="checkout-row">
            <ScheduleSection />
            <NoteSection />
          </div>
        </div>

        {/* Right column - Order Summary */}
        <div className="checkout-right">
          <OrderSummary />
        </div>
      </div>

      {/* Modals cho member address management */}
      <AddressSelectionModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        addresses={addresses}
        selectedAddressId={formData.user_address_id || null}
        onSelect={(addr) => {
          updateFormData({
            user_address_id: addr.user_address_id,
            customer_name: addr.recipient_name,
            customer_phone: addr.recipient_phone,
            customer_address: addr.address_detail,
            customer_lat: addr.latitude ?? null,
            customer_lon: addr.longitude ?? null,
          });
          setShowAddressModal(false);
        }}
        onAddNew={() => {
          setEditingAddress(null);
          setShowFormModal(true);
        }}
        onEdit={(addr) => {
          setEditingAddress(addr);
          setShowFormModal(true);
        }}
      />

      <AddressFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingAddress(null);
        }}
        address={editingAddress}
        onSave={handleSaveAddress}
        onDelete={handleDeleteAddress}
      />
    </div>
  );
}
