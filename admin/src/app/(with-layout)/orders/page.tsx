// Trang quản lý đơn hàng — với modal chi tiết đơn hàng
"use client";

import { api, API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { useDialog } from "@/components/ui/dialog-provider";

interface Order {
  order_id: number;
  user?: { username: string; email: string; phone: string };
  user_address?: { address_line: string };
  order_status: string;
  payment_method: string;
  payment_status: string;
  total_price_dish: number;
  shipping_fee: number;
  discount_amount: number;
  total_order: number;
  order_note: string;
  created_at: string;
  order_type: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  store_id?: number;
  store?: { store_id: number; store_name: string; address: string; hotline?: string };
  customer_latitude?: number;
  customer_longitude?: number;
  shipping_distance_meters?: number;
  items?: any[];
  confirmed_at?: string;
  preparing_at?: string;
  shipped_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  estimated_delivery_time?: string;
  pickup_time?: string;
}

const STATUS_COLORS: Record<string, "warning" | "info" | "primary" | "secondary" | "success" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  preparing: "primary",
  shipped: "secondary",
  completed: "success",
  cancelled: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  shipped: "Đang giao hàng",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

function renderStatusBadge(status: string) {
  const statusLower = status.toLowerCase();
  const label = STATUS_LABELS[statusLower] || status;
  switch (statusLower) {
    case "pending":
      return <Badge className="bg-[#FF8C00] hover:bg-[#E07B00] text-white">{label}</Badge>;
    case "confirmed":
    case "preparing":
      return <Badge variant="warning">{label}</Badge>; // Yellow
    case "shipped":
    case "delivering":
      return <Badge className="bg-[#1E90FF] hover:bg-[#1C86EE] text-white">{label}</Badge>; // Blue
    case "completed":
      return <Badge variant="success">{label}</Badge>; // Green
    case "cancelled":
      return <Badge variant="danger">{label}</Badge>; // Red
    default:
      return <Badge variant="dark">{label}</Badge>;
  }
}

const FALLBACK_ORDER_ITEM_IMAGE = "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop";
const FALLBACK_COMBO_IMAGE = "https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=100&auto=format&fit=crop";

const getOrderItemImageUrl = (imagePath?: string | null, fallback = FALLBACK_ORDER_ITEM_IMAGE) => {
  const src = imagePath?.trim();
  if (!src) return fallback;
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  if (src.startsWith("/uploads/") || src.startsWith("uploads/")) {
    const backendBase = API_URL.replace(/\/$/, "");
    return `${backendBase}/${src.replace(/^\/+/, "")}`;
  }

  return src;
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  vietqr: "Chuyển khoản VietQR",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  delivery: "Giao hàng",
  pickup: "Nhận tại cửa hàng",
};

// ── Modal chi tiết đơn hàng ──────────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: number, newStatus: string, extraData?: any) => Promise<void>;
}) {
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [shippingFee, setShippingFee] = useState(order?.shipping_fee || 0);
  const [discountAmount, setDiscountAmount] = useState(order?.discount_amount || 0);
  const [deliveryDuration, setDeliveryDuration] = useState("30"); // "30", "45", "60", "90", "custom"
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showAlert, showDanger } = useDialog();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (order) {
      setShippingFee(order.shipping_fee || 0);
      setDiscountAmount(order.discount_amount || 0);
    }
  }, [order]);

  if (!order) return null;
  if (!mounted) return null;

  const handlePrintInvoice = (o: Order) => {
    const itemsHtml = (o.items || []).map((item: any) => {
      const isCombo = !!item.combo_id;
      const isHalfHalf = !!item.is_half_half;
      let name = 'Món ăn';
      const subDetails: string[] = [];

      if (isCombo) {
        name = item.combo?.combo_name || `Combo #${item.combo_id}`;
      } else if (isHalfHalf) {
        name = 'Pizza Half & Half';
        if (Array.isArray(item.halves)) {
          item.halves.forEach((h: any, idx: number) => {
            if (h.dish?.dish_name) subDetails.push(`Nửa ${idx + 1}: ${h.dish.dish_name}`);
          });
        }
      } else {
        name = item.dish_price?.dish?.dish_name || 'Món ăn';
        const sizeName = item.dish_price?.size?.size_name;
        const crustName = item.dish_price?.crust?.crust_name;
        if (sizeName || crustName) {
          subDetails.push([sizeName ? `Cỡ ${sizeName}` : '', crustName ? `Đế ${crustName}` : ''].filter(Boolean).join(' • '));
        }
      }

      if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        subDetails.push('Topping: ' + item.toppings.map((t: any) => t.topping?.topping_name || '').filter(Boolean).join(', '));
      }
      if (item.order_item_note) {
        subDetails.push(`Ghi chú món: ${item.order_item_note}`);
      }

      const unitPrice = Number(item.order_price || 0);
      const qty = Number(item.quantity || 1);
      return `<tr>
        <td style="padding:6px 8px;border-bottom:1px dashed #ddd;text-align:left">
          <div style="font-weight:700">${name}</div>
          ${subDetails.map((d) => `<div style="font-size:11px;color:#555;margin-top:2px">- ${d}</div>`).join('')}
        </td>
        <td style="padding:6px 8px;border-bottom:1px dashed #ddd;text-align:center;font-weight:700">x${qty}</td>
        <td style="padding:6px 8px;border-bottom:1px dashed #ddd;text-align:right;font-weight:700">${(unitPrice * qty).toLocaleString()} đ</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hóa đơn #${o.order_id}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Tahoma,sans-serif;padding:20px;max-width:380px;margin:0 auto;color:#111}
      .header{text-align:center;padding-bottom:12px;margin-bottom:12px;border-bottom:2px dashed #111}
      .header h1{font-size:20px;font-weight:900;margin-bottom:2px}
      .header p{font-size:11px;color:#555;font-weight:700}
      .info{margin-bottom:12px;font-size:12.5px;line-height:1.7;border-bottom:1px dashed #ccc;padding-bottom:10px}
      .info strong{color:#111}
      .note-box{background:#fff8eb;border:1px solid #f5c043;border-radius:8px;padding:8px 10px;font-size:12px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;font-size:12.5px;margin:8px 0}
      th{background:#f5f5f5;padding:7px 8px;text-align:left;font-weight:800;border-bottom:2px solid #111}
      .totals{padding-top:10px;margin-top:10px;font-size:13px}
      .totals .row{display:flex;justify-content:space-between;padding:3px 0}
      .totals .grand{font-size:16px;font-weight:900;color:#d91f1f;border-top:2px solid #111;padding-top:8px;margin-top:6px}
      .footer{text-align:center;margin-top:16px;padding-top:12px;font-size:11px;color:#666;border-top:1px dashed #ccc}
      @media print{body{padding:0;max-width:100%}button{display:none!important}}
    </style></head><body>
    <div class="header">
      <h1>PIZZA & PASTA INN</h1>
      <p>PHIẾU BẾP & HÓA ĐƠN GIAO HÀNG #${o.order_id}</p>
    </div>
    <div class="info">
      <div><strong>Khách hàng:</strong> ${o.customer_name || 'Khách vãng lai'}</div>
      <div><strong>SĐT:</strong> ${o.customer_phone || 'N/A'}</div>
      ${o.user_address?.address_line ? `<div><strong>Địa chỉ giao:</strong> ${o.user_address.address_line}</div>` : ''}
      ${o.store?.store_name ? `<div><strong>Chi nhánh:</strong> ${o.store.store_name}</div>` : ''}
      <div><strong>Loại đơn:</strong> ${ORDER_TYPE_LABELS[o.order_type] || o.order_type}</div>
      <div><strong>Thanh toán:</strong> ${PAYMENT_LABELS[o.payment_method] || o.payment_method} (${o.payment_status === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'})</div>
      <div><strong>Ngày đặt:</strong> ${o.created_at ? dayjs(o.created_at).format('DD/MM/YYYY HH:mm') : 'N/A'}</div>
    </div>
    ${o.order_note ? `<div class="note-box"><strong>Ghi chú / Gia vị / Dụng cụ:</strong><br/>${o.order_note}</div>` : ''}
    <table>
      <thead><tr><th>Món ăn / Chi tiết</th><th style="text-align:center">SL</th><th style="text-align:right">Thành tiền</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Tạm tính:</span><span>${(o.total_price_dish || 0).toLocaleString()} đ</span></div>
      <div class="row"><span>Phí giao hàng:</span><span>${(o.shipping_fee || 0).toLocaleString()} đ</span></div>
      ${(o.discount_amount || 0) > 0 ? `<div class="row" style="color:#007a3f;font-weight:700"><span>Giảm giá (Voucher/Điểm):</span><span>-${(o.discount_amount || 0).toLocaleString()} đ</span></div>` : ''}
      <div class="row grand"><span>TỔNG THU:</span><span>${(o.total_order || 0).toLocaleString()} đ</span></div>
    </div>
    <div class="footer">
      <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
      <p>Pizza & Pasta Inn • Hotline: 1900 6066</p>
    </div>
    <button onclick="window.print()" style="display:block;width:100%;margin-top:16px;padding:10px;background:#5750F1;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">In hóa đơn / Phiếu bếp (K80)</button>
    </body></html>`;

    const printWindow = window.open('', '_blank', 'width=440,height=680');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      let estimatedTimeStr = null;
      if (deliveryDuration !== "custom") {
        estimatedTimeStr = dayjs().add(parseInt(deliveryDuration), "minute").toISOString();
      } else if (customTime) {
        // customTime is "HH:mm" today, let's construct the full ISO date
        const [hours, minutes] = customTime.split(":");
        estimatedTimeStr = dayjs()
          .set("hour", parseInt(hours))
          .set("minute", parseInt(minutes))
          .set("second", 0)
          .toISOString();
      }

      await onUpdateStatus(order.order_id, "confirmed", {
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        estimated_delivery_time: estimatedTimeStr,
      });
      setShowConfirmForm(false);
    } catch {
      await showAlert("Lỗi khi duyệt đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div>
            <h2 className="text-lg font-bold text-dark dark:text-white">
              CHI TIẾT ĐƠN HÀNG #{order.order_id}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {order.created_at ? dayjs(order.created_at).format("DD/MM/YYYY HH:mm:ss") : "Chưa xác định"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrintInvoice(order)}
              className="rounded-lg border border-primary bg-primary/10 text-primary px-3 py-2 text-xs font-bold hover:bg-primary hover:text-white transition flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              In hóa đơn
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-stroke w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:border-dark-3 dark:hover:bg-dark-2 transition"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tên:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.customer_name || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Số điện thoại:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.customer_phone || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.customer_email || "Chưa cập nhật"}
                  </span>
                </div>
                {order.user_address?.address_line && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Địa chỉ:</span>
                    <span className="font-medium text-dark dark:text-white text-right max-w-[60%]">
                      {order.user_address.address_line}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                Thông tin đơn hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái:</span>
                  {renderStatusBadge(order.order_status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Loại đơn hàng:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {ORDER_TYPE_LABELS[order.order_type] || order.order_type}
                  </span>
                </div>
                {order.order_type === 'pickup' && order.store && (
                  <div className="flex flex-col border-t border-stroke pt-2 mt-2 dark:border-dark-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cửa hàng nhận:</span>
                      <span className="font-bold text-primary">{order.store.store_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Địa chỉ:</span>
                      <span className="font-medium text-dark dark:text-white text-right max-w-[70%]">{order.store.address}</span>
                    </div>
                    {order.store.hotline && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hotline:</span>
                        <span className="font-medium text-dark dark:text-white">{order.store.hotline}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Thanh toán:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái thanh toán:</span>
                  <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                    {order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </Badge>
                </div>
                {order.pickup_time && (
                  <div className="flex justify-between border-t border-stroke pt-1.5 mt-1.5 dark:border-dark-3 font-semibold">
                    <span className="text-gray-400">Thời gian nhận hàng:</span>
                    <span className="font-extrabold text-[#d4a017]">
                      {dayjs(order.pickup_time).format("HH:mm - DD/MM/YYYY")}
                    </span>
                  </div>
                )}
                {order.estimated_delivery_time && (
                  <div className="flex justify-between border-t border-stroke pt-1.5 mt-1.5 dark:border-dark-3 font-semibold">
                    <span className="text-gray-400">Giao hàng dự kiến:</span>
                    <span className="font-extrabold text-[#d4a017]">
                      {dayjs(order.estimated_delivery_time).format("HH:mm - DD/MM/YYYY")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Information / Cửa hàng xử lý */}
          {(order.store || order.shipping_distance_meters || order.customer_latitude) && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide flex items-center gap-2">
                Thông tin giao hàng
              </h3>
              <div className="space-y-2 text-sm">
                {order.store && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cửa hàng xử lý:</span>
                    <span className="font-bold text-primary">
                      {order.store.store_name}
                    </span>
                  </div>
                )}
                {order.store?.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Địa chỉ cửa hàng:</span>
                    <span className="font-medium text-dark dark:text-white text-right max-w-[60%]">
                      {order.store.address}
                    </span>
                  </div>
                )}
                {order.shipping_distance_meters != null && order.shipping_distance_meters > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Khoảng cách:</span>
                    <span className="font-bold text-dark dark:text-white">
                      {(Number(order.shipping_distance_meters) / 1000).toFixed(2)} km
                    </span>
                  </div>
                )}
                {order.customer_latitude != null && order.customer_longitude != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tọa độ khách hàng:</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300 text-xs">
                      {Number(order.customer_latitude).toFixed(7)}, {Number(order.customer_longitude).toFixed(7)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chi tiết món */}
          <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
              Danh sách món ăn ({order.items?.length || 0} món)
            </h3>
            <div className="divide-y divide-stroke dark:divide-dark-3 border border-stroke dark:border-dark-3 p-5 rounded-xl space-y-4 bg-gray-50/20 dark:bg-dark-2/10">
              {(order.items || []).map((item: any, idx: number) => {
                let dishName = '';
                let imageSrc = FALLBACK_ORDER_ITEM_IMAGE;
                let itemSpec = '';

                const isCombo = !!item.combo_id;
                const isHalfHalf = !!item.is_half_half;

                if (isCombo) {
                  dishName = item.combo?.combo_name || `Combo #${item.combo_id}`;
                  imageSrc = getOrderItemImageUrl(item.combo?.image_combo, FALLBACK_COMBO_IMAGE);
                } else if (isHalfHalf) {
                  dishName = 'PIZZA HALF & HALF';
                  imageSrc = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=100&auto=format&fit=crop';
                  const size = item.dish_price?.size?.size_name;
                  const crust = item.dish_price?.crust?.crust_name;
                  itemSpec = `${size ? `SIZE: ${size.toUpperCase()}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` - CRUST: ${crust.toUpperCase()}` : ''}`;
                } else {
                  dishName = item.dish_price?.dish?.dish_name || 'Món ăn';
                  imageSrc = getOrderItemImageUrl(item.dish_price?.dish?.image, imageSrc);
                  const isPizza = dishName.toLowerCase().includes('pizza');
                  if (isPizza) {
                    const size = item.dish_price?.size?.size_name;
                    const crust = item.dish_price?.crust?.crust_name;
                    itemSpec = `${size ? `SIZE: ${size.toUpperCase()}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` - CRUST: ${crust.toUpperCase()}` : ''}`;
                  }
                }

                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={imageSrc}
                        alt={dishName}
                        onError={(event) => {
                          const img = event.currentTarget;
                          if (!img.dataset.fallbackApplied) {
                            img.dataset.fallbackApplied = "true";
                            img.src = FALLBACK_ORDER_ITEM_IMAGE;
                          }
                        }}
                        className="w-16 h-16 rounded-full object-cover shrink-0 border border-stroke dark:border-dark-3 shadow-md"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-extrabold text-sm md:text-base text-dark dark:text-white leading-snug">
                          {dishName}
                        </h4>
                        <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                          Số lượng: x{item.quantity}
                        </div>
                        {itemSpec && (
                          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">
                            {itemSpec}
                          </p>
                        )}

                        {/* Render combo details */}
                        {isCombo && item.combos && item.combos.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-primary/20 text-xs space-y-2 text-gray-500 dark:text-gray-400">
                            {item.combos.map((sel: any, cIdx: number) => {
                              const selDishName = sel.dish_price?.dish?.dish_name || sel.dish_price_id || "Combo item";
                              const selSizeName = sel.dish_price?.size?.size_name;
                              const selCrustName = sel.dish_price?.crust?.crust_name;
                              const isPizza = selDishName.toLowerCase().includes("pizza");
                              const selQtyPrefix = sel.quantity && sel.quantity > 1 ? `${sel.quantity} x ` : "";
                              const selSpec = isPizza && (selSizeName || selCrustName)
                                ? `${selSizeName ? `SIZE: ${selSizeName.toUpperCase()}` : ''}${selCrustName && selCrustName.toLowerCase() !== 'none' ? ` - CRUST: ${selCrustName.toUpperCase()}` : ''}`
                                : '';

                              return (
                                <div key={cIdx} className="space-y-0.5">
                                  <p className="font-bold text-dark dark:text-white">
                                    {cIdx + 1}. {selQtyPrefix}{sel.is_half_half ? 'Pizza Half & Half' : selDishName}
                                  </p>
                                  <div className="pl-3 text-[10px] text-gray-400 space-y-0.5">
                                    {selSpec && <p className="font-bold uppercase tracking-wider text-gray-400">{selSpec}</p>}
                                    {sel.toppings && sel.toppings.length > 0 && (
                                      <p className="italic">
                                        + Topping: {sel.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                                      </p>
                                    )}
                                    {sel.is_half_half && sel.halves && sel.halves.length > 0 && (
                                      <div className="pl-2 border-l border-blue-400/30 py-0.5 space-y-1">
                                        {sel.halves.map((h: any, hIdx: number) => (
                                          <div key={hIdx} className="text-[11px]">
                                            <span className="text-gray-400 font-medium">Nửa {hIdx + 1}: </span>
                                            <span className="font-bold text-dark dark:text-white">{h.dish?.dish_name}</span>
                                            {h.order_item_toppings && h.order_item_toppings.length > 0 && (
                                              <span className="block pl-3 text-[10px] text-gray-400 italic">
                                                + Topping: {h.order_item_toppings.map((t: any) => `${t.topping?.topping_name} (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {sel.order_combo_note && (
                                      <p className="text-red-500 italic text-[11px]">Ghi chú: {sel.order_combo_note}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Render half-half details */}
                        {isCombo ? null : (isHalfHalf && item.halves && item.halves.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-blue-500/20 text-xs space-y-1.5 text-gray-500 dark:text-gray-400">
                            {item.halves.map((h: any, hIdx: number) => (
                              <div key={hIdx} className="text-xs">
                                <span className="font-semibold">• Nửa {hIdx + 1}: </span>
                                <span className="font-bold text-dark dark:text-white">{h.dish?.dish_name}</span>
                                {h.order_item_toppings && h.order_item_toppings.length > 0 && (
                                  <span className="text-gray-400 block ml-3 italic">
                                    + Topping tự chọn: {h.order_item_toppings.map((t: any) => `${t.topping?.topping_name} (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* Render regular toppings */}
                        {!isCombo && !isHalfHalf && item.toppings && item.toppings.length > 0 && (
                          <p className="text-[11px] text-gray-400 font-medium pt-1">
                            + Topping: {item.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                          </p>
                        )}
                        {isHalfHalf && item.toppings && item.toppings.length > 0 && (
                          <p className="text-[11px] text-gray-400 font-medium pt-1">
                            + Topping: {item.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                          </p>
                        )}

                        {item.order_item_note && (
                          <p className="text-xs text-red-500 font-bold mt-1 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded inline-block">
                            Ghi chú món: {item.order_item_note}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-dark dark:text-white whitespace-nowrap mt-0.5">
                      {(item.order_price || 0).toLocaleString()} đ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Price */}
          <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Tạm tính:</span>
                <span className="text-dark dark:text-white">
                  {(order.total_price_dish || 0).toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phí giao hàng:</span>
                <span className="text-green-500 font-medium">
                  {order.shipping_fee ? `${order.shipping_fee.toLocaleString()} đ` : "Chưa áp phí ship"}
                </span>
              </div>
              {(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Giảm giá:</span>
                  <span className="text-red-500">
                    -{(order.discount_amount || 0).toLocaleString()} đ
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-stroke pt-2 mt-2 dark:border-dark-3">
                <span className="font-bold text-dark dark:text-white text-base">Tổng cộng:</span>
                <span className="font-bold text-primary text-lg">
                  {(order.total_order || 0).toLocaleString()} đ
                </span>
              </div>
            </div>
          </div>

          {/* Order Note */}
          {order.order_note && (
            <div className="rounded-xl border border-red-500 bg-red-50 dark:bg-red-950/20 p-4">
              <h3 className="text-sm font-bold text-red-650 dark:text-red-400 mb-2 uppercase tracking-wide">
                Ghi chú đơn hàng
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 font-semibold italic">&quot;{order.order_note}&quot;</p>
            </div>
          )}

          {/* Cột mốc thời gian */}
          {(() => {
            const milestones = [
              { label: "Đã đặt hàng", time: order.created_at },
              { label: "Đã xác nhận", time: order.confirmed_at },
              { label: "Đang giao hàng", time: order.shipped_at },
              { label: "Đã hoàn thành", time: order.completed_at },
              { label: "Đã hủy", time: order.cancelled_at },
            ].filter(m => m.time);

            if (milestones.length === 0) return null;

            return (
              <div className="rounded-xl border border-stroke p-4 dark:border-dark-3 bg-gray-50/50 dark:bg-dark-2/50">
                <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                  Tiến trình đơn hàng (Lịch sử)
                </h3>
                <div className="flex flex-wrap gap-4 items-center">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="bg-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        {m.label}
                      </div>
                      <span className="text-xs text-gray-500 font-semibold">
                        {dayjs(m.time).format("HH:mm:ss DD/MM/YYYY")}
                      </span>
                      {idx < milestones.length - 1 && (
                        <span className="text-gray-300 dark:text-gray-600 font-bold">&rarr;</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── NÚT DUYỆT ĐƠN HÀNG ────────────────────────────────────────── */}
          <div className="border-t border-stroke pt-5 dark:border-dark-3">
            {!showConfirmForm ? (
              <div className="flex justify-end gap-3">
                {order.order_status === "pending" && (
                  <>
                    <button
                      onClick={() => setShowConfirmForm(true)}
                      className="rounded-xl bg-green-500 px-6 py-3 font-bold text-white hover:bg-green-600 transition shadow-lg active:scale-95"
                    >
                      Xác nhận đơn hàng
                    </button>
                    <button
                      onClick={async () => {
                        if (await showDanger("Bạn có chắc muốn hủy đơn hàng này không?", "Hủy đơn hàng")) {
                          await onUpdateStatus(order.order_id, "cancelled");
                        }
                      }}
                      className="rounded-xl bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600 transition shadow-lg active:scale-95"
                    >
                      Hủy đơn hàng
                    </button>
                  </>
                )}

                {(order.order_status === "confirmed" || order.order_status === "preparing") && (
                  <button
                    onClick={() => onUpdateStatus(order.order_id, "shipped")}
                    className="rounded-xl bg-blue px-6 py-3 font-bold text-white hover:bg-opacity-90 transition shadow-lg active:scale-95"
                  >
                    Giao hàng
                  </button>
                )}

                {order.order_status === "shipped" && (
                  <button
                    onClick={async () => {
                      await onUpdateStatus(order.order_id, "completed");
                      onClose();
                    }}
                    className="rounded-xl bg-green px-6 py-3 font-bold text-white hover:bg-opacity-90 transition shadow-lg active:scale-95"
                  >
                    Hoàn thành đơn hàng
                  </button>
                )}

                {order.order_status === "completed" && (
                  <p className="text-green-500 font-bold flex items-center gap-1.5">
                    <span>&#x2713;</span> Đơn hàng đã hoàn thành thành công!
                  </p>
                )}

                {order.order_status === "cancelled" && (
                  <p className="text-red-500 font-bold flex items-center gap-1.5">
                    <span>&times;</span> Đơn hàng này đã bị hủy!
                  </p>
                )}
              </div>
            ) : (
              // Popup overlay for confirm form
              createPortal(
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-2xl border border-stroke bg-white shadow-2xl dark:border-dark-3 dark:bg-gray-dark mx-4 animate-fadeIn">
                    {/* Popup Header */}
                    <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
                      <h4 className="text-base font-bold text-dark dark:text-white uppercase tracking-wide">
                        Duyệt đơn hàng #{order.order_id}
                      </h4>
                      <button
                        onClick={() => setShowConfirmForm(false)}
                        className="rounded-full border border-stroke w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:border-dark-3 dark:hover:bg-dark-2 transition"
                      >
                        &times;
                      </button>
                    </div>

                    {/* Popup Body */}
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nhập phí ship */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                            Phí giao hàng (VNĐ)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={shippingFee === 0 ? '' : shippingFee}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setShippingFee(val === '' ? 0 : parseInt(val, 10));
                            }}
                            className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>

                        {/* Nhập giảm giá */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                            Giảm giá (VNĐ)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={discountAmount === 0 ? '' : discountAmount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setDiscountAmount(val === '' ? 0 : parseInt(val, 10));
                            }}
                            className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium text-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Chọn thời gian giao */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                          Thời gian giao dự kiến
                        </label>
                        <select
                          value={deliveryDuration}
                          onChange={(e) => setDeliveryDuration(e.target.value)}
                          className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium"
                        >
                          <option value="30">30 phút (Hôm nay)</option>
                          <option value="45">45 phút (Hôm nay)</option>
                          <option value="60">60 phút (Hôm nay)</option>
                          <option value="90">90 phút (Hôm nay)</option>
                          <option value="custom">Chọn giờ cụ thể</option>
                        </select>
                      </div>

                      {deliveryDuration === "custom" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                            Chọn giờ giao hàng
                          </label>
                          <input
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium text-primary"
                          />
                        </div>
                      )}

                      {/* Sub-total review */}
                      <div className="bg-gray-50 dark:bg-dark-2 p-3 rounded-lg flex justify-between items-center text-sm border border-stroke dark:border-dark-3 font-semibold">
                        <span className="text-gray-500">Tổng thanh toán sau điều chỉnh:</span>
                        <span className="text-primary text-base font-extrabold">
                          {Math.max(0, (order.total_price_dish || 0) + shippingFee - discountAmount).toLocaleString()} đ
                        </span>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={handleConfirmOrder}
                          disabled={submitting}
                          className="rounded-lg bg-green-500 px-5 py-2.5 font-bold text-white hover:bg-green-600 transition shadow active:scale-95 disabled:opacity-50"
                        >
                          {submitting ? "Đang xử lý..." : "Xác nhận duyệt đơn"}
                        </button>
                        <button
                          onClick={() => setShowConfirmForm(false)}
                          className="rounded-lg bg-gray-200 px-5 py-2.5 font-bold text-gray-700 hover:bg-gray-300 transition dark:bg-dark-3 dark:text-gray-300 dark:hover:bg-dark-1 active:scale-95"
                        >
                          Quay lại
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )
            )}
          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [orderStats, setOrderStats] = useState({ total: 0, completed: 0, processing: 0, cancelled: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [yearCounts, setYearCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { showAlert } = useDialog();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) {
        params.date = dateFilter;
      } else if (yearFilter) {
        params.year = yearFilter;
        if (monthFilter) params.month = monthFilter;
      }
      const res = await api.get("/api/admin/orders", { params });
      setOrders(res.data.data.orders);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
      if (res.data.data.yearCounts) {
        setYearCounts(res.data.data.yearCounts);
      }
      if (res.data.data.stats) {
        setOrderStats(res.data.data.stats);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, yearFilter, monthFilter, dateFilter]);

  const updateStatus = async (orderId: number, newStatus: string, extraData?: any) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, {
        order_status: newStatus,
        ...extraData,
      });
      fetchOrders();
      // Nếu đang xem chi tiết, cập nhật lại
      if (detailOrder && detailOrder.order_id === orderId) {
        viewDetail(orderId);
      }
    } catch (err) {
      await showAlert("Lỗi khi cập nhật trạng thái");
    }
  };

  const viewDetail = async (orderId: number) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      setDetailOrder(res.data.data);
    } catch {
      await showAlert("Lỗi khi lấy chi tiết đơn hàng");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          QUẢN LÝ ĐƠN HÀNG
        </h1>
        <span className="text-sm text-gray-500">Tổng cộng: {total} đơn hàng</span>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng đơn hàng</p>
          <p className="mt-2 text-2xl font-black text-dark dark:text-white">{(orderStats.total || total).toLocaleString("vi-VN")} đơn</p>
          <p className="mt-1 text-xs text-gray-400">Toàn bộ đơn hàng ghi nhận trên hệ thống</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã hoàn thành</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{orderStats.completed.toLocaleString("vi-VN")} đơn</p>
          <p className="mt-1 text-xs text-gray-400">Đơn hàng giao thành công & thanh toán xong</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Đang xử lý / Giao</p>
          <p className="mt-2 text-2xl font-black text-primary">{orderStats.processing.toLocaleString("vi-VN")} đơn</p>
          <p className="mt-1 text-xs text-gray-400">Đơn đang chờ duyệt, chuẩn bị hoặc giao hàng</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Đã hủy</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{orderStats.cancelled.toLocaleString("vi-VN")} đơn</p>
          <p className="mt-1 text-xs text-gray-400">Đơn hàng bị hủy bởi khách hoặc cửa hàng</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setStatusFilter(""); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${!statusFilter ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-2 dark:text-gray-300"}`}
          >
            Tất cả
          </button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${statusFilter === key ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-2 dark:text-gray-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Year / Month / Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              if (!e.target.value) setMonthFilter("");
              setDateFilter("");
              setPage(1);
            }}
            className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white focus:border-primary"
          >
            <option value="">Tất cả năm (2023 – 2026)</option>
            {[2026, 2025, 2024, 2023].map((yr) => (
              <option key={yr} value={String(yr)}>
                Năm {yr}{yearCounts[yr] ? ` (${yearCounts[yr].toLocaleString("vi-VN")} đơn)` : ""}
              </option>
            ))}
          </select>

          {yearFilter && (
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setDateFilter("");
                setPage(1);
              }}
              className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white focus:border-primary"
            >
              <option value="">Cả năm {yearFilter}</option>
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                <option key={m} value={String(m)}>
                  Tháng {m}/{yearFilter}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              if (e.target.value) {
                setYearFilter("");
                setMonthFilter("");
              }
              setPage(1);
            }}
            className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white focus:border-primary"
          />
          {(dateFilter || yearFilter || monthFilter) && (
            <button
              onClick={() => {
                setDateFilter("");
                setYearFilter("");
                setMonthFilter("");
                setPage(1);
              }}
              className="rounded-lg border border-stroke bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:border-dark-3 dark:bg-dark-2 dark:text-gray-300 transition"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-primary text-white">
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="rounded-tl-lg px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Mã đơn hàng
                </th>
                <th className="px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Khách hàng
                </th>
                <th className="px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Loại đơn
                </th>
                <th className="px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Tổng tiền
                </th>
                <th className="px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Hình thức thanh toán
                </th>
                <th className="px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Ngày đặt
                </th>
                <th className="rounded-tr-lg px-3 py-3 xl:px-4 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                  Ngày nhận
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    Không tìm thấy đơn hàng
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b border-stroke last:border-0 dark:border-dark-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-2 transition"
                    onClick={() => viewDetail(order.order_id)}
                  >
                    <td className="px-3 py-3 xl:px-4 font-semibold text-dark dark:text-white whitespace-nowrap">
                      #{order.order_id}
                    </td>
                    <td className="px-3 py-3 xl:px-4">
                      <div className="text-sm text-dark dark:text-white">
                        {order.customer_name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.customer_phone || ""}
                      </div>
                    </td>
                    <td className="px-3 py-3 xl:px-4 text-xs sm:text-sm whitespace-nowrap">
                      {ORDER_TYPE_LABELS[order.order_type] || order.order_type || "delivery"}
                    </td>
                    <td className="px-3 py-3 xl:px-4 font-medium text-dark dark:text-white whitespace-nowrap">
                      {(order.total_order || 0).toLocaleString()} đ
                    </td>
                    <td className="px-3 py-3 xl:px-4 text-xs sm:text-sm whitespace-nowrap">
                      {PAYMENT_LABELS[order.payment_method] || order.payment_method || "N/A"}
                    </td>
                    <td className="px-3 py-3 xl:px-4">
                      {renderStatusBadge(order.order_status)}
                    </td>
                    <td className="px-3 py-3 xl:px-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {order.created_at ? dayjs(order.created_at).format("DD/MM/YYYY HH:mm") : "N/A"}
                    </td>
                    <td className="px-3 py-3 xl:px-4 text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
                      {order.pickup_time
                        ? dayjs(order.pickup_time).format("DD/MM/YYYY HH:mm")
                        : order.estimated_delivery_time
                          ? dayjs(order.estimated_delivery_time).format("DD/MM/YYYY HH:mm")
                          : "Chưa xác định"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stroke px-6 py-4 dark:border-dark-3">
            <span className="text-sm text-gray-500">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-dark-3"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-dark-3"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}
