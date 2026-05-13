'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Phone, Mail, User, Clock, FileText, CreditCard, Store, Truck, Package, CheckCircle, QrCode } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';

// ── Component: Thông tin người nhận ─────────────────────────────────────────
function CustomerInfoSection() {
  const { formData, updateFormData, error } = useOrderStore();

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
          placeholder="Nguyễn Văn A"
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
            placeholder="090xxxxxxx"
            value={formData.customer_phone}
            onChange={(e) => updateFormData({ customer_phone: e.target.value })}
          />
        </div>
        <div className="checkout-form-group">
          <label className="checkout-label">EMAIL (NHẬN THÔNG BÁO)</label>
          <input
            type="email"
            className="checkout-input"
            placeholder="example@gmail.com"
            value={formData.customer_email}
            onChange={(e) => updateFormData({ customer_email: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// ── Component: Phương thức nhận hàng ────────────────────────────────────────
function DeliveryMethodSection() {
  const { formData, updateFormData } = useOrderStore();
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    if (formData.order_type === 'pickup') {
      fetch('http://localhost:4000/api/stores')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) setStores(d.data);
        })
        .catch(() => {});
    }
  }, [formData.order_type]);

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
          <div className="checkout-form-group">
            <div className="checkout-input-icon">
              <MapPin size={16} className="checkout-input-icon-svg" />
              <input
                type="text"
                className="checkout-input with-icon"
                placeholder="Nhập địa chỉ: Số nhà, tên đường, phường/xã..."
                value={formData.customer_address}
                onChange={(e) => updateFormData({ customer_address: e.target.value })}
              />
            </div>
          </div>

          <div className="checkout-shipping-info">
            <div className="checkout-shipping-badge">
              <span className="checkout-shipping-icon">🚚</span>
              <div>
                <p className="checkout-shipping-label">PHÍ GIAO HÀNG DỰ KIẾN</p>
                <p className="checkout-shipping-detail">Dưới 5km: Miễn phí hoàn toàn</p>
              </div>
            </div>
            <span className="checkout-shipping-price">0 đ</span>
          </div>
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
        <div className="checkout-schedule-inputs">
          <input
            type="date"
            className="checkout-input checkout-input-small"
            value={formData.scheduled_date}
            onChange={(e) => updateFormData({ scheduled_date: e.target.value })}
          />
          <input
            type="time"
            className="checkout-input checkout-input-small"
            value={formData.scheduled_time}
            onChange={(e) => updateFormData({ scheduled_time: e.target.value })}
          />
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
        placeholder="Lấy thêm tương cà, tôi nơi gọi số này..."
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
  const { step, setStep, isSubmitting } = useOrderStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const displayItems = isMounted ? items : [];
  const displayTotal = isMounted ? totalPrice() : 0;
  const displayCount = isMounted ? totalItems() : 0;
  const shippingFee = 0;

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
              {item.options?.size && <p>SIZE {item.options.size}{item.options?.crust ? ` - ${item.options.crust}` : ''}</p>}
            </div>
            <span className="checkout-summary-item-price">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="checkout-summary-totals">
        <div className="checkout-summary-row">
          <span>TẠM TÍNH</span>
          <span>{formatPrice(displayTotal)}</span>
        </div>
        <div className="checkout-summary-row">
          <span>PHÍ VẬN CHUYỂN</span>
          <span className="checkout-free-text">MIỄN PHÍ</span>
        </div>
        <div className="checkout-summary-total-row">
          <span>TOTAL PRICE</span>
          <span className="checkout-total-price">{formatPrice(displayTotal + shippingFee)}</span>
        </div>
      </div>

      {step === 'info' && (
        <button
          className="checkout-pay-btn"
          onClick={() => setStep('payment')}
          disabled={displayItems.length === 0}
        >
          PAY NOW: {formatPrice(displayTotal + shippingFee)}
        </button>
      )}
    </div>
  );
}

// ── Component: Phương thức thanh toán ────────────────────────────────────────
function PaymentSection() {
  const { formData, updateFormData, submitOrder, isSubmitting, error } = useOrderStore();
  const totalPrice = useCartStore((s) => s.totalPrice());

  return (
    <div className="checkout-card checkout-payment-card">
      <div className="checkout-card-header">
        <div className="checkout-icon-badge payment">
          <CreditCard size={18} />
        </div>
        <h3>4. PHƯƠNG THỨC THANH TOÁN</h3>
      </div>

      <div className="checkout-payment-options">
        {/* VietQR */}
        <label className={`checkout-payment-option ${formData.payment_method === 'vietqr' ? 'selected' : ''}`}>
          <div className="checkout-payment-option-header">
            <QrCode size={18} />
            <span>CHUYỂN KHOẢN VIETQR</span>
          </div>
          <input
            type="radio"
            name="payment"
            value="vietqr"
            checked={formData.payment_method === 'vietqr'}
            onChange={() => updateFormData({ payment_method: 'vietqr' })}
            className="checkout-radio-input"
          />
          <span className={`checkout-radio-dot ${formData.payment_method === 'vietqr' ? 'active' : ''}`} />
        </label>

        {/* QR Code preview (khi chọn VietQR) */}
        {formData.payment_method === 'vietqr' && (
          <div className="checkout-qr-preview">
            <div className="checkout-qr-image">
              <QrCode size={120} strokeWidth={1} />
            </div>
            <div className="checkout-qr-info">
              <p className="checkout-qr-amount">SỐ TIỀN CẦN THANH TOÁN</p>
              <p className="checkout-qr-price">{formatPrice(totalPrice)}</p>
              <p className="checkout-qr-note">*Nội dung: PIZZA_INN_0348</p>
            </div>
          </div>
        )}

        {/* COD */}
        <label className={`checkout-payment-option ${formData.payment_method === 'cod' ? 'selected' : ''}`}>
          <div className="checkout-payment-option-header">
            <Package size={18} />
            <span>TIỀN MẶT (COD)</span>
          </div>
          <div className="checkout-payment-option-desc">THANH TOÁN KHI NHẬN HÀNG</div>
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={formData.payment_method === 'cod'}
            onChange={() => updateFormData({ payment_method: 'cod' })}
            className="checkout-radio-input"
          />
          <span className={`checkout-radio-dot ${formData.payment_method === 'cod' ? 'active' : ''}`} />
        </label>
      </div>

      {error && <p className="checkout-error">{error}</p>}

      <button
        className="checkout-confirm-btn"
        onClick={submitOrder}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="checkout-spinner" />
        ) : (
          'XÁC NHẬN THANH TOÁN'
        )}
      </button>
    </div>
  );
}

