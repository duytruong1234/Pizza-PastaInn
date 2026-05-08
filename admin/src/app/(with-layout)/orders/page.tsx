// Trang quản lý đơn hàng
"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

interface Order {
  order_id: number;
  user?: { username: string; email: string; phone: string };
  order_status: string;
  payment_method: string;
  total_order: number;
  created_at: string;
  order_type: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipped: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          Quản lý đơn hàng
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
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Mã đơn
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Khách hàng
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Loại
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tổng tiền
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Thanh toán
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
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
                    className="border-b border-stroke last:border-0 dark:border-dark-3"
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
                    <td className="px-6 py-4 text-sm capitalize">
                      {order.order_type || "delivery"}
                    </td>
                    <td className="px-6 py-4 font-medium text-dark dark:text-white">
                      {(order.total_order || 0).toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">
                      {order.payment_method || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.order_status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[order.order_status] || order.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.created_at ? dayjs(order.created_at).format("DD/MM/YYYY HH:mm") : "N/A"}
                    </td>
                    <td className="px-6 py-4">
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
    </div>
  );
}
