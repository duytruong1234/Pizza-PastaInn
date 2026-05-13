// Trang quản lý đơn hàng — với modal chi tiết đơn hàng
"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
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
  items?: any[];
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
function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
                    {order.user?.username || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SĐT:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.user?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium text-dark dark:text-white">
                    {order.user?.email || "N/A"}
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
              </div>
            </div>
          </div>

          {/* Chi tiết món */}
          <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
              Chi tiết món ({order.items?.length || 0} món)
            </h3>
            <div className="space-y-2">
              {(order.items || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-dark-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
                      x{item.quantity}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-dark dark:text-white">
                        {item.dish_price_id || (item.combo_id ? `Combo #${item.combo_id}` : "Món")}
                      </p>
                      {item.order_item_note && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ghi chú: {item.order_item_note}
                        </p>
                      )}
                      {item.is_half_half && (
                        <p className="text-xs text-blue-400 mt-0.5">🍕 Half-Half</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-dark dark:text-white">
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
        </div>
      </div>
    </div>
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

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, {
        order_status: newStatus,
      });
      fetchOrders();
      // Nếu đang xem chi tiết, cập nhật lại
      if (detailOrder && detailOrder.order_id === orderId) {
        setDetailOrder({ ...detailOrder, order_status: newStatus });
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
                <th className="rounded-tl-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Mã đơn
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Khách hàng
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Loại
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Tổng tiền
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Thanh toán
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Ngày tạo
                </th>
                <th className="rounded-tr-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide">
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
                    <td className="px-6 py-4 font-medium text-dark dark:text-white">
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
        />
      )}
    </div>
  );
}
