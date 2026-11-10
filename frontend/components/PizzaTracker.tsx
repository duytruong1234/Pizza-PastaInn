'use client';

import React from 'react';
import {
  ClipboardCheck,
  ChefHat,
  Flame,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useUI } from '@/components/UIProvider';

export interface PizzaTrackerOrder {
  order_id: number;
  order_status: string;
  order_type?: string | null;
  created_at?: string | null;
  confirmed_at?: string | null;
  preparing_at?: string | null;
  shipped_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  estimated_delivery_time?: string | null;
  pickup_time?: string | null;
}

interface PizzaTrackerProps {
  order: PizzaTrackerOrder;
  isDark?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const formatShortTime = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} (${dd}/${mo})`;
};

export function isActiveOrderStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'pending' || s === 'confirmed' || s === 'preparing' || s === 'processing' || s === 'shipped' || s === 'delivering';
}

export default function PizzaTracker({
  order,
  isDark = true,
  onRefresh,
  refreshing = false,
}: PizzaTrackerProps) {
  const { lang } = useUI();
  const isEn = lang === 'en';
  const status = (order.order_status || 'pending').toLowerCase();
  const isPickup = order.order_type === 'pickup';

  if (status === 'cancelled') {
    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-3.5 ${
          isDark
            ? 'bg-red-500/10 border-red-500/25 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-500">
          <XCircle size={22} />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-wide">
            {isEn ? 'Order Cancelled' : 'Đơn hàng đã bị hủy'}
          </p>
          {order.cancelled_at && (
            <p className="text-xs opacity-80 mt-0.5 font-medium">
              {isEn ? 'Cancelled at:' : 'Thời gian hủy:'} {formatShortTime(order.cancelled_at)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Xác định bước hiện tại (0 -> 4)
  let currentStep = 0;
  if (status === 'pending') currentStep = 0;
  else if (status === 'confirmed') currentStep = 1;
  else if (status === 'preparing' || status === 'processing') currentStep = 2;
  else if (status === 'shipped' || status === 'delivering') currentStep = 3;
  else if (status === 'arrived' || status === 'completed') currentStep = 4;

  // Nếu đơn đã chuyển sang bước sau nhưng các mốc trung gian chưa ghi giờ riêng, vẫn đánh dấu hoàn tất bước trước
  const steps = [
    {
      key: 'pending',
      label: isEn ? 'Order Received' : 'Đã nhận đơn',
      desc: isEn ? 'Waiting for restaurant confirmation' : 'Đang chờ cửa hàng xác nhận',
      time: formatShortTime(order.created_at),
      Icon: ClipboardCheck,
    },
    {
      key: 'confirmed',
      label: isEn ? 'Confirmed' : 'Đã xác nhận',
      desc: isEn ? 'Kitchen has received your order' : 'Bếp đã tiếp nhận đơn hàng',
      time: formatShortTime(order.confirmed_at),
      Icon: ChefHat,
    },
    {
      key: 'preparing',
      label: isEn ? 'Baking' : 'Đang nướng bánh',
      desc: isEn ? 'Kneading dough & baking fresh in the oven' : 'Đang nhào bột & nướng lò nóng hổi',
      time: formatShortTime(order.preparing_at),
      Icon: Flame,
    },
    {
      key: 'shipped',
      label: isPickup
        ? isEn
          ? 'Ready at Counter'
          : 'Sẵn sàng tại quầy'
        : isEn
          ? 'Out for Delivery'
          : 'Đang giao hàng',
      desc: isPickup
        ? isEn
          ? 'Please visit the branch to pick up your order'
          : 'Mời bạn ghé chi nhánh nhận bánh'
        : isEn
          ? 'Driver is on the way to your address'
          : 'Tài xế đang trên đường giao đến bạn',
      time: formatShortTime(order.shipped_at),
      Icon: Truck,
    },
    {
      key: 'completed',
      label: isEn ? 'Completed' : 'Hoàn tất',
      desc: isEn ? 'Enjoy your meal!' : 'Chúc bạn ngon miệng!',
      time: formatShortTime(order.completed_at || order.arrived_at),
      Icon: CheckCircle2,
    },
  ];

  const activeStepInfo = steps[currentStep] || steps[0];
  const isLive = currentStep < 4;
  const etaText = isPickup
    ? formatShortTime(order.pickup_time)
    : formatShortTime(order.estimated_delivery_time);

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
        isDark
          ? 'bg-[#181411] border-white/[0.08]'
          : 'bg-white border-zinc-200/90 shadow-xs'
      }`}
    >
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-dashed border-current/10">
        <div className="flex items-center gap-2.5">
          {isLive ? (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          ) : (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          )}
          <div>
            <span
              className={`text-xs sm:text-sm font-black uppercase tracking-wide ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}
            >
              Pizza Tracker: {activeStepInfo.label}
            </span>
            <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {activeStepInfo.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {etaText && isLive && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                isDark
                  ? 'bg-[#f5c043]/10 border-[#f5c043]/30 text-[#f5c043]'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <Clock size={12} />
              <span>
                {isPickup
                  ? isEn
                    ? 'Pickup time:'
                    : 'Hẹn lấy:'
                  : isEn
                    ? 'Est. delivery:'
                    : 'Dự kiến giao:'}{' '}
                {etaText}
              </span>
            </div>
          )}

          {onRefresh && isLive && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title={isEn ? 'Refresh latest status' : 'Cập nhật trạng thái mới nhất'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-300'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-700'
              }`}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5-Step Progress Track */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep || currentStep === 4;
          const isCurrent = idx === currentStep && currentStep < 4;
          const StepIcon = step.Icon;

          return (
            <div
              key={step.key}
              className={`flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 p-2.5 sm:p-2 rounded-xl transition-all ${
                isCurrent
                  ? isDark
                    ? 'bg-[#f5c043]/12 border border-[#f5c043]/35'
                    : 'bg-emerald-50/90 border border-emerald-300'
                  : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : isCurrent
                      ? isDark
                        ? 'bg-[#f5c043] text-zinc-950 ring-4 ring-[#f5c043]/20'
                        : 'bg-[#007a3f] text-white ring-4 ring-[#007a3f]/20'
                      : isDark
                        ? 'bg-white/[0.06] text-zinc-500 border border-white/10'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                }`}
              >
                <StepIcon size={17} strokeWidth={2.3} />
              </div>

              <div className="flex-1 sm:text-center min-w-0">
                <p
                  className={`text-xs font-extrabold leading-tight ${
                    isCompleted || isCurrent
                      ? isDark
                        ? 'text-white'
                        : 'text-zinc-900'
                      : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </p>
                {step.time ? (
                  <p
                    className={`text-[10px] font-semibold mt-0.5 ${
                      isCurrent
                        ? isDark
                          ? 'text-[#f5c043]'
                          : 'text-[#007a3f]'
                        : isDark
                          ? 'text-zinc-400'
                          : 'text-zinc-500'
                    }`}
                  >
                    {step.time}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500/70 mt-0.5">
                    {isCompleted
                      ? isEn
                        ? 'Done'
                        : 'Đã xong'
                      : isCurrent
                        ? isEn
                          ? 'In progress...'
                          : 'Đang xử lý...'
                        : '—'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
