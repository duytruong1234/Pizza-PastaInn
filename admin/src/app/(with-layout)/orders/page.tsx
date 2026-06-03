// Trang quản lý đơn hàng — với modal chi tiết đơn hàng
"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";

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
  store?: { store_id: number; store_name: string; address: string };
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
  preparing: "Đang chuẩn bị",
  shipped: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Tiền mặt (COD)",
  vietqr: "Chuyển khoản VietQR",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  delivery: "Giao tận nơi",
  pickup: "Đến lấy tại quán",
};

// ── Modal chi tiết đơn hàng ──────────────────────────────────────────────────
// ── Helper: Hiển thị chi tiết từng món ăn (Regular, Combo, Half-Half) ──────────
function renderOrderItemDetails(item: any) {
  // 1. Combo
  if (item.combo_id) {
    return (
      <div className="text-xs space-y-1.5 mt-1 border-l-2 border-primary/20 pl-3">
        <p className="font-extrabold text-[#d4a017] text-[13px] uppercase">
          COMBO: {item.combo?.combo_name || `Combo #${item.combo_id}`}
        </p>
        {item.combos && item.combos.length > 0 && (
          <div className="space-y-2 mt-1">
            {item.combos.map((sel: any, idx: number) => {
              const dishName = sel.dish_price?.dish?.dish_name || sel.dish_price_id || "Món trong combo";
              const sizeName = sel.dish_price?.size?.size_name;
              const crustName = sel.dish_price?.crust?.crust_name;
              const isPizza = dishName.toLowerCase().includes("pizza");
              const qtyPrefix = sel.quantity && sel.quantity > 1 ? `${sel.quantity} x ` : "";

              return (
                <div key={idx} className="bg-gray-100/50 dark:bg-dark-3/50 p-2 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-bold text-dark dark:text-white">
                    {idx + 1}. {qtyPrefix}{dishName}
                  </p>
                  <div className="ml-3 text-xs text-gray-500 space-y-0.5 mt-0.5">
                    {(sizeName || crustName) && isPizza && (
                      <p>
                        {sizeName && <span>Size: <strong>{sizeName}</strong> </span>}
                        {crustName && <span>Đế: <strong>{crustName}</strong></span>}
                      </p>
                    )}
                    {sel.toppings && sel.toppings.length > 0 && (
                      <p className="text-gray-600 dark:text-gray-400">
                        + Toppings: {sel.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                      </p>
                    )}
                    {sel.is_half_half && sel.halves && sel.halves.length > 0 && (
                      <div className="mt-1 border-l border-blue-300 pl-2 text-xs">
                        <p className="text-blue-500 font-semibold">Nửa-Nửa (Half-Half):</p>
                        {sel.halves.map((h: any, hIdx: number) => (
                          <div key={hIdx} className="ml-1 text-[11px]">
                            <span>• Nửa {hIdx + 1}: <strong>{h.dish?.dish_name}</strong></span>
                            {h.order_item_toppings && h.order_item_toppings.length > 0 && (
                              <span className="text-gray-500 block ml-2">
                                + Toppings: {h.order_item_toppings.map((t: any) => `${t.topping?.topping_name} (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
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
      </div>
    );
  }

  // 2. Half-Half (ngoài combo)
  if (item.is_half_half) {
    const sizeName = item.dish_price?.size?.size_name;
    const crustName = item.dish_price?.crust?.crust_name;

    return (
      <div className="text-xs space-y-1.5 mt-1 border-l-2 border-blue-500/20 pl-3">
        <p className="font-bold text-blue-500 text-[13px] uppercase">
          Bánh Nửa-Nửa (Half-Half)
        </p>
        {(sizeName || crustName) && (
          <p className="text-gray-500">
            {sizeName && <span>Size: <strong>{sizeName}</strong> </span>}
            {crustName && <span>Đế: <strong>{crustName}</strong></span>}
          </p>
        )}
        {item.halves && item.halves.length > 0 && (
          <div className="space-y-1.5 mt-1 pl-2">
            {item.halves.map((h: any, idx: number) => (
              <div key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-semibold">• Nửa {idx + 1}: </span>
                <span className="font-bold text-dark dark:text-white">{h.dish?.dish_name}</span>
                {h.order_item_toppings && h.order_item_toppings.length > 0 && (
                  <span className="text-gray-500 block ml-3 italic">
                    + Toppings riêng: {h.order_item_toppings.map((t: any) => `${t.topping?.topping_name} (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {item.toppings && item.toppings.length > 0 && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 pl-2">
            + Toppings chung: {item.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
          </p>
        )}
      </div>
    );
  }

  // 3. Món thường (regular)
  const dishName = item.dish_price?.dish?.dish_name || item.dish_price_id || "Món ăn";
  const sizeName = item.dish_price?.size?.size_name;
  const crustName = item.dish_price?.crust?.crust_name;
  const isPizza = dishName.toLowerCase().includes("pizza");

  return (
    <div className="text-xs space-y-1 mt-0.5">
      <p className="font-bold text-sm text-dark dark:text-white">{dishName}</p>
      {(sizeName || crustName) && isPizza && (
        <p className="text-gray-500">
          {sizeName && <span>Size: <strong>{sizeName}</strong> </span>}
          {crustName && <span>Đế: <strong>{crustName}</strong></span>}
        </p>
      )}
      {item.toppings && item.toppings.length > 0 && (
        <p className="text-gray-600 dark:text-gray-400">
          + Toppings: {item.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
        </p>
      )}
    </div>
  );
}

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
      alert("Lỗi khi duyệt đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-dark mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div>
            <h2 className="text-lg font-bold text-dark dark:text-white">
              CHI TIẾT ĐƠN HÀNG #{order.order_id}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {order.created_at ? dayjs(order.created_at).format("DD/MM/YYYY HH:mm:ss") : "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-stroke p-2 text-gray-500 hover:bg-gray-100 dark:border-dark-3 dark:hover:bg-dark-2"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Thông tin khách hàng */}
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tên:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.customer_name || order.user?.username || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SĐT:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.customer_phone || order.user?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.customer_email || order.user?.email || "N/A"}
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

            {/* Thông tin đơn hàng */}
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                Thông tin đơn hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái:</span>
                  <Badge variant={STATUS_COLORS[order.order_status] || "warning"}>
                    {STATUS_LABELS[order.order_status] || order.order_status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hình thức:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {ORDER_TYPE_LABELS[order.order_type] || order.order_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Thanh toán:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TT thanh toán:</span>
                  <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                    {order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </Badge>
                </div>
                {order.estimated_delivery_time && (
                  <div className="flex justify-between border-t border-stroke pt-1.5 mt-1.5 dark:border-dark-3 font-semibold">
                    <span className="text-gray-400">Giao dự kiến:</span>
                    <span className="font-extrabold text-[#d4a017]">
                      {dayjs(order.estimated_delivery_time).format("HH:mm - DD/MM/YYYY")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin giao hàng / Cửa hàng xử lý */}
          {(order.store || order.shipping_distance_meters || order.customer_latitude) && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide flex items-center gap-2">
                <span>📍</span> Thông tin giao hàng
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
                    <span className="text-gray-400">Tọa độ khách:</span>
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
              Chi tiết món ({order.items?.length || 0} món)
            </h3>
            <div className="space-y-2">
              {(order.items || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-lg bg-gray-50 p-3 dark:bg-dark-2 gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white flex-shrink-0 mt-0.5">
                      x{item.quantity}
                    </span>
                    <div className="flex-1 min-w-0">
                      {renderOrderItemDetails(item)}
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
              ))}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Tạm tính:</span>
                <span className="text-dark dark:text-white">
                  {(order.total_price_dish || 0).toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phí vận chuyển:</span>
                <span className="text-green-500 font-medium">
                  {order.shipping_fee ? `${order.shipping_fee.toLocaleString()} đ` : "Miễn phí"}
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

          {/* Ghi chú đơn hàng */}
          {order.order_note && (
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-2 uppercase tracking-wide">
                Ghi chú đơn hàng
              </h3>
              <p className="text-sm text-gray-500 italic">&quot;{order.order_note}&quot;</p>
            </div>
          )}

          {/* Cột mốc thời gian */}
          {(() => {
            const milestones = [
              { label: "Khách đặt", time: order.created_at },
              { label: "Xác nhận", time: order.confirmed_at },
              { label: "Chuẩn bị", time: order.preparing_at },
              { label: "Bắt đầu giao", time: order.shipped_at },
              { label: "Hoàn thành", time: order.completed_at },
              { label: "Đã hủy", time: order.cancelled_at },
            ].filter(m => m.time);

            if (milestones.length === 0) return null;

            return (
              <div className="rounded-xl border border-stroke p-4 dark:border-dark-3 bg-gray-50/50 dark:bg-dark-2/50">
                <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                  Tiến trình đơn hàng (Cột mốc thời gian)
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
                        <span className="text-gray-300 dark:text-gray-600 font-bold">➔</span>
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
                      Xác nhận đặt hàng
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
                          await onUpdateStatus(order.order_id, "cancelled");
                        }
                      }}
                      className="rounded-xl bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600 transition shadow-lg active:scale-95"
                    >
                      Hủy đơn
                    </button>
                  </>
                )}

                {order.order_status === "confirmed" && (
                  <button
                    onClick={() => onUpdateStatus(order.order_id, "preparing")}
                    className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-opacity-90 transition shadow-lg active:scale-95"
                  >
                    Bắt đầu chuẩn bị món
                  </button>
                )}

                {order.order_status === "preparing" && (
                  <button
                    onClick={() => onUpdateStatus(order.order_id, "shipped")}
                    className="rounded-xl bg-blue px-6 py-3 font-bold text-white hover:bg-opacity-90 transition shadow-lg active:scale-95"
                  >
                    Giao hàng cho shipper
                  </button>
                )}

                {order.order_status === "shipped" && (
                  <button
                    onClick={() => onUpdateStatus(order.order_id, "completed")}
                    className="rounded-xl bg-green px-6 py-3 font-bold text-white hover:bg-opacity-90 transition shadow-lg active:scale-95"
                  >
                    Hoàn thành đơn hàng
                  </button>
                )}

                {order.order_status === "completed" && (
                  <p className="text-green-500 font-bold flex items-center gap-1.5">
                    <span>✓</span> Đơn hàng đã hoàn thành tốt đẹp!
                  </p>
                )}

                {order.order_status === "cancelled" && (
                  <p className="text-red-500 font-bold flex items-center gap-1.5">
                    <span>✕</span> Đơn hàng này đã bị hủy!
                  </p>
                )}
              </div>
            ) : (
              // Form nhập Giảm giá, Phí ship, Thời gian giao khi Xác nhận
              <div className="rounded-xl border border-stroke bg-gray-50 p-5 dark:border-dark-3 dark:bg-dark-2 space-y-4 animate-fadeIn">
                <h4 className="text-base font-bold text-dark dark:text-white uppercase tracking-wide">
                  Chi tiết duyệt đơn #{order.order_id}
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  {/* Nhập phí ship */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                      Phí Ship (đ)
                    </label>
                    <input
                      type="number"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium"
                      placeholder="0"
                    />
                  </div>

                  {/* Nhập giảm giá */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                      Giảm giá (đ)
                    </label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium text-red-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Chọn thời gian giao */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                      Thời gian giao dự kiến
                    </label>
                    <select
                      value={deliveryDuration}
                      onChange={(e) => setDeliveryDuration(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium"
                    >
                      <option value="30">30 phút (Hôm nay)</option>
                      <option value="45">45 phút (Hôm nay)</option>
                      <option value="60">60 phút (Hôm nay)</option>
                      <option value="90">90 phút (Hôm nay)</option>
                      <option value="custom">Chọn giờ cụ thể</option>
                    </select>
                  </div>
                </div>

                {deliveryDuration === "custom" && (
                  <div className="w-1/3 ml-auto">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                      Chọn Giờ Giao
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm dark:border-dark-3 dark:bg-gray-dark font-medium text-primary"
                    />
                  </div>
                )}

                {/* Sub-total review */}
                <div className="bg-white dark:bg-gray-dark p-3 rounded-lg flex justify-between items-center text-sm border border-stroke dark:border-dark-3 font-semibold">
                  <span className="text-gray-500">Thành tiền sau điều chỉnh:</span>
                  <span className="text-primary text-base font-extrabold">
                    {Math.max(0, (order.total_price_dish || 0) + shippingFee - discountAmount).toLocaleString()} đ
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleConfirmOrder}
                    disabled={submitting}
                    className="rounded-lg bg-green-500 px-5 py-2 font-bold text-white hover:bg-green-600 transition shadow active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? "Đang xử lý..." : "✓ Xác nhận duyệt"}
                  </button>
                  <button
                    onClick={() => setShowConfirmForm(false)}
                    className="rounded-lg bg-gray-200 px-5 py-2 font-bold text-gray-700 hover:bg-gray-300 transition dark:bg-dark-3 dark:text-gray-300 dark:hover:bg-dark-1 active:scale-95"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            )}
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/api/admin/orders", { params });
      setOrders(res.data.data.orders);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

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
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const viewDetail = async (orderId: number) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/admin/orders/${orderId}`);
      setDetailOrder(res.data.data);
    } catch {
      alert("Lỗi khi lấy chi tiết đơn hàng");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          QUẢN LÝ ĐƠN HÀNG
        </h1>
        <span className="text-sm text-gray-500">Tổng: {total} đơn</span>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
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

      {/* Table */}
      <div className="rounded-2xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary text-white">
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="rounded-tl-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Mã đơn
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Khách hàng
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Hình thức
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Tổng tiền
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Loại thanh toán
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Ngày đặt hàng
                </th>
                <th className="rounded-tr-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                  Thao tác
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
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b border-stroke last:border-0 dark:border-dark-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-2 transition"
                    onClick={() => viewDetail(order.order_id)}
                  >
                    <td className="px-6 py-4 font-medium text-dark dark:text-white">
                      #{order.order_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-dark dark:text-white">
                        {order.user?.username || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.user?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {ORDER_TYPE_LABELS[order.order_type] || order.order_type || "delivery"}
                    </td>
                    <td className="px-6 py-4 font-medium text-dark dark:text-white whitespace-nowrap">
                      {(order.total_order || 0).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {PAYMENT_LABELS[order.payment_method] || order.payment_method || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_COLORS[order.order_status] || "warning"}>
                        {STATUS_LABELS[order.order_status] || order.order_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.created_at ? dayjs(order.created_at).format("DD/MM/YYYY HH:mm") : "N/A"}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.order_status}
                        onChange={(e) => updateStatus(order.order_id, e.target.value)}
                        className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm dark:border-dark-3 dark:bg-dark-2"
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
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