// ── Component: Đặt hàng thành công ──────────────────────────────────────────
function OrderSuccess() {
  const { orderResult, formData, resetForm } = useOrderStore();
  const router = useRouter();

  if (!orderResult) return null;

  return (
    <div className="checkout-success-page">
      <div className="checkout-success-header">
        <div className="checkout-success-icon">
          <CheckCircle size={64} />
        </div>
        <h2>ĐẶT HÀNG <span className="text-green-400">THÀNH CÔNG!</span></h2>
        <p className="checkout-success-orderid">MÃ ĐƠN HÀNG: #PIZZA-{orderResult.order_id}</p>
      </div>

      <div className="checkout-success-grid">
        {/* Thông tin giao nhận */}
        <div className="checkout-success-card">
          <h4 className="checkout-success-card-title">THÔNG TIN GIAO NHẬN</h4>
          <div className="checkout-success-detail">
            <span className="checkout-detail-label">NGƯỜI NHẬN</span>
            <span>{formData.customer_name} - {formData.customer_phone}</span>
          </div>
          {formData.customer_address && (
            <div className="checkout-success-detail">
              <span className="checkout-detail-label">ĐỊA CHỈ / CHI NHÁNH</span>
              <span>{formData.customer_address}</span>
            </div>
          )}
          <div className="checkout-success-detail">
            <span className="checkout-detail-label">THỜI GIAN</span>
            <span>{formData.deliver_now ? 'Giao ngay lập tức' : `${formData.scheduled_date} ${formData.scheduled_time}`}</span>
          </div>
          <div className="checkout-success-detail">
            <span className="checkout-detail-label">HÌNH THỨC</span>
            <span>{orderResult.order_type === 'delivery' ? 'GIAO TẬN NƠI' : 'ĐẾN LẤY TẠI QUÁN'}</span>
          </div>
        </div>

        {/* Chi tiết thanh toán */}
        <div className="checkout-success-card">
          <h4 className="checkout-success-card-title">CHI TIẾT THANH TOÁN</h4>
          <div className="checkout-success-detail">
            <span className="checkout-detail-label">PHƯƠNG THỨC</span>
            <span className="text-green-400">
              {orderResult.payment_method === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt (COD)'}
            </span>
          </div>
          <div className="checkout-success-detail mt-4">
            <span>TẠM TÍNH</span>
            <span>{formatPrice(orderResult.total_order)}</span>
          </div>
          <div className="checkout-success-detail">
            <span>PHÍ VẬN CHUYỂN</span>
            <span className="checkout-free-text">MIỄN PHÍ</span>
          </div>
          <div className="checkout-success-total">
            <span>TỔNG CỘNG</span>
            <span className="checkout-total-price">{formatPrice(orderResult.total_order)}</span>
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      {formData.order_note && (
        <div className="checkout-success-note">
          <div className="checkout-success-note-icon">📝</div>
          <div>
            <p className="checkout-success-note-label">GHI CHÚ CỦA BẠN:</p>
            <p className="checkout-success-note-text">&quot;{formData.order_note}&quot;</p>
          </div>
        </div>
      )}

      <div className="checkout-success-actions">
        <button
          className="checkout-success-btn primary"
          onClick={() => {
            resetForm();
            router.push('/');
          }}
        >
          VỀ TRANG CHỦ
        </button>
      </div>
    </div>
  );
}

// ── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { step, setStep, error } = useOrderStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  // Success page
  if (step === 'success') {
    return (
      <div className="checkout-page">
        <OrderSuccess />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <button className="checkout-back-btn" onClick={() => {
          if (step === 'payment') {
            setStep('info');
          } else {
            router.back();
          }
        }}>
          <ArrowLeft size={24} />
          <span>THANH TOÁN ĐƠN HÀNG CỦA BẠN</span>
        </button>
        <span className="checkout-breadcrumb">THANH TOÁN ĐƠN HÀNG</span>
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
          {step === 'info' && (
            <>
              <CustomerInfoSection />
              <DeliveryMethodSection />
              <div className="checkout-row">
                <ScheduleSection />
                <NoteSection />
              </div>
            </>
          )}

          {step === 'payment' && <PaymentSection />}
        </div>

        {/* Right column - Order Summary */}
        <div className="checkout-right">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
