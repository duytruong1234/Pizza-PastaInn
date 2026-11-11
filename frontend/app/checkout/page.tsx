'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Phone, Mail, User, Clock, FileText, CreditCard, Store, Truck, Package, QrCode, AlertTriangle, RotateCcw, BookOpen, Bell, Trash2, Ticket, Award, Printer, ChevronDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { printOrderReceipt } from '@/lib/printReceipt';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { useUI } from '@/components/UIProvider';
import AddressPickerVN from '@/components/AddressPickerVN';
import PizzaTracker, { PizzaTrackerOrder } from '@/components/PizzaTracker';
import { API_BASE } from '@/lib/config';

// ── Component: Thông tin người nhận ─────────────────────────────────────────
function CustomerInfoSection() {
  const { formData, updateFormData } = useOrderStore();
  const { lang } = useUI();

  return (
    <div className="checkout-card">
      <div className="checkout-card-header">
        <div className="checkout-icon-badge">
          <User size={18} />
        </div>
        <h3>{lang === 'en' ? 'RECIPIENT INFORMATION' : 'THÔNG TIN NGƯỜI NHẬN'}</h3>
      </div>

      <div className="checkout-form-group">
        <label className="checkout-label">{lang === 'en' ? 'RECIPIENT FULL NAME (*)' : 'HỌ VÀ TÊN NGƯỜI NHẬN (*)'}</label>
        <input
          type="text"
          className="checkout-input"
          placeholder={lang === 'en' ? 'Enter recipient full name...' : 'Nhập họ và tên người nhận...'}
          value={formData.customer_name}
          onChange={(e) => updateFormData({ customer_name: e.target.value })}
        />
      </div>

      <div className="checkout-form-row">
        <div className="checkout-form-group mb-0">
          <label className="checkout-label">{lang === 'en' ? 'PHONE NUMBER (*)' : 'SỐ ĐIỆN THOẠI (*)'}</label>
          <input
            type="tel"
            className="checkout-input"
            placeholder={lang === 'en' ? 'Enter phone number...' : 'Nhập số điện thoại...'}
            value={formData.customer_phone}
            onChange={(e) => updateFormData({ customer_phone: e.target.value })}
          />
        </div>
        <div className="checkout-form-group mb-0">
          <label className="checkout-label">EMAIL (*)</label>
          <input
            type="email"
            className="checkout-input"
            placeholder={lang === 'en' ? 'Enter email address...' : 'Nhập địa chỉ email...'}
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
  const { lang } = useUI();

  return (
    <div className="checkout-form-group mb-0">
      <label className="checkout-label">{lang === 'en' ? 'DELIVERY ADDRESS (*)' : 'ĐỊA CHỈ GIAO HÀNG (*)'}</label>
      <AddressPickerVN
        initialAddress={formData.customer_address}
        onChange={(fullAddress) => {
          updateFormData({
            customer_address: fullAddress,
            customer_lat: null,
            customer_lon: null,
          });
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
  onOpenAddressModal,
  stores,
  isCalculatingDistance = false,
}: {
  isLoggedIn: boolean;
  addresses: any[];
  loadingAddresses: boolean;
  onOpenAddressModal: () => void;
  stores: any[];
  isCalculatingDistance?: boolean;
}) {
  const { formData, updateFormData } = useOrderStore();
  const { user } = useAuthStore();
  const { theme, lang } = useUI();
  const isLight = theme === 'light';

  const activeAddress = addresses.find(a => a.user_address_id === formData.user_address_id) || addresses.find(a => a.is_default) || addresses[0];

  return (
    <div className="checkout-card">
      {/* Tabs */}
      <div className="checkout-delivery-tabs">
        <button
          type="button"
          className={`checkout-tab ${formData.order_type === 'delivery' ? 'active' : ''}`}
          onClick={() => updateFormData({ order_type: 'delivery' })}
        >
          <Truck size={16} />
          <span>{lang === 'en' ? 'HOME DELIVERY' : 'GIAO HÀNG TẬN NƠI'}</span>
        </button>
        <button
          type="button"
          className={`checkout-tab ${formData.order_type === 'pickup' ? 'active' : ''}`}
          onClick={() => updateFormData({ order_type: 'pickup' })}
        >
          <Store size={16} />
          <span>{lang === 'en' ? 'STORE PICKUP' : 'NHẬN TẠI CỬA HÀNG'}</span>
        </button>
      </div>

      {/* Delivery content */}
      {formData.order_type === 'delivery' && (
        <div className="checkout-delivery-content">
          {isLoggedIn ? (
            <div className="checkout-address-box rounded-xl overflow-hidden">
              <div className="checkout-envelope-border" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 text-[#cd3645] font-extrabold text-[13px] uppercase tracking-wider">
                    <MapPin size={16} />
                    <span>{lang === 'en' ? 'Delivery Address' : 'Địa chỉ nhận hàng'}</span>
                  </div>
                  <button
                    type="button"
                    className="checkout-change-address-btn"
                    onClick={onOpenAddressModal}
                  >
                    {lang === 'en' ? 'Change' : 'Thay đổi'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-[15px] checkout-text-primary">
                      {formData.customer_name || activeAddress?.recipient_name || (lang === 'en' ? 'No recipient name yet' : 'Chưa có tên người nhận')}
                    </span>
                    {(formData.customer_phone || activeAddress?.recipient_phone) && (
                      <span className="checkout-phone-pill">
                        {formData.customer_phone || activeAddress?.recipient_phone}
                      </span>
                    )}
                    {activeAddress?.is_default && (
                      <span className="bg-[#cd3645]/15 border border-[#cd3645]/40 text-[#f87171] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {lang === 'en' ? 'Default' : 'Mặc định'}
                      </span>
                    )}
                  </div>
                  <p className="checkout-text-secondary text-[13.5px]">
                    {formData.customer_address || activeAddress?.address_detail || (lang === 'en' ? 'No delivery address selected' : 'Chưa chọn địa chỉ giao hàng')}
                  </p>
                  <p className="checkout-text-muted text-[12px]">
                    {lang === 'en' ? 'Receipt email: ' : 'Email nhận hóa đơn: '}
                    {formData.customer_email || user?.email || (lang === 'en' ? 'Not set' : 'Chưa cập nhật')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AddressMapSelector />
          )}

          {/* Hiển thị chi nhánh gần nhất & phí giao hàng tự động */}
          {formData.customer_address && formData.customer_address.trim().length >= 4 && (
            <div
              className={`mt-3.5 rounded-xl border px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-2 transition-all ${
                isLight
                  ? 'bg-emerald-50/70 border-emerald-200 text-[#1c1208]'
                  : 'bg-emerald-500/[0.07] border-emerald-500/25 text-white/90'
              }`}
            >
              {isCalculatingDistance ? (
                <div className="flex items-center gap-2 font-semibold text-[#10b981]">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'en' ? 'Finding nearest branch and calculating shipping fee...' : 'Đang xác định chi nhánh gần nhất và tính phí giao hàng...'}</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">
                      {lang === 'en' ? 'Serving branch: ' : 'Chi nhánh phục vụ: '}
                      <span className="text-[#10b981] font-extrabold">
                        {formData.nearest_store_name || (lang === 'en' ? 'Main Branch' : 'Chi nhánh trung tâm')}
                      </span>
                    </span>
                    {formData.distance ? (
                      <span className={isLight ? 'text-[#5c4d3c]' : 'text-white/60'}>
                        {lang === 'en' ? 'Estimated distance: ' : 'Khoảng cách ước tính: '}
                        <strong>{(formData.distance / 1000).toFixed(1)} km</strong>
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] uppercase tracking-wider border ${
                      (formData.shipping_fee || 0) > 0
                        ? isLight
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-amber-500/15 border-amber-500/30 text-[#f5c043]'
                        : 'bg-[#10b981]/15 border-[#10b981]/30 text-[#10b981]'
                    }`}
                  >
                    {(formData.shipping_fee || 0) > 0
                      ? lang === 'en'
                        ? `Delivery fee: ${formatPrice(formData.shipping_fee || 0)} (> 4km)`
                        : `Phí giao hàng: ${formatPrice(formData.shipping_fee || 0)} (> 4km)`
                      : lang === 'en'
                        ? 'Free delivery (<= 4km)'
                        : 'Miễn phí giao hàng (<= 4km)'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pickup content */}
      {formData.order_type === 'pickup' && (
        <div className="checkout-pickup-content">
          {stores.length === 0 ? (
            <p className="checkout-empty-text">{lang === 'en' ? 'Loading branches...' : 'Đang tải danh sách chi nhánh...'}</p>
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
  const { theme, lang } = useUI();
  const isLight = theme === 'light';

  // 1. Tạo danh sách 7 ngày từ ngày đặt (Hôm nay + 6 ngày kế tiếp)
  const dateOptions: { display: string; value: string }[] = [];
  const daysOfWeek = lang === 'en'
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const todayDate = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(todayDate.getDate() + i);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let prefix = '';
    if (i === 0) prefix = lang === 'en' ? ' (Today)' : ' (Hôm nay)';
    else if (i === 1) prefix = lang === 'en' ? ' (Tomorrow)' : ' (Ngày mai)';
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
    for (const min of [0, 15, 30, 45]) {
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

  // Kiểm tra giờ hoạt động giao ngay (09:30 - 21:30)
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();
  const isOutsideOpeningHours = currentTotalMins < 9 * 60 + 30 || currentTotalMins > 21 * 60 + 30;

  useEffect(() => {
    if (isOutsideOpeningHours && formData.deliver_now) {
      updateFormData({ deliver_now: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOutsideOpeningHours]);

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
  }, [formData.deliver_now, formData.scheduled_date]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="checkout-card checkout-card-half flex flex-col">
      <h3 className="checkout-section-title flex items-center gap-2">
        <Clock size={15} />
        <span>{lang === 'en' ? 'DELIVERY TIME' : 'THỜI GIAN NHẬN HÀNG'}</span>
      </h3>
      {isOutsideOpeningHours && (
        <div
          className={`mb-3 px-3 py-2 rounded-xl border text-[11.5px] font-semibold leading-snug ${
            isLight
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
          }`}
        >
          {lang === 'en'
            ? 'Outside instant delivery hours (09:30 – 21:30). Please schedule a pickup/delivery time.'
            : 'Ngoài khung giờ giao ngay (09:30 – 21:30). Vui lòng chọn giờ nhận bánh trước.'}
        </div>
      )}
      <div className="checkout-radio-group flex-1">
        <label className={`checkout-schedule-option ${formData.deliver_now ? 'active' : ''} ${isOutsideOpeningHours ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="radio"
            name="schedule"
            disabled={isOutsideOpeningHours}
            checked={formData.deliver_now}
            onChange={() => updateFormData({ deliver_now: true })}
            className="checkout-radio-input"
          />
          <span className="checkout-radio-custom" />
          <div className="flex flex-col">
            <span className="font-bold text-[13.5px] checkout-text-primary">{lang === 'en' ? 'Deliver Now' : 'Giao ngay'}</span>
            <span className="text-[11.5px] checkout-text-muted">{lang === 'en' ? 'Estimated in 30 - 45 minutes' : 'Dự kiến giao trong 30 - 45 phút'}</span>
          </div>
        </label>
        <label className={`checkout-schedule-option ${!formData.deliver_now ? 'active' : ''}`}>
          <input
            type="radio"
            name="schedule"
            checked={!formData.deliver_now}
            onChange={() => updateFormData({ deliver_now: false })}
            className="checkout-radio-input"
          />
          <span className="checkout-radio-custom" />
          <div className="flex flex-col">
            <span className="font-bold text-[13.5px] checkout-text-primary">{lang === 'en' ? 'Schedule Delivery' : 'Hẹn giờ nhận hàng'}</span>
            <span className="text-[11.5px] checkout-text-muted">{lang === 'en' ? 'Choose a convenient date and time' : 'Chọn ngày và khung giờ phù hợp'}</span>
          </div>
        </label>
      </div>

      {!formData.deliver_now && (
        <div className="checkout-schedule-inputs flex gap-3 mt-3">
          <div className="relative flex-1">
            <select
              className="checkout-input w-full appearance-none pr-8 cursor-pointer text-[13px]"
              value={formData.scheduled_date}
              onChange={(e) => updateFormData({ scheduled_date: e.target.value })}
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className={isLight ? 'bg-white text-[#1c1208]' : 'bg-zinc-900 text-white'}>
                  {opt.display}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none checkout-text-muted flex items-center">
              <ChevronDown size={14} />
            </div>
          </div>

          <div className="relative flex-1">
            <select
              className="checkout-input w-full appearance-none pr-8 cursor-pointer text-[13px]"
              value={formData.scheduled_time}
              onChange={(e) => updateFormData({ scheduled_time: e.target.value })}
            >
              {timeOptions.map((t) => (
                <option key={t} value={t} className={isLight ? 'bg-white text-[#1c1208]' : 'bg-zinc-900 text-white'}>
                  {t}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none checkout-text-muted flex items-center">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component: Ghi chú & Tùy chọn phục vụ Pizza ─────────────────────────────
const CONDIMENT_OPTIONS = [
  { key: 'Tương ớt', vi: 'Tương ớt', en: 'Chili Sauce' },
  { key: 'Tương cà', vi: 'Tương cà', en: 'Ketchup' },
  { key: 'Bột ớt khô', vi: 'Bột ớt khô', en: 'Chili Flakes' },
  { key: 'Lá Oregano', vi: 'Lá Oregano', en: 'Oregano' },
];
const CUT_OPTIONS = [
  { key: 'Cắt 6 miếng', vi: 'Cắt 6 miếng', en: '6 Slices' },
  { key: 'Cắt 4 miếng', vi: 'Cắt 4 miếng', en: '4 Slices' },
  { key: 'Cắt 8 miếng', vi: 'Cắt 8 miếng', en: '8 Slices' },
  { key: 'Cắt vuông', vi: 'Cắt vuông', en: 'Square Cut' },
];

function NoteSection() {
  const { updateFormData } = useOrderStore();
  const { theme, lang } = useUI();
  const isLight = theme === 'light';

  const [selectedCondiments, setSelectedCondiments] = useState<string[]>(['Tương ớt', 'Tương cà']);
  const [selectedCut, setSelectedCut] = useState<string>('Cắt 6 miếng');
  const [takeCutlery, setTakeCutlery] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>('');

  useEffect(() => {
    const parts: string[] = [];
    if (selectedCondiments.length > 0) {
      parts.push(`Gia vị: ${selectedCondiments.join(', ')}`);
    } else {
      parts.push('Không lấy gia vị');
    }
    if (selectedCut) {
      parts.push(selectedCut);
    }
    parts.push(takeCutlery ? 'Lấy dao nĩa/khăn giấy' : 'Không lấy đồ nhựa');

    const prefix = `[${parts.join(' • ')}]`;
    const trimmedCustom = customNote.trim();
    updateFormData({
      order_note: trimmedCustom ? `${prefix} ${trimmedCustom}` : prefix,
    });
  }, [selectedCondiments, selectedCut, takeCutlery, customNote, updateFormData]);

  const toggleCondiment = (item: string) => {
    setSelectedCondiments((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  return (
    <div className="checkout-card checkout-card-half flex flex-col">
      <h3 className="checkout-section-title flex items-center gap-2">
        <FileText size={15} />
        <span>{lang === 'en' ? 'SERVING OPTIONS & NOTES' : 'TÙY CHỌN PHỤC VỤ & GHI CHÚ'}</span>
      </h3>

      {/* Tùy chọn gia vị kèm */}
      <div className="mb-2.5">
        <span className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 ${isLight ? 'text-[#5c4d3c]' : 'text-white/60'}`}>
          {lang === 'en' ? 'Free condiments:' : 'Gia vị kèm miễn phí:'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CONDIMENT_OPTIONS.map((c) => {
            const active = selectedCondiments.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleCondiment(c.key)}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-[#cd3645] text-white border-[#cd3645] shadow-xs'
                    : isLight
                      ? 'bg-stone-100 text-[#5c4d3c] border-stone-200 hover:bg-stone-200/70'
                      : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                {lang === 'en' ? c.en : c.vi}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kiểu cắt bánh & Dụng cụ ăn uống */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {CUT_OPTIONS.map((cut) => {
            const active = selectedCut === cut.key;
            return (
              <button
                key={cut.key}
                type="button"
                onClick={() => setSelectedCut(cut.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  active
                    ? isLight
                      ? 'bg-[#007a3f] text-white border-[#007a3f]'
                      : 'bg-[#f5c043] text-zinc-950 border-[#f5c043]'
                    : isLight
                      ? 'bg-stone-100 text-[#5c4d3c] border-stone-200 hover:bg-stone-200/70'
                      : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                {lang === 'en' ? cut.en : cut.vi}
              </button>
            );
          })}
        </div>

        <label className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold cursor-pointer select-none ${isLight ? 'text-[#1c1208]' : 'text-white/85'}`}>
          <input
            type="checkbox"
            checked={takeCutlery}
            onChange={(e) => setTakeCutlery(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#cd3645] cursor-pointer"
          />
          <span>{lang === 'en' ? 'Include plastic cutlery' : 'Lấy dao nĩa nhựa'}</span>
        </label>
      </div>

      <textarea
        className="checkout-textarea flex-1"
        placeholder={lang === 'en' ? 'Additional notes for kitchen or driver (e.g. bake crispier, call before arriving...)' : 'Ghi chú thêm cho bếp hoặc tài xế (ví dụ: nướng giòn hơn, gọi điện trước khi giao...)'}
        value={customNote}
        onChange={(e) => setCustomNote(e.target.value)}
        rows={2}
      />
    </div>
  );
}

// ── Component: Tóm tắt đơn hàng (sidebar) ─────────────────────────────────
function OrderSummary() {
  const { items, totalItems, totalPrice } = useCartStore();
  const { formData, submitOrder, isSubmitting, updateFormData, error, setEmailVerified } = useOrderStore();
  const { user, token } = useAuthStore();
  const { theme, lang, td } = useUI();
  const isLight = theme === 'light';
  const [isMounted, setIsMounted] = useState(false);

  // Voucher & Loyalty states
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [voucherInput, setVoucherInput] = useState(formData.voucher_code || '');
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<any | null>(null);

  // OTP state for guest checkout
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    fetch(`${API_BASE}/vouchers`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setAvailableVouchers(d.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) {
      setLoyaltyData(null);
      return;
    }
    fetch(`${API_BASE}/vouchers/loyalty`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setLoyaltyData(d.data);
        }
      })
      .catch(() => {});
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const displayItems = isMounted ? items : [];
  const displayTotal = isMounted ? totalPrice() : 0;
  const displayCount = isMounted ? totalItems() : 0;
  const hasDeliveryAddress = Boolean(formData.customer_address && formData.customer_address.trim().length >= 4);
  const activeShippingFee =
    formData.order_type === 'delivery' && hasDeliveryAddress ? (formData.shipping_fee || 0) : 0;
  const totalDiscount = Math.min(
    displayTotal + activeShippingFee,
    (formData.voucher_discount || 0) + (formData.points_discount || 0)
  );
  const finalTotal = Math.max(0, displayTotal + activeShippingFee - totalDiscount);

  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = (codeToApply ?? voucherInput).trim().toUpperCase();
    if (!code) {
      setVoucherMessage({ type: 'error', text: lang === 'en' ? 'Please enter or select a promo code' : 'Vui lòng nhập hoặc chọn mã giảm giá' });
      return;
    }
    setVoucherInput(code);
    setApplyingVoucher(true);
    setVoucherMessage(null);
    try {
      const res = await fetch(`${API_BASE}/vouchers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal: displayTotal,
          shipping_fee: activeShippingFee,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        updateFormData({
          voucher_code: code,
          voucher_discount: json.data.discount_amount || 0,
        });
        setVoucherMessage({ type: 'success', text: json.message });
      } else {
        updateFormData({ voucher_code: '', voucher_discount: 0 });
        setVoucherMessage({ type: 'error', text: json.message || (lang === 'en' ? 'Invalid promo code' : 'Mã giảm giá không hợp lệ') });
      }
    } catch {
      setVoucherMessage({ type: 'error', text: lang === 'en' ? 'Connection error while verifying promo code' : 'Lỗi kết nối khi kiểm tra mã giảm giá' });
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherInput('');
    setVoucherMessage(null);
    updateFormData({ voucher_code: '', voucher_discount: 0 });
  };

  const handleToggleLoyaltyPoints = (checked: boolean) => {
    if (!checked || !loyaltyData?.available_points) {
      updateFormData({ redeem_points: 0, points_discount: 0 });
      return;
    }
    const maxRedeemableByOrder = Math.floor(
      Math.max(0, displayTotal + activeShippingFee - (formData.voucher_discount || 0)) / 1000
    );
    const pts = Math.min(loyaltyData.available_points, maxRedeemableByOrder);
    updateFormData({
      redeem_points: pts,
      points_discount: pts * 1000,
    });
  };

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
      setCountdown(300);
      setOtpValues(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      setOtpError(err.message || (lang === 'en' ? 'Could not send OTP' : 'Không thể gửi mã OTP'));
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and submit order
  const handleVerifyAndSubmit = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) { setOtpError(lang === 'en' ? 'Please enter all 6 digits' : 'Vui lòng nhập đủ 6 chữ số'); return; }
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
      setOtpError(err.message || (lang === 'en' ? 'Invalid or expired OTP code' : 'Mã OTP không chính xác hoặc đã hết hạn'));
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
      useOrderStore.setState({ error: lang === 'en' ? 'Please enter recipient full name' : 'Vui lòng nhập họ tên người nhận' });
      return;
    }
    if (!formData.customer_phone) {
      useOrderStore.setState({ error: lang === 'en' ? 'Please enter phone number' : 'Vui lòng nhập số điện thoại' });
      return;
    }
    if (!formData.customer_email) {
      useOrderStore.setState({ error: lang === 'en' ? 'Please enter email address' : 'Vui lòng nhập địa chỉ email' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customer_email)) {
      useOrderStore.setState({ error: lang === 'en' ? 'Invalid email format' : 'Định dạng email không hợp lệ' });
      return;
    }
    if (formData.order_type === 'delivery' && !formData.customer_address) {
      useOrderStore.setState({ error: lang === 'en' ? 'Please enter or select a delivery address' : 'Vui lòng nhập hoặc chọn địa chỉ giao hàng' });
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
        <h3>{lang === 'en' ? 'ORDER SUMMARY' : 'TÓM TẮT ĐƠN HÀNG'}</h3>
        <span className="checkout-summary-count">{displayCount} {lang === 'en' ? 'ITEMS' : 'MÓN'}</span>
      </div>

      <div className="checkout-summary-items">
        {displayItems.map((item) => (
          <div key={item.id} className="checkout-summary-item flex gap-3.5 items-start">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border shrink-0 shadow-md border-white/10">
              <Image
                src={item.type === 'half_half'
                  ? (item.imageUrl || 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=300&auto=format&fit=crop')
                  : (item.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop')}
                alt={item.name}
                fill
                sizes="56px"
                unoptimized={shouldBypassNextImageOptimization(item.imageUrl || '')}
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-start text-left">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold text-[14px] leading-snug checkout-text-primary">{td(item.name)}</h4>
                <span className="font-extrabold text-[13.5px] text-[#f5c043] whitespace-nowrap shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
              <div className="text-[11.5px] font-semibold checkout-text-muted mt-0.5">
                {lang === 'en' ? 'Quantity: x' : 'Số lượng: x'}{item.quantity}
              </div>
              {item.options?.comboItems ? (
                <div className="flex flex-col gap-1 mt-1.5 text-[11px] checkout-text-secondary">
                  {item.options.comboItems.map((ci: any, idx: number) => (
                    <div key={idx} className="flex flex-col">
                      <span className="checkout-text-primary font-bold">{idx + 1}. {td(ci.name)}</span>
                      <div className="ml-3 font-normal checkout-text-muted text-[10.5px] space-y-0.5 mt-0.5">
                        {ci.size && <span className="font-semibold block">{lang === 'en' ? 'Size: ' : 'Cỡ: '}{td(ci.size)}</span>}
                        {ci.crust && <span className="font-semibold block">{lang === 'en' ? 'Crust: ' : 'Đế bánh: '}{td(ci.crust)}</span>}
                        {ci.toppings && ci.toppings.length > 0 && ci.toppings.map((tp: any, tidx: number) => (
                          <span key={tidx} className="italic block">
                            + Topping: {td(tp.name)} (+{formatPrice(tp.price)})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {item.options?.notes && (
                    <div className={`inline-block px-2 py-0.5 mt-1 rounded text-[10.5px] self-start border ${
                      isLight
                        ? 'bg-[#9f280a]/10 border-[#9f280a]/25 text-[#9f280a] font-semibold'
                        : 'bg-[#9f280a]/20 border-[#9f280a]/40 text-amber-200'
                    }`}>
                      {lang === 'en' ? 'Note: ' : 'Ghi chú: '}{item.options.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] checkout-text-muted space-y-0.5 mt-1">
                  {item.options?.size && <p className="font-medium">{lang === 'en' ? 'Size: ' : 'Cỡ: '}<span className="checkout-text-secondary">{td(item.options.size)}</span></p>}
                  {item.options?.crust && <p className="font-medium">{lang === 'en' ? 'Crust: ' : 'Đế bánh: '}<span className="checkout-text-secondary">{td(item.options.crust)}</span></p>}
                  {item.options?.toppings && (
                    Array.isArray(item.options.toppings) && item.options.toppings.length > 0 ? (
                      <div className="mt-0.5 space-y-0.5">
                        {item.options.toppings.map((tp: any, tidx: number) => (
                          <span key={tidx} className="italic block">
                            + Topping: {td(tp.name)} (+{formatPrice(tp.price)})
                          </span>
                        ))}
                      </div>
                    ) : typeof item.options.toppings === 'string' && (item.options.toppings as string).length > 0 ? (
                      <p>Topping: {item.options.toppings as string}</p>
                    ) : null
                  )}
                  {item.options?.notes && (
                    <div className={`inline-block px-2 py-0.5 mt-1 rounded text-[10.5px] border ${
                      isLight
                        ? 'bg-[#9f280a]/10 border-[#9f280a]/25 text-[#9f280a] font-semibold'
                        : 'bg-[#9f280a]/20 border-[#9f280a]/40 text-amber-200'
                    }`}>
                      {lang === 'en' ? 'Note: ' : 'Ghi chú: '}{item.options.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mã giảm giá (Voucher) & Đổi điểm thành viên */}
      <div className="checkout-divider-top mt-3 pt-3.5 mb-2 space-y-3">
        <div>
          <label className="text-[11.5px] font-extrabold text-[#d4a017] uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Ticket size={14} />
            <span>{lang === 'en' ? 'PROMO CODE / VOUCHER' : 'MÃ GIẢM GIÁ / VOUCHER'}</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              placeholder={lang === 'en' ? 'Enter code (e.g. WELCOME20, PIZZA30K)...' : 'Nhập mã (VD: WELCOME20, PIZZA30K)...'}
              className="checkout-input flex-1 text-xs uppercase font-bold"
            />
            {formData.voucher_code && (formData.voucher_discount || 0) > 0 ? (
              <button
                type="button"
                onClick={handleRemoveVoucher}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition cursor-pointer whitespace-nowrap"
              >
                {lang === 'en' ? 'Remove' : 'Bỏ mã'}
              </button>
            ) : (
              <button
                type="button"
                disabled={applyingVoucher}
                onClick={() => handleApplyVoucher()}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#cd3645] hover:bg-[#b52a38] text-white transition cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {applyingVoucher ? '...' : lang === 'en' ? 'Apply' : 'Áp dụng'}
              </button>
            )}
          </div>

          {voucherMessage && (
            <p
              className={`mt-1.5 text-[11px] font-bold ${
                voucherMessage.type === 'success' ? 'text-[#10b981]' : 'text-red-500'
              }`}
            >
              {voucherMessage.text}
            </p>
          )}

          {availableVouchers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {availableVouchers.map((v) => {
                const isSelected = formData.voucher_code === v.code && (formData.voucher_discount || 0) > 0;
                const isEligible = displayTotal >= (v.min_order_value || 0);
                return (
                  <button
                    key={v.voucher_id}
                    type="button"
                    onClick={() => handleApplyVoucher(v.code)}
                    title={v.description}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold border transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#10b981] text-white border-[#10b981]'
                        : isEligible
                        ? isLight
                          ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                          : 'bg-amber-500/10 border-amber-500/30 text-[#f5c043] hover:bg-amber-500/20'
                        : isLight
                        ? 'bg-stone-100 border-stone-200 text-stone-400'
                        : 'bg-white/[0.03] border-white/10 text-white/35'
                    }`}
                  >
                    <span>{v.code}</span>
                    <span className="opacity-75 font-semibold">
                      ({v.discount_type === 'percent' ? `-${v.discount_value}%` : `-${(v.discount_value / 1000).toFixed(0)}k`})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Đổi điểm tích lũy thành viên */}
        {user && loyaltyData && (
          <div
            className={`rounded-xl border p-3 text-xs flex items-center justify-between gap-2 ${
              isLight
                ? 'bg-amber-50/60 border-amber-200 text-[#1c1208]'
                : 'bg-amber-500/[0.06] border-amber-500/20 text-white/90'
            }`}
          >
            <div className="flex items-start gap-2">
              <Award size={15} className="text-[#d4a017] mt-0.5 shrink-0" />
              <div>
                <div className="font-extrabold text-[11.5px] flex items-center gap-1.5 flex-wrap">
                  <span>{loyaltyData.tier_name}</span>
                  <span className="text-[#d4a017]">
                    • {loyaltyData.available_points} {lang === 'en' ? 'available pts' : 'điểm khả dụng'}
                  </span>
                </div>
                <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-[#5c4d3c]' : 'text-white/55'}`}>
                  {loyaltyData.available_points > 0
                    ? lang === 'en'
                      ? `Redeem up to ${loyaltyData.available_points} pts (-${formatPrice(loyaltyData.available_points * 1000)})`
                      : `Đổi tối đa ${loyaltyData.available_points} điểm (-${formatPrice(loyaltyData.available_points * 1000)})`
                    : lang === 'en'
                      ? 'Complete orders to earn 1 point per 10,000đ'
                      : 'Hoàn thành đơn hàng để tích 1 điểm cho mỗi 10.000đ'}
                </p>
              </div>
            </div>
            {loyaltyData.available_points > 0 && (
              <input
                type="checkbox"
                checked={(formData.redeem_points || 0) > 0}
                onChange={(e) => handleToggleLoyaltyPoints(e.target.checked)}
                className="w-4 h-4 accent-[#cd3645] cursor-pointer shrink-0"
              />
            )}
          </div>
        )}
      </div>

      <div className="checkout-summary-totals">
        <div className="checkout-summary-row">
          <span>{lang === 'en' ? `Subtotal (${displayCount} items)` : `Tạm tính (${displayCount} món)`}</span>
          <span className="font-bold checkout-text-primary">{formatPrice(displayTotal)}</span>
        </div>
        <div className="checkout-summary-row">
          <span>{lang === 'en' ? 'Delivery fee' : 'Phí giao hàng'}</span>
          <span className={`font-semibold ${activeShippingFee > 0 ? 'checkout-text-primary' : 'text-[#10b981]'}`}>
            {formData.order_type === 'pickup'
              ? lang === 'en' ? 'Free (Store pickup)' : 'Miễn phí (Nhận tại quán)'
              : !hasDeliveryAddress
                ? lang === 'en' ? 'Enter address to calculate' : 'Nhập địa chỉ để tính phí'
                : activeShippingFee > 0
                  ? `${formatPrice(activeShippingFee)} (> 4km)`
                  : lang === 'en' ? 'Free (<= 4km)' : 'Miễn phí (<= 4km)'}
          </span>
        </div>
        {(formData.voucher_discount || 0) > 0 && (
          <div className="checkout-summary-row text-[#10b981]">
            <span>Voucher ({formData.voucher_code})</span>
            <span className="font-bold">-{formatPrice(formData.voucher_discount || 0)}</span>
          </div>
        )}
        {(formData.points_discount || 0) > 0 && (
          <div className="checkout-summary-row text-[#10b981]">
            <span>{lang === 'en' ? `Redeemed ${formData.redeem_points} member pts` : `Đổi ${formData.redeem_points} điểm thành viên`}</span>
            <span className="font-bold">-{formatPrice(formData.points_discount || 0)}</span>
          </div>
        )}
        {formData.order_type === 'delivery' && (
          <div className="checkout-shipping-notice mt-2 mb-1">
            {formData.nearest_store_name
              ? lang === 'en'
                ? `Nearest branch: ${formData.nearest_store_name}${
                    formData.distance ? ` (~${(formData.distance / 1000).toFixed(1)} km)` : ''
                  }. Free delivery within 4km; flat 20,000đ over 4km.`
                : `Chi nhánh gần nhất: ${formData.nearest_store_name}${
                    formData.distance ? ` (~${(formData.distance / 1000).toFixed(1)} km)` : ''
                  }. Miễn phí giao hàng trong bán kính 4km, trên 4km phí đồng giá 20.000đ.`
              : lang === 'en'
                ? 'Free delivery within 4km from our nearest branch. Flat 20,000đ delivery fee over 4km.'
                : 'Miễn phí giao hàng trong bán kính 4km tính từ chi nhánh gần nhất. Từ trên 4km phí giao hàng đồng giá 20.000đ.'}
          </div>
        )}
        <div className="checkout-summary-total-row">
          <span>{lang === 'en' ? 'TOTAL' : 'TỔNG CỘNG'}</span>
          <span className="checkout-total-price">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div className="checkout-divider-top mt-4 pt-4">
        <h4 className="text-[12px] font-extrabold text-[#d4a017] uppercase tracking-wider mb-3">
          {lang === 'en' ? 'PAYMENT METHOD' : 'PHƯƠNG THỨC THANH TOÁN'}
        </h4>
        <div className="checkout-payment-options flex flex-col gap-2.5">
          <label className={`checkout-payment-option ${formData.payment_method === 'vietqr' ? 'selected' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="checkout-payment-icon">
                <QrCode size={17} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-[13px] checkout-text-primary">{lang === 'en' ? 'VietQR Bank Transfer' : 'Chuyển khoản VietQR'}</span>
                <span className="text-[11px] checkout-text-muted">{lang === 'en' ? 'Scan QR code directly on screen' : 'Hiển thị mã QR quét ngay trên web'}</span>
              </div>
            </div>
            <input type="radio" name="payment" value="vietqr" checked={formData.payment_method === 'vietqr'} onChange={() => updateFormData({ payment_method: 'vietqr' })} className="checkout-radio-input" />
            <span className={`checkout-radio-dot ${formData.payment_method === 'vietqr' ? 'active' : ''}`} />
          </label>
          <label className={`checkout-payment-option ${formData.payment_method === 'cod' ? 'selected' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="checkout-payment-icon">
                <Package size={17} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-[13px] checkout-text-primary">{lang === 'en' ? 'Cash on Delivery (COD)' : 'Thanh toán khi nhận hàng (COD)'}</span>
                <span className="text-[11px] checkout-text-muted">{lang === 'en' ? 'Pay cash upon receiving your order' : 'Thanh toán tiền mặt khi nhận món'}</span>
              </div>
            </div>
            <input type="radio" name="payment" value="cod" checked={formData.payment_method === 'cod'} onChange={() => updateFormData({ payment_method: 'cod' })} className="checkout-radio-input" />
            <span className={`checkout-radio-dot ${formData.payment_method === 'cod' ? 'active' : ''}`} />
          </label>
        </div>
      </div>

      {error && <p className="checkout-error mt-3 mb-2">{error}</p>}

      <button
        type="button"
        className="checkout-pay-btn mt-4"
        onClick={handleOrderClick}
        disabled={isSubmitting || displayItems.length === 0}
      >
        {isSubmitting ? (
          <span className="checkout-spinner" />
        ) : formData.payment_method === 'vietqr' ? (
          `${lang === 'en' ? 'PAY VIA VIETQR' : 'THANH TOÁN VIETQR'} • ${formatPrice(finalTotal)}`
        ) : (
          `${lang === 'en' ? 'PLACE ORDER' : 'XÁC NHẬN ĐƠN HÀNG'} • ${formatPrice(finalTotal)}`
        )}
      </button>

      {/* OTP Modal for Guest */}
      {showOtpModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden border ${
              isLight ? 'bg-white border-black/10 text-[#1c1208]' : 'bg-[#121212] border-white/10 text-white'
            }`}
          >
            <div className={`p-5 border-b flex justify-between items-center ${
              isLight ? 'border-black/10' : 'border-white/10'
            }`}>
              <h3 className={`text-[15px] font-black uppercase tracking-wider ${
                isLight ? 'text-[#1c1208]' : 'text-white'
              }`}>{lang === 'en' ? 'Email Verification' : 'Xác thực Email'}</h3>
              <button
                className={`p-1.5 rounded-full transition ${
                  isLight ? 'text-stone-400 hover:text-stone-800 hover:bg-stone-100' : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setShowOtpModal(false)}
              >
                <span className="text-[22px] leading-none font-light">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <p className={`text-[13px] text-center mb-1 ${isLight ? 'text-[#6e6254]' : 'text-white/60'}`}>
                {lang === 'en' ? 'An OTP verification code has been sent to:' : 'Mã xác thực OTP đã được gửi đến email:'}
              </p>
              <p className={`font-bold text-[14px] text-center mb-5 ${isLight ? 'text-[#cd3645]' : 'text-white'}`}>
                {formData.customer_email}
              </p>

              {otpError && (
                <p className="text-red-500 text-[12px] text-center font-semibold mb-3">{otpError}</p>
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
                      border: val ? '2px solid #c0392b' : isLight ? '2px solid rgba(28,18,8,0.15)' : '2px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      background: isLight ? '#fcfaf6' : 'rgba(255,255,255,0.04)',
                      color: isLight ? '#1c1208' : '#fff',
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
                  background: otpLoading || otpValues.join('').length !== 6 ? (isLight ? '#e5e0d8' : 'rgba(255,255,255,0.08)') : '#c0392b',
                  color: otpLoading || otpValues.join('').length !== 6 && isLight ? '#8c7d6b' : '#fff',
                  border: 'none',
                  cursor: otpLoading || otpValues.join('').length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: otpLoading || otpValues.join('').length !== 6 ? 0.6 : 1,
                }}
              >
                {otpLoading ? (lang === 'en' ? 'Verifying...' : 'Đang xác thực...') : (lang === 'en' ? 'Verify & Place Order' : 'Xác nhận và Đặt hàng')}
              </button>

              <div className="text-center mt-3">
                {countdown > 0 ? (
                  <span className={`text-[12px] ${isLight ? 'text-[#8c7d6b]' : 'text-white/40'}`}>
                    {lang === 'en' ? 'Resend code in ' : 'Gửi lại mã sau '}{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="text-[12px] font-semibold"
                    style={{ color: isLight ? '#cd3645' : '#eab308', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {sendingOtp ? (lang === 'en' ? 'Sending...' : 'Đang gửi...') : (lang === 'en' ? 'Resend OTP code' : 'Gửi lại mã OTP')}
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
function OrderSuccess({ stores }: { stores: any[] }) {
  const { orderResult, formData, resetForm, cartBackup } = useOrderStore();
  const router = useRouter();
  const { theme, lang, td } = useUI();
  const isLight = theme === 'light';
  const [showDetails, setShowDetails] = useState(false);
  const [liveOrder, setLiveOrder] = useState<PizzaTrackerOrder | null>(null);
  const [refreshingOrder, setRefreshingOrder] = useState(false);

  const fetchLiveOrder = useCallback(async () => {
    if (!orderResult?.order_id) return;
    setRefreshingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderResult.order_id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setLiveOrder(json.data);
        }
      }
    } catch {
      // Bỏ qua lỗi khi làm mới nền
    } finally {
      setRefreshingOrder(false);
    }
  }, [orderResult?.order_id]);

  useEffect(() => {
    fetchLiveOrder();
    const timer = setInterval(fetchLiveOrder, 10000);
    return () => clearInterval(timer);
  }, [fetchLiveOrder]);

  if (!orderResult) return null;

  const currentPaymentStatus = (liveOrder as any)?.payment_status || orderResult.payment_status || 'pending';
  const currentPaymentMethod = (liveOrder as any)?.payment_method || orderResult.payment_method || formData.payment_method;
  const isPaidVietQR = currentPaymentMethod === 'vietqr' && currentPaymentStatus === 'paid';
  const resolvedShippingFee =
    (liveOrder as any)?.shipping_fee ??
    orderResult.shipping_fee ??
    (formData.order_type === 'delivery' ? (formData.shipping_fee || 0) : 0);
  const resolvedDiscountAmount =
    (liveOrder as any)?.discount_amount ??
    orderResult.discount_amount ??
    ((formData.voucher_discount || 0) + (formData.points_discount || 0));
  const resolvedTotalOrder = (liveOrder as any)?.total_order ?? orderResult.total_order;

  const handlePrintReceipt = () => {
    const backupSubtotal = (cartBackup || []).reduce((s, it) => s + it.price * it.quantity, 0);
    printOrderReceipt({
      order_id: orderResult.order_id,
      created_at: orderResult.created_at,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email,
      customer_address: formData.customer_address,
      order_type: formData.order_type,
      store_name: formData.nearest_store_name || 'Pizza & Pasta Inn',
      payment_method: currentPaymentMethod,
      payment_status: currentPaymentStatus,
      order_status: (liveOrder as any)?.order_status || orderResult.order_status,
      order_note: formData.order_note,
      subtotal: (liveOrder as any)?.total_price_dish ?? backupSubtotal,
      shipping_fee: resolvedShippingFee,
      discount_amount: resolvedDiscountAmount,
      total_order: resolvedTotalOrder,
      items: (cartBackup || []).map((item) => ({
        name: td(item.name),
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        spec: [
          item.options?.size ? `${lang === 'en' ? 'Size' : 'Cỡ'}: ${td(item.options.size)}` : '',
          item.options?.crust ? `${lang === 'en' ? 'Crust' : 'Đế'}: ${td(item.options.crust)}` : '',
        ]
          .filter(Boolean)
          .join(' • '),
        subDetails: item.options?.comboItems
          ? item.options.comboItems.map((ci: any) => td(ci.name))
          : Array.isArray(item.options?.toppings)
          ? item.options.toppings.map((tp: any) => `Topping: ${td(tp.name || tp.topping_name)}`)
          : [],
        note: item.options?.notes || null,
      })),
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 select-none">
      {/* Icon checkmark xanh lá phát sáng */}
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center border border-[#10b981]/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-fadeIn ${
          isLight ? 'bg-emerald-50' : 'bg-[#0c2a1c]'
        }`}>
          <div className="w-12 h-12 bg-[#10b981] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <svg className="w-6 h-6 text-white stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Thông báo trạng thái đặt hàng / thanh toán */}
      <div className={`max-w-2xl mx-auto border rounded-2xl p-5 md:p-6 text-center shadow-lg animate-fadeIn ${
        isPaidVietQR
          ? isLight
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-emerald-500/10 border-emerald-500/25'
          : isLight
            ? 'bg-amber-50 border-amber-200'
            : 'bg-amber-500/10 border-amber-500/25'
      }`}>
        <p className={`font-black text-sm md:text-base lg:text-lg tracking-wider uppercase ${
          isPaidVietQR
            ? isLight
              ? 'text-emerald-800'
              : 'text-[#10b981]'
            : isLight
              ? 'text-amber-800'
              : 'text-[#f5c043]'
        }`}>
          {isPaidVietQR
            ? lang === 'en'
              ? `VIETQR PAYMENT CONFIRMED • ORDER #PIZZA-${orderResult.order_id}`
              : `THANH TOÁN VIETQR THÀNH CÔNG • ĐƠN #PIZZA-${orderResult.order_id}`
            : lang === 'en'
              ? `ORDER PLACED SUCCESSFULLY • ORDER #PIZZA-${orderResult.order_id}`
              : `ĐẶT HÀNG THÀNH CÔNG • ĐƠN #PIZZA-${orderResult.order_id}`}
        </p>
        <p className={`text-xs md:text-sm font-semibold mt-2 ${
          isLight ? 'text-[#5c4d3c]' : 'text-white/75'
        }`}>
          {isPaidVietQR
            ? lang === 'en'
              ? 'Your payment has been automatically verified and your order has been sent to the kitchen. An e-receipt has been emailed to you.'
              : 'Hệ thống đã xác nhận thanh toán tự động và chuyển đơn xuống bếp chế biến. Hóa đơn điện tử đã được gửi tới email của bạn.'
            : lang === 'en'
              ? 'Your order has been received. A detailed invoice will be sent to your email once the branch confirms your order.'
              : 'Đơn hàng của bạn đã được ghi nhận. Hóa đơn chi tiết sẽ được gửi vào email của bạn ngay sau khi cửa hàng hoàn tất xác nhận.'}
        </p>
      </div>

      {/* Live Pizza Tracker */}
      <div className="mt-6">
        <PizzaTracker
          order={liveOrder || orderResult}
          isDark={!isLight}
          onRefresh={fetchLiveOrder}
          refreshing={refreshingOrder}
        />
      </div>

      {/* Hộp nội dung chi tiết đơn hàng */}
      <div className={`border rounded-[24px] p-6 md:p-8 mt-8 space-y-6 text-left ${
        isLight
          ? 'bg-white border-black/[0.08] shadow-[0_16px_40px_rgba(28,18,8,0.08)]'
          : 'bg-[#121212] border-white/[0.08] shadow-2xl shadow-black/50'
      }`}>
        {/* Mục 1: Xác nhận thông tin */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 flex items-center justify-center text-[#d4a017] flex-shrink-0 mt-0.5">
            <Mail size={18} />
          </div>
          <div>
            <h4 className={`text-sm md:text-base font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
              {lang === 'en' ? 'Order Confirmation' : 'Xác nhận thông tin đơn hàng'}
            </h4>
            <p className={`text-xs md:text-sm leading-relaxed font-medium mt-1 ${isLight ? 'text-[#5c4d3c]' : 'text-white/60'}`}>
              {isPaidVietQR
                ? lang === 'en'
                  ? 'Your order has been paid via VietQR and automatically confirmed for the branch kitchen.'
                  : 'Đơn hàng đã được thanh toán thành công qua VietQR và tự động xác nhận cho chi nhánh chuẩn bị món.'
                : lang === 'en'
                  ? 'Your order details and delivery fee have been recorded. Our staff will confirm shortly and prepare your meal.'
                  : 'Thông tin đơn hàng và phí giao hàng đã được ghi nhận. Nhân viên chi nhánh sẽ sớm xác nhận và chuẩn bị món nóng hổi cho bạn.'}
              <br />
              <span className="text-[#ef4444] font-bold">{lang === 'en' ? 'Note:' : 'Lưu ý:'}</span>{' '}
              {lang === 'en'
                ? 'If you need to update your order or require urgent assistance, please call our Hotline: '
                : 'Nếu bạn muốn thay đổi thông tin hoặc cần hỗ trợ gấp, vui lòng liên hệ Hotline: '}
              <strong className={`font-black ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>028 3924 0343</strong>
            </p>
          </div>
        </div>

        {/* Mục 2: Vận chuyển */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] flex-shrink-0 mt-0.5">
            <Truck size={18} />
          </div>
          <div>
            <h4 className={`text-sm md:text-base font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
              {lang === 'en' ? 'Delivery Fee Policy' : 'Thông tin phí giao hàng'}
            </h4>
            <p className={`text-xs md:text-sm leading-relaxed font-medium mt-1 ${isLight ? 'text-[#5c4d3c]' : 'text-white/60'}`}>
              {lang === 'en' ? (
                <>
                  We offer <strong className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>free delivery within a 4km radius</strong> from the nearest branch, and a flat <strong className="font-extrabold text-[#d4a017]">20,000đ</strong> delivery fee over <strong className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>4km</strong>.
                </>
              ) : (
                <>
                  Hệ thống áp dụng <strong className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>miễn phí giao hàng trong bán kính 4km</strong> tính từ chi nhánh gần nhất, trên <strong className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>4km</strong> phí giao hàng đồng giá <strong className="font-extrabold text-[#d4a017]">20.000đ</strong>.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Accordion chi tiết đơn hàng ẩn/hiện */}
        {showDetails && (
          <div className={`border-t pt-5 mt-4 space-y-4 animate-fadeIn ${isLight ? 'border-black/[0.08]' : 'border-white/[0.06]'}`}>
            <h5 className={`text-sm font-bold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
              {lang === 'en' ? 'Order Summary Details' : 'Thông tin tóm tắt đơn hàng'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
              <div className="space-y-2.5">
                <p className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/75'}`}><span className={`font-medium uppercase text-[10px] tracking-wider block mb-0.5 ${isLight ? 'text-[#8c7d6b]' : 'text-white/35'}`}>{lang === 'en' ? 'Recipient' : 'Người nhận'}</span>{formData.customer_name}</p>
                <p className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/75'}`}><span className={`font-medium uppercase text-[10px] tracking-wider block mb-0.5 ${isLight ? 'text-[#8c7d6b]' : 'text-white/35'}`}>{lang === 'en' ? 'Phone' : 'Số điện thoại'}</span>{formData.customer_phone}</p>
                <p className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/75'}`}><span className={`font-medium uppercase text-[10px] tracking-wider block mb-0.5 ${isLight ? 'text-[#8c7d6b]' : 'text-white/35'}`}>Email</span>{formData.customer_email}</p>
                <p className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/75'}`}>
                  <span className={`font-medium uppercase text-[10px] tracking-wider block mb-0.5 ${isLight ? 'text-[#8c7d6b]' : 'text-white/35'}`}>
                    {formData.order_type === 'pickup' ? (lang === 'en' ? 'Pickup Store' : 'Cửa hàng nhận món') : (lang === 'en' ? 'Delivery Address' : 'Địa chỉ giao hàng')}
                  </span>
                  {formData.order_type === 'pickup' ? (
                    (() => {
                      const selectedStore = stores?.find(s => s.store_id === formData.store_id);
                      return selectedStore ? (
                        <span className={`block font-bold mt-1 text-xs md:text-sm ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
                          {selectedStore.store_name}
                          <span className={`block font-medium text-[11px] mt-0.5 ${isLight ? 'text-[#6e6254]' : 'text-white/50'}`}>{selectedStore.address}</span>
                          {selectedStore.hotline && (
                            <span className={`block font-medium text-[11px] mt-0.5 ${isLight ? 'text-[#6e6254]' : 'text-white/50'}`}>Hotline: {selectedStore.hotline}</span>
                          )}
                        </span>
                      ) : (
                        lang === 'en' ? 'Store pickup' : 'Nhận trực tiếp tại chi nhánh'
                      );
                    })()
                  ) : (
                    formData.customer_address || (lang === 'en' ? 'Store pickup' : 'Nhận trực tiếp tại chi nhánh')
                  )}
                </p>
              </div>
              <div className="space-y-2.5">
                {formData.nearest_store_name && (
                  <p className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/75'}`}><span className={`font-medium uppercase text-[10px] tracking-wider block mb-0.5 ${isLight ? 'text-[#8c7d6b]' : 'text-white/35'}`}>{lang === 'en' ? 'Serving Branch' : 'Chi nhánh xử lý'}</span>{formData.nearest_store_name}</p>
                )}
                <p className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/75'}`}><span className={`font-medium uppercase text-[10px] tracking-wider block mb-0.5 ${isLight ? 'text-[#8c7d6b]' : 'text-white/35'}`}>{lang === 'en' ? 'Time' : 'Thời gian'}</span>{formData.deliver_now ? (lang === 'en' ? 'Deliver now (30 - 45 mins)' : 'Giao ngay (30 - 45 phút)') : `${formData.scheduled_date} ${formData.scheduled_time}`}</p>
                <p className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/75'}`}>
                  <span className={`font-medium uppercase text-[10px] tracking-wider block mb-0.5 ${isLight ? 'text-[#8c7d6b]' : 'text-white/35'}`}>{lang === 'en' ? 'Payment Method' : 'Phương thức thanh toán'}</span>
                  <span className="text-[#10b981]">
                    {currentPaymentMethod === 'vietqr'
                      ? isPaidVietQR
                        ? lang === 'en' ? 'VietQR Transfer (Paid)' : 'Chuyển khoản VietQR (Đã thanh toán)'
                        : lang === 'en' ? 'Bank Transfer (VietQR)' : 'Chuyển khoản ngân hàng (VietQR)'
                      : lang === 'en' ? 'Cash on Delivery (COD)' : 'Thanh toán khi nhận hàng (COD)'}
                  </span>
                </p>
              </div>
            </div>

            {/* Chi tiết món đã đặt */}
            {cartBackup && cartBackup.length > 0 && (
              <div className="mt-4">
                <h5 className={`text-sm font-bold mb-3 ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
                  {lang === 'en' ? 'Ordered Items' : 'Chi tiết món đặt'}
                </h5>
                <div className="space-y-4">
                  {cartBackup.map((item, idx) => (
                    <div key={item.id || idx} className={`flex items-start gap-4 py-4 border-b last:border-0 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                      <div className={`relative w-16 h-16 rounded-full overflow-hidden border shrink-0 shadow-md ${isLight ? 'border-black/10' : 'border-white/[0.06]'}`}>
                        <Image
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop'}
                          alt={item.name}
                          fill
                          sizes="64px"
                          unoptimized={shouldBypassNextImageOptimization(item.imageUrl)}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`font-extrabold text-sm md:text-base tracking-wide leading-snug ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>{td(item.name)}</p>
                        <div className={`text-[11px] font-bold tracking-wider mt-0.5 ${isLight ? 'text-[#6e6254]' : 'text-zinc-400'}`}>
                          {lang === 'en' ? 'Quantity: x' : 'Số lượng: x'}{item.quantity}
                        </div>
                        {item.options?.comboItems && item.options.comboItems.length > 0 ? (
                          <div className={`flex flex-col gap-1 mt-1 text-[10px] space-y-0.5 ${isLight ? 'text-[#5c4d3c]' : 'text-white/45'}`}>
                            {item.options.comboItems.map((ci: any, cidx: number) => (
                              <div key={cidx} className="flex flex-col">
                                <span className={`font-bold ${isLight ? 'text-[#1c1208]' : 'text-white/85'}`}>{cidx + 1}. {td(ci.name)}</span>
                                <div className={`ml-3 font-normal space-y-0.5 ${isLight ? 'text-[#6e6254]' : 'text-white/40'}`}>
                                  {ci.size && <span className="font-bold">{lang === 'en' ? 'Size: ' : 'Cỡ: '}{td(ci.size).toUpperCase()}<br /></span>}
                                  {ci.crust && <span className="font-bold">{lang === 'en' ? 'Crust: ' : 'Đế bánh: '}{td(ci.crust).toUpperCase()}<br /></span>}
                                  {ci.toppings && ci.toppings.length > 0 && ci.toppings.map((tp: any, tidx: number) => (
                                    <span key={tidx} className="italic ml-1 block">
                                      + Topping: {td(tp.name || tp.topping_name)} (+{formatPrice(tp.price || 0)})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`text-[10px] space-y-0.5 mt-0.5 ${isLight ? 'text-[#5c4d3c]' : 'text-white/45'}`}>
                            {item.options?.size && <p className="font-bold tracking-wider">{lang === 'en' ? 'Size: ' : 'Cỡ: '}{td(item.options.size).toUpperCase()}</p>}
                            {item.options?.crust && <p className="font-bold tracking-wider">{lang === 'en' ? 'Crust: ' : 'Đế bánh: '}{td(item.options.crust).toUpperCase()}</p>}
                            {item.options?.toppings && Array.isArray(item.options.toppings) && item.options.toppings.length > 0 && (
                              <div className="ml-1 mt-0.5">
                                {item.options.toppings.map((tp: any, tidx: number) => (
                                  <span key={tidx} className="italic block">
                                    + Topping: {td(tp.name || tp.topping_name)} (+{formatPrice(tp.price || 0)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {item.options?.notes && (
                          <div className="bg-[#9f280a] inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] text-white self-start">
                            {lang === 'en' ? 'Note: ' : 'Ghi chú: '}{item.options.notes}
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-extrabold whitespace-nowrap self-start mt-1 ${isLight ? 'text-[#cd3645]' : 'text-[#f5c043]'}`}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.order_note && (
              <div className={`border p-3 rounded-xl text-xs mt-2 ${isLight ? 'bg-[#fcfaf6] border-black/8 text-[#5c4d3c]' : 'bg-white/[0.02] border-white/[0.04] text-white/50'}`}>
                <span className={`font-extrabold block text-[9px] uppercase tracking-wider mb-1 ${isLight ? 'text-[#8c7d6b]' : 'text-white/30'}`}>{lang === 'en' ? 'Your Note' : 'Ghi chú của bạn'}</span>
                &quot;{formData.order_note}&quot;
              </div>
            )}
            <div className={`border-t pt-3 space-y-2 text-xs md:text-sm ${isLight ? 'border-black/8 text-[#1c1208]' : 'border-white/[0.04] text-white'}`}>
              <div className="flex justify-between items-center font-semibold">
                <span className={`uppercase tracking-wider text-[10px] ${isLight ? 'text-[#8c7d6b]' : 'text-white/40'}`}>{lang === 'en' ? 'DELIVERY FEE' : 'PHÍ GIAO HÀNG'}</span>
                <span className={resolvedShippingFee > 0 ? '' : 'text-[#10b981] font-bold'}>
                  {formData.order_type === 'pickup'
                    ? lang === 'en' ? 'Free (Store pickup)' : 'Miễn phí (Nhận tại quán)'
                    : resolvedShippingFee > 0
                      ? formatPrice(resolvedShippingFee)
                      : lang === 'en' ? 'Free (<= 4km)' : 'Miễn phí (<= 4km)'}
                </span>
              </div>
              {resolvedDiscountAmount > 0 && (
                <div className="flex justify-between items-center font-semibold text-[#10b981]">
                  <span className={`uppercase tracking-wider text-[10px] ${isLight ? 'text-[#8c7d6b]' : 'text-white/40'}`}>{lang === 'en' ? 'DISCOUNT (VOUCHER / POINTS)' : 'GIẢM GIÁ (VOUCHER / ĐIỂM)'}</span>
                  <span className="font-bold">-{formatPrice(resolvedDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-extrabold pt-1">
                <span className={`uppercase tracking-wider text-[10px] ${isLight ? 'text-[#8c7d6b]' : 'text-white/40'}`}>{lang === 'en' ? 'TOTAL PAYMENT' : 'TỔNG THANH TOÁN'}</span>
                <span className={`text-lg ${isLight ? 'text-[#cd3645]' : 'text-[#f5c043]'}`}>{formatPrice(resolvedTotalOrder)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nút Xem chi tiết & In hóa đơn */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`w-full border rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm active:scale-[0.99] cursor-pointer ${
            isLight
              ? 'bg-white hover:bg-stone-50 border-black/12 text-[#1c1208] shadow-md'
              : 'bg-[#141414] hover:bg-[#1a1a1a] border-white/[0.08] hover:border-white/15 text-white shadow-xl hover:shadow-black/50'
          }`}
        >
          <BookOpen size={16} className="text-[#d4a017]" />
          <span>{showDetails ? (lang === 'en' ? 'HIDE ORDER DETAILS' : 'ẨN CHI TIẾT ĐƠN HÀNG') : (lang === 'en' ? 'VIEW ORDER DETAILS' : 'XEM CHI TIẾT ĐƠN HÀNG')}</span>
        </button>

        <button
          onClick={handlePrintReceipt}
          className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm shadow-xl shadow-red-950/20 active:scale-[0.99] cursor-pointer"
        >
          <Printer size={16} />
          <span>{lang === 'en' ? 'PRINT / SAVE RECEIPT (PDF)' : 'IN / LƯU BIÊN LAI (PDF)'}</span>
        </button>
      </div>

      {/* Nút Về trang chủ */}
      <div className="text-center">
        <button
          onClick={() => {
            resetForm();
            router.push('/');
          }}
          className={`mt-8 inline-flex items-center gap-2 text-xs md:text-sm font-extrabold transition-all tracking-[0.2em] uppercase hover:gap-3 duration-300 ${
            isLight ? 'text-[#6e6254] hover:text-[#1c1208]' : 'text-white/60 hover:text-white'
          }`}
        >
          <ArrowLeft size={16} />
          <span>{lang === 'en' ? 'BACK TO HOME' : 'QUAY VỀ TRANG CHỦ'}</span>
        </button>
      </div>
    </div>
  );
}

// ── Component: Đặt hàng thất bại ──────────────────────────────────────────
function OrderFailure() {
  const { setStep, switchActiveOrderToCod } = useOrderStore();
  const { theme, lang } = useUI();
  const isLight = theme === 'light';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 select-none">
      {/* Icon tam giác cảnh báo đỏ phát sáng */}
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse ${
          isLight ? 'bg-red-50' : 'bg-[#2d0e10]'
        }`}>
          <div className="w-12 h-12 bg-[#ef4444] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <AlertTriangle size={24} className="text-white stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Tiêu đề chính */}
      <h2 className={`text-2xl md:text-3xl font-black text-center tracking-wide uppercase leading-tight ${
        isLight ? 'text-[#1c1208]' : 'text-white'
      }`}>
        {lang === 'en' ? 'SORRY, YOUR PAYMENT' : 'RẤT TIẾC, ĐƠN HÀNG CỦA BẠN'} <br />
        <span className="text-[#ef4444] block mt-1">{lang === 'en' ? 'COULD NOT BE COMPLETED!' : 'CHƯA THỂ HOÀN TẤT!'}</span>
      </h2>

      {/* Hộp nội dung chi tiết */}
      <div className={`border rounded-[24px] p-6 md:p-8 mt-8 space-y-6 ${
        isLight
          ? 'bg-white border-black/[0.08] shadow-[0_16px_40px_rgba(28,18,8,0.08)]'
          : 'bg-[#121212] border-white/[0.06] shadow-2xl shadow-black/50'
      }`}>
        {/* Mục 1: Lý do lỗi */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center text-[#ef4444] flex-shrink-0 mt-0.5">
            <CreditCard size={18} />
          </div>
          <div>
            <h4 className={`text-sm md:text-base font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
              {lang === 'en' ? 'Why did this happen?' : 'Nguyên nhân gián đoạn thanh toán'}
            </h4>
            <p className={`text-xs md:text-sm leading-relaxed font-medium mt-1 ${isLight ? 'text-[#5c4d3c]' : 'text-white/60'}`}>
              {lang === 'en' ? (
                <>
                  Your VietQR transfer was not detected due to a connection interruption or QR expiration. <strong className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>Your bank account has not been charged.</strong>
                </>
              ) : (
                <>
                  Giao dịch chuyển khoản VietQR chưa được ghi nhận do gián đoạn kết nối hoặc đã hết thời gian chờ. <strong className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>Tài khoản ngân hàng của bạn hoàn toàn chưa bị trừ tiền.</strong>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Mục 2: Giải pháp khắc phục */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981] flex-shrink-0 mt-0.5">
            <RotateCcw size={18} />
          </div>
          <div>
            <h4 className={`text-sm md:text-base font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
              {lang === 'en' ? 'How to proceed' : 'Hướng dẫn xử lý'}
            </h4>
            <p className={`text-xs md:text-sm leading-relaxed font-medium mt-1 ${isLight ? 'text-[#5c4d3c]' : 'text-white/60'}`}>
              {lang === 'en' ? (
                <>
                  You can reopen the VietQR code to scan again or switch your order to <strong className="font-extrabold text-[#d4a017]">Cash on Delivery (COD)</strong> immediately.
                </>
              ) : (
                <>
                  Bạn có thể mở lại mã VietQR để quét tiếp hoặc chuyển đơn hàng sang <strong className="font-extrabold text-[#d4a017]">Thanh toán khi nhận hàng (COD)</strong> ngay lập tức.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Cụm nút hành động bên dưới */}
      <div className="mt-8 space-y-3 w-full">
        <button
          onClick={() => switchActiveOrderToCod()}
          className="w-full bg-[#cd3645] hover:bg-[#b52a38] text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm shadow-xl shadow-red-950/20 active:scale-[0.99]"
        >
          <CreditCard size={16} />
          <span>{lang === 'en' ? 'SWITCH TO CASH ON DELIVERY (COD)' : 'ĐỔI SANG THANH TOÁN KHI NHẬN HÀNG (COD)'}</span>
        </button>

        <button
          onClick={() => setStep('payment')}
          className={`w-full border rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm active:scale-[0.99] ${
            isLight
              ? 'bg-white hover:bg-stone-50 border-black/12 text-[#1c1208] shadow-md'
              : 'bg-[#141414] hover:bg-[#1a1a1a] border-[#eab308]/25 text-[#eab308] shadow-xl'
          }`}
        >
          <RotateCcw size={16} />
          <span>{lang === 'en' ? 'REOPEN VIETQR CODE TO PAY' : 'MỞ LẠI MÃ VIETQR ĐỂ THANH TOÁN'}</span>
        </button>

        <a
          href="tel:0287896770"
          className={`w-full border rounded-2xl py-4 flex items-center justify-center gap-3 transition-all duration-300 font-extrabold tracking-wider text-xs md:text-sm active:scale-[0.99] ${
            isLight
              ? 'bg-white hover:bg-stone-50 border-black/12 text-[#1c1208] shadow-md'
              : 'bg-[#141414] hover:bg-[#1a1a1a] border-white/[0.05] hover:border-white/10 text-white shadow-xl hover:shadow-black/50'
          }`}
        >
          <Phone size={16} className="text-[#d4a017]" />
          <span>{lang === 'en' ? 'CALL SUPPORT HOTLINE: 028 7896770' : 'GỌI TỔNG ĐÀI HỖ TRỢ: 028 7896770'}</span>
        </a>
      </div>
    </div>
  );
}

// ── Component: Xác thực thanh toán VietQR ────────────────────────────────────
function OrderPaymentModal() {
  const { totalPrice } = useCartStore();
  const { formData, setStep, updateFormData, orderResult, cancelActiveOrder, switchActiveOrderToCod } = useOrderStore();
  const { theme, lang } = useUI();
  const isLight = theme === 'light';
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600 seconds)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const displayTotal = totalPrice();
  const shippingFee = formData.order_type === 'delivery' ? (formData.shipping_fee || 0) : 0;
  const totalOrder = orderResult?.total_order || (displayTotal + shippingFee);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      useOrderStore.setState({ vietqrAttempt: 1 });
      setStep('failure');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, setStep]);

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
          if (order.payment_status === 'paid' || order.order_status === 'confirmed') {
            if (isMounted) {
              useOrderStore.setState({
                orderResult: {
                  ...orderResult,
                  order_status: order.order_status,
                  payment_status: order.payment_status,
                  total_order: order.total_order ?? orderResult.total_order,
                },
              });
              setStep('success');
            }
          }
        }
      } catch (err) {
        console.warn('Error checking order payment status:', err);
      }
    };

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
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-5xl border rounded-[32px] p-6 md:p-10 shadow-2xl relative animate-scaleUp ${
          isLight
            ? 'bg-white border-black/10 text-[#1c1208]'
            : 'bg-[#0c0c0c] border-white/10 text-white'
        }`}
      >

        <button
          onClick={() => setShowCancelConfirm(true)}
          className={`absolute right-6 top-6 w-9 h-9 rounded-full flex items-center justify-center transition focus:outline-none ${
            isLight
              ? 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="text-2xl font-light">&times;</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-4">

          {/* Cột trái: Mã QR Code */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-72 h-72 md:w-80 md:h-80 bg-white rounded-[32px] p-4 flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.2)] border-4 border-stone-100 relative overflow-hidden">
              {orderResult?.order_id ? (
                <img
                  src={`https://qr.sepay.vn/img?acc=0944368230&bank=MB&amount=${totalOrder}&des=PIZZA_INN_${orderResult.order_id}`}
                  alt="VietQR Payment QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eab308]"></div>
                  <span className="text-[10px] md:text-xs text-black/40 font-bold uppercase tracking-wider">{lang === 'en' ? 'Loading QR code...' : 'Đang tải mã QR...'}</span>
                </div>
              )}
            </div>

            <div className={`mt-5 border px-5 py-2.5 rounded-full flex items-center gap-2 text-xs md:text-sm font-extrabold shadow-sm ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-[#1a1408] border-[#eab308]/20 text-[#eab308]'
            }`}>
              <Clock size={16} className="animate-spin text-[#d4a017]" style={{ animationDuration: '4s' }} />
              <span>{lang === 'en' ? 'QR expires in: ' : 'Mã QR hết hạn sau: '}<span className="font-mono text-sm">{formatTime(timeLeft)}</span></span>
            </div>

            <p className={`mt-4 text-[10px] md:text-xs italic font-medium ${isLight ? 'text-[#8c7d6b]' : 'text-white/40'}`}>
              {lang === 'en' ? 'Use your banking or e-wallet app to scan the QR code' : 'Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã QR'}
            </p>
          </div>

          {/* Cột phải: Thông tin & Trạng thái thanh toán */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">

            <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-wide leading-tight ${
              isLight ? 'text-[#1c1208]' : 'text-white'
            }`}>
              {lang === 'en' ? `PAY FOR ORDER #${orderResult?.order_id}` : `THANH TOÁN ĐƠN HÀNG #${orderResult?.order_id}`} <br />
              <span className={isLight ? 'text-[#cd3645]' : 'text-[#eab308]'}>{lang === 'en' ? 'VIA VIETQR' : 'QUA VIETQR'}</span>
            </h2>

            <div className={`border rounded-[20px] p-5 mt-6 space-y-3.5 ${
              isLight
                ? 'bg-[#fcfaf6] border-black/10'
                : 'bg-[#121212] border-white/[0.06] shadow-xl'
            }`}>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className={`font-semibold ${isLight ? 'text-[#6e6254]' : 'text-white/50'}`}>{lang === 'en' ? 'Beneficiary Bank:' : 'Ngân hàng thụ hưởng:'}</span>
                <span className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>MB Bank (Quân Đội)</span>
              </div>
              <div className={`border-t pt-3 flex justify-between items-center text-xs md:text-sm ${
                isLight ? 'border-black/8' : 'border-white/[0.04]'
              }`}>
                <span className={`font-semibold ${isLight ? 'text-[#6e6254]' : 'text-white/50'}`}>{lang === 'en' ? 'Account No. / Holder:' : 'Số tài khoản / Chủ TK:'}</span>
                <span className={`font-mono font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>0944368230 • PIZZA&amp;PASTA INN</span>
              </div>
              <div className={`border-t pt-3 flex justify-between items-center text-xs md:text-sm ${
                isLight ? 'border-black/8' : 'border-white/[0.04]'
              }`}>
                <span className={`font-semibold ${isLight ? 'text-[#6e6254]' : 'text-white/50'}`}>
                  {lang === 'en'
                    ? `Total amount ${formData.order_type === 'delivery' ? `(incl. shipping ${shippingFee === 0 ? '0đ' : formatPrice(shippingFee)})` : ''}:`
                    : `Tổng thanh toán ${formData.order_type === 'delivery' ? `(đã gồm phí ship ${shippingFee === 0 ? '0đ' : formatPrice(shippingFee)})` : ''}:`}
                </span>
                <span className={`text-lg md:text-xl font-black tracking-wide ${isLight ? 'text-[#cd3645]' : 'text-[#eab308]'}`}>
                  {formatPrice(totalOrder)}
                </span>
              </div>
              <div className={`border-t pt-3 flex justify-between items-center text-xs md:text-sm ${
                isLight ? 'border-black/8' : 'border-white/[0.04]'
              }`}>
                <span className={`font-semibold ${isLight ? 'text-[#6e6254]' : 'text-white/50'}`}>{lang === 'en' ? 'Transfer Memo:' : 'Nội dung chuyển khoản:'}</span>
                <span className={`font-mono text-sm md:text-base font-extrabold px-3 py-1 rounded-lg border uppercase tracking-wider ${
                  isLight
                    ? 'bg-white border-black/12 text-[#1c1208]'
                    : 'bg-white/5 border-white/10 text-white'
                }`}>
                  PIZZA_INN_{orderResult?.order_id}
                </span>
              </div>
            </div>

            <div className={`border rounded-[20px] p-5 mt-4 space-y-3 ${
              isLight
                ? 'bg-[#fcfaf6] border-black/10'
                : 'bg-[#121212] border-white/[0.06] shadow-xl'
            }`}>
              <div className="flex items-center gap-2 text-[#d4a017] font-extrabold text-xs md:text-sm">
                <Bell size={16} className="text-[#d4a017]" />
                <span>{lang === 'en' ? 'Instant Automatic Verification' : 'Xác nhận tự động tức thì'}</span>
              </div>
              <div className={`space-y-2 text-xs md:text-sm leading-relaxed font-medium ${isLight ? 'text-[#5c4d3c]' : 'text-white/60'}`}>
                <p>
                  {lang === 'en' ? (
                    <>
                      Our system is automatically checking your VietQR transaction. As soon as your transfer succeeds, your order status will automatically update to <strong className={isLight ? 'text-[#1c1208]' : 'text-white'}>Confirmed</strong>.
                    </>
                  ) : (
                    <>
                      Hệ thống đang tự động kiểm tra giao dịch VietQR của bạn. Ngay khi chuyển khoản thành công, đơn hàng sẽ tự động chuyển sang trạng thái <strong className={isLight ? 'text-[#1c1208]' : 'text-white'}>Đã xác nhận</strong>.
                    </>
                  )}
                </p>
                <p className={isLight ? 'text-[#8c7d6b]' : 'text-white/40'}>
                  {lang === 'en'
                    ? 'If you prefer to pay cash on delivery, you can switch to COD below.'
                    : 'Nếu muốn thanh toán tiền mặt khi nhận hàng, bạn có thể nhấn nút đổi sang COD bên dưới.'}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => switchActiveOrderToCod()}
                className={`w-full border rounded-xl py-3.5 flex items-center justify-center gap-2 font-extrabold tracking-wider text-xs md:text-sm shadow-sm transition-all active:scale-[0.99] ${
                  isLight
                    ? 'bg-white hover:bg-stone-50 border-black/15 text-[#1c1208]'
                    : 'bg-[#141414] hover:bg-[#1a1a1a] border-[#eab308]/20 hover:border-[#eab308]/40 text-[#eab308]'
                }`}
              >
                <CreditCard size={16} />
                <span>{lang === 'en' ? 'SWITCH TO CASH ON DELIVERY (COD)' : 'ĐỔI SANG THANH TOÁN KHI NHẬN HÀNG (COD)'}</span>
              </button>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs font-extrabold text-red-500 hover:text-red-600 transition-all tracking-wider uppercase border border-red-500/20 bg-red-500/5 px-5 py-2.5 rounded-xl flex items-center gap-2 active:scale-[0.99]"
                >
                  <Trash2 size={14} />
                  <span>{lang === 'en' ? 'CANCEL THIS ORDER' : 'HỦY ĐƠN HÀNG NÀY'}</span>
                </button>
              </div>
            </div>

            {showCancelConfirm && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-[3px] z-[10001] flex items-center justify-center p-4 animate-fadeIn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.target === e.currentTarget) setShowCancelConfirm(false);
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`border rounded-2xl w-full max-w-[380px] p-6 shadow-2xl flex flex-col items-center text-center animate-scaleUp ${
                    isLight ? 'bg-white border-black/10 text-[#1c1208]' : 'bg-[#121212] border-white/10 text-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-4">
                    <AlertTriangle size={22} className="animate-pulse" />
                  </div>
                  <h3 className={`text-sm font-black uppercase tracking-wider mb-2 ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
                    {lang === 'en' ? 'Confirm Order Cancellation' : 'Xác nhận hủy đơn hàng'}
                  </h3>
                  <p className={`text-xs md:text-sm leading-relaxed font-medium mb-6 ${isLight ? 'text-[#5c4d3c]' : 'text-white/60'}`}>
                    {lang === 'en'
                      ? 'Are you sure you want to cancel this order? Your cart items will remain saved.'
                      : 'Bạn có chắc chắn muốn hủy đơn hàng này? Các món trong giỏ hàng của bạn vẫn sẽ được giữ nguyên.'}
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className={`flex-1 py-3 border rounded-xl font-extrabold text-xs md:text-sm transition-all duration-200 active:scale-[0.98] ${
                        isLight
                          ? 'bg-stone-100 hover:bg-stone-200 border-black/8 text-[#1c1208]'
                          : 'bg-[#1e1e1e] hover:bg-[#252525] border-white/5 text-white'
                      }`}
                    >
                      {lang === 'en' ? 'Go Back' : 'Quay lại'}
                    </button>
                    <button
                      onClick={() => cancelActiveOrder()}
                      className="flex-1 py-3 bg-[#cd3645] hover:bg-[#b52a38] text-white font-black text-xs md:text-sm rounded-xl transition-all duration-200 shadow-lg shadow-red-950/20 active:scale-[0.98]"
                    >
                      {lang === 'en' ? 'Cancel Order' : 'Hủy đơn'}
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
  const { theme, lang } = useUI();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-2xl w-full max-w-[580px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-100 transition-all ${
          isLight ? 'bg-white border-black/10 text-[#1c1208]' : 'bg-[#121212] border-white/10 text-white'
        }`}
      >
        <div className={`p-5 border-b flex justify-between items-center ${isLight ? 'border-black/10' : 'border-white/10'}`}>
          <h3 className={`text-[16px] font-black uppercase tracking-wider ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
            {lang === 'en' ? 'My Address Book' : 'Sổ địa chỉ của tôi'}
          </h3>
          <button
            className={`p-1.5 rounded-full transition flex items-center justify-center focus:outline-none ${
              isLight ? 'text-stone-400 hover:text-stone-800 hover:bg-stone-100' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
            onClick={onClose}
          >
            <span className="text-[22px] leading-none font-light">&times;</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin size={40} className={isLight ? 'text-stone-300 mb-3' : 'text-white/20 mb-3'} />
              <p className={`text-sm ${isLight ? 'text-[#8c7d6b]' : 'text-white/50'}`}>
                {lang === 'en' ? 'You have not saved any delivery addresses yet.' : 'Bạn chưa lưu địa chỉ nhận hàng nào.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.user_address_id;
                return (
                  <div
                    key={addr.user_address_id}
                    className={`flex items-start gap-4 py-4 border-b cursor-pointer transition px-3 rounded-xl ${
                      isLight
                        ? 'border-black/[0.06] hover:bg-stone-50'
                        : 'border-white/[0.06] hover:bg-white/[0.02]'
                    }`}
                    onClick={() => onSelect(addr)}
                  >
                    <div className={`mt-1.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'border-[#cd3645]' : isLight ? 'border-stone-300' : 'border-white/30'
                    }`}>
                      {isSelected && <div className="w-[10px] h-[10px] rounded-full bg-[#cd3645]" />}
                    </div>
                    <div className="flex-1 text-[13.5px] leading-relaxed">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-extrabold ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>{addr.recipient_name}</span>
                        <span className={isLight ? 'text-stone-300' : 'text-white/20'}>|</span>
                        <span className={isLight ? 'text-[#6e6254]' : 'text-white/60'}>{addr.recipient_phone}</span>
                      </div>
                      <div className={`mb-1 ${isLight ? 'text-[#2c2219]' : 'text-white/80'}`}>{addr.address_detail}</div>
                      {addr.is_default && (
                        <span className="border border-[#cd3645] text-[#cd3645] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase inline-block">
                          {lang === 'en' ? 'Default' : 'Mặc định'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between self-stretch">
                      <button
                        type="button"
                        className={`font-bold text-[13px] hover:underline focus:outline-none ${
                          isLight ? 'text-[#cd3645]' : 'text-[#f5c043]'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(addr);
                        }}
                      >
                        {lang === 'en' ? 'Edit' : 'Sửa'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className={`p-5 border-t flex gap-4 ${isLight ? 'border-black/10 bg-[#faf7f2]' : 'border-white/10 bg-[#0d0d0d]'}`}>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 p-3.5 border border-dashed rounded-xl font-bold text-[14px] hover:border-[#cd3645] hover:text-[#cd3645] hover:bg-[#cd3645]/[0.03] transition-all focus:outline-none ${
              isLight ? 'border-black/20 text-[#1c1208]' : 'border-white/20 text-white'
            }`}
            onClick={onAddNew}
          >
            <span className="text-lg font-bold">+</span> {lang === 'en' ? 'Add New Address' : 'Thêm địa chỉ mới'}
          </button>
          <button type="button" className="flex-1 p-3.5 bg-gradient-to-r from-[#cd3645] to-[#a02030] rounded-xl text-white font-black text-[14px] hover:scale-[1.01] hover:shadow-lg hover:shadow-[#cd3645]/20 transition-all text-center focus:outline-none" onClick={onClose}>
            {lang === 'en' ? 'Confirm' : 'Xác nhận'}
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
  const [coordsConfirmed, setCoordsConfirmed] = useState(false);

  const { user } = useAuthStore();
  const { theme, lang } = useUI();
  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen) {
      if (address) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(address.recipient_name || '');
        setPhone(address.recipient_phone || '');
        setAddressDetail(address.address_detail || '');
        setInitialFormAddress(address.address_detail || '');
        setIsDefault(!!address.is_default);
        setCoordLat(address.latitude ?? null);
        setCoordLon(address.longitude ?? null);
        setCoordsConfirmed(!!(address.latitude && address.longitude));
      } else {
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
    if (!name.trim()) return alert(lang === 'en' ? 'Please enter recipient full name' : 'Vui lòng nhập họ tên người nhận');
    if (!phone.trim()) return alert(lang === 'en' ? 'Please enter phone number' : 'Vui lòng nhập số điện thoại');
    if (!addressDetail.trim()) return alert(lang === 'en' ? 'Please enter or select a delivery address' : 'Vui lòng nhập hoặc chọn địa chỉ giao hàng');

    let lat = coordLat;
    let lon = coordLon;

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
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-[4px] flex items-center justify-center z-[10000] p-4 animate-fadeIn"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-100 transition-all ${
          isLight ? 'bg-white border-black/10 text-[#1c1208]' : 'bg-[#121212] border-white/10 text-white'
        }`}
      >
        <div className={`p-5 border-b flex justify-between items-center ${isLight ? 'border-black/10' : 'border-white/10'}`}>
          <h3 className={`text-[16px] font-black uppercase tracking-wider ${isLight ? 'text-[#1c1208]' : 'text-white'}`}>
            {address ? (lang === 'en' ? 'Update Address' : 'Cập nhật địa chỉ') : (lang === 'en' ? 'Add New Address' : 'Thêm địa chỉ mới')}
          </h3>
          <button
            className={`p-1.5 rounded-full transition flex items-center justify-center focus:outline-none ${
              isLight ? 'text-stone-400 hover:text-stone-800 hover:bg-stone-100' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
            onClick={onClose}
          >
            <span className="text-[22px] leading-none font-light">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex flex-col gap-5">
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block ${isLight ? 'text-[#5c4d3c]' : 'text-white/50'}`}>
                  {lang === 'en' ? 'Recipient Full Name (*)' : 'Họ và tên người nhận (*)'}
                </label>
                <input
                  type="text"
                  className="checkout-input w-full"
                  placeholder={lang === 'en' ? 'Enter recipient full name...' : 'Nhập họ và tên người nhận...'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block ${isLight ? 'text-[#5c4d3c]' : 'text-white/50'}`}>
                  {lang === 'en' ? 'Phone Number (*)' : 'Số điện thoại (*)'}
                </label>
                <input
                  type="tel"
                  className="checkout-input w-full"
                  placeholder={lang === 'en' ? 'Enter phone number...' : 'Nhập số điện thoại...'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-[#5c4d3c]' : 'text-white/50'}`}>
                    {lang === 'en' ? 'Delivery Address (*)' : 'Địa chỉ giao hàng (*)'}
                  </label>
                  {coordsConfirmed ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>
                      {lang === 'en' ? 'Coordinates verified' : 'Đã xác định tọa độ'}
                    </span>
                  ) : addressDetail.trim() ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>
                      {lang === 'en' ? 'Select suggestion for accuracy' : 'Chọn gợi ý để chính xác hơn'}
                    </span>
                  ) : null}
                </div>
                <AddressPickerVN
                  initialAddress={initialFormAddress}
                  onChange={(val) => {
                    setAddressDetail(val);
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
                  <p className={`mt-1.5 text-[11px] leading-snug ${isLight ? 'text-amber-700' : 'text-amber-400/80'}`}>
                    {lang === 'en'
                      ? 'Select an address from suggestions to save coordinates and calculate shipping accurately.'
                      : 'Chọn địa chỉ từ danh sách gợi ý để lưu tọa độ và tính phí giao hàng chính xác.'}
                  </p>
                )}
              </div>

              <div>
                <label className={`flex items-center gap-2 text-[13.5px] cursor-pointer user-select-none mt-2 ${isLight ? 'text-[#1c1208]' : 'text-white/80'}`}>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="cursor-pointer w-4 h-4 accent-[#cd3645]"
                  />
                  <span>{lang === 'en' ? 'Set as default address' : 'Đặt làm địa chỉ mặc định'}</span>
                </label>
              </div>
            </div>
          </div>
          <div className={`p-5 border-t flex gap-3 ${isLight ? 'border-black/10 bg-[#faf7f2]' : 'border-white/10 bg-[#0d0d0d]'}`}>
            {address && onDelete && (
              <button
                type="button"
                className="p-3.5 px-5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-[14px] hover:bg-red-500/15 hover:border-red-500 transition focus:outline-none"
                onClick={() => onDelete(address.user_address_id)}
              >
                {lang === 'en' ? 'Delete' : 'Xóa'}
              </button>
            )}
            <button
              type="button"
              className={`flex-1 p-3.5 border rounded-xl font-bold text-[14px] transition text-center focus:outline-none ${
                isLight
                  ? 'bg-white border-black/15 text-[#1c1208] hover:bg-stone-100'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              onClick={onClose}
              disabled={isGeocoding}
            >
              {lang === 'en' ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={isGeocoding}
              className="flex-1 p-3.5 bg-gradient-to-r from-[#cd3645] to-[#a02030] rounded-xl text-white font-black text-[14px] hover:scale-[1.01] hover:shadow-lg hover:shadow-[#cd3645]/20 transition-all text-center focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isGeocoding ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  {lang === 'en' ? 'Locating...' : 'Đang định vị...'}
                </>
              ) : lang === 'en' ? 'Save' : 'Hoàn tất'}
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
  const { step, formData, updateFormData, error, setEmailVerified } = useOrderStore();
  const { lang } = useUI();
  const [isMounted, setIsMounted] = useState(false);

  // States cho address management
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Stores coordinates state
  const [stores, setStores] = useState<any[]>([]);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setLoadingAddresses(true);
    try {
      const res = await fetch(`${API_BASE}/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token, fetchAddresses]);

  // Đồng bộ thông tin user khi đăng nhập (name, phone, email)
  useEffect(() => {
    if (user) {
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

  // Tự động tính khoảng cách và phí giao hàng ngay trên trang Checkout
  useEffect(() => {
    if (formData.order_type !== 'delivery') {
      updateFormData({
        distance: 0,
        shipping_fee: 0,
        nearest_store_name: '',
      });
      return;
    }

    const addressText = (formData.customer_address || '').trim();
    const hasCoords =
      typeof formData.customer_lat === 'number' &&
      typeof formData.customer_lon === 'number';

    if (addressText.length < 4 && !hasCoords) {
      updateFormData({
        distance: 0,
        shipping_fee: 0,
        nearest_store_name: '',
      });
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsCalculatingDistance(true);
      try {
        const res = await fetch(`${API_BASE}/shipping/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: formData.customer_lat,
            longitude: formData.customer_lon,
            address: addressText,
          }),
        });
        const json = await res.json();
        if (!isCancelled && res.ok && json.success && json.data) {
          const d = json.data;
          updateFormData({
            distance: d.distance_meters,
            nearest_store_name: d.store_name,
            shipping_fee: d.shipping_fee,
            store_id: d.store_id,
            customer_lat: d.customer_latitude ?? formData.customer_lat,
            customer_lon: d.customer_longitude ?? formData.customer_lon,
          });
        }
      } catch (err) {
        console.warn('Error calculating shipping fee:', err);
      } finally {
        if (!isCancelled) {
          setIsCalculatingDistance(false);
        }
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [formData.order_type, formData.customer_address, formData.user_address_id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAddresses();
        setShowFormModal(false);
        setEditingAddress(null);
      } else {
        alert(data.message || (lang === 'en' ? 'Could not save address' : 'Không thể lưu địa chỉ'));
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert(lang === 'en' ? 'Could not connect to server' : 'Không thể kết nối đến máy chủ');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!token) return;
    if (!confirm(lang === 'en' ? 'Are you sure you want to delete this address?' : 'Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      const res = await fetch(`${API_BASE}/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAddresses();
        setShowFormModal(false);
        setEditingAddress(null);
      } else {
        alert(data.message || (lang === 'en' ? 'Could not delete address' : 'Không thể xóa địa chỉ'));
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert(lang === 'en' ? 'Could not connect to server' : 'Không thể kết nối đến máy chủ');
    }
  };

  if (!isMounted) return null;

  // Success page
  if (step === 'success') {
    return (
      <div className="checkout-page flex items-center justify-center min-h-screen">
        <OrderSuccess stores={stores} />
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

  // Payment page
  if (step === 'payment') {
    return (
      <div className="checkout-page flex items-center justify-center min-h-screen">
        <OrderPaymentModal />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Header aligned with content container */}
      <div className="checkout-header">
        <button type="button" className="checkout-back-btn" onClick={() => router.back()}>
          <span className="checkout-back-icon">
            <ArrowLeft size={18} />
          </span>
          <span>{lang === 'en' ? 'CHECKOUT' : 'THANH TOÁN ĐƠN HÀNG'}</span>
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
            isCalculatingDistance={isCalculatingDistance}
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
