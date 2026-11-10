// Customer management page
"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";

interface Customer {
  user_id: number | string | null;
  username: string;
  email: string;
  phone: string;
  user_status: boolean;
  created_at: string;
  role: string;
  _count: { orders: number };
}

interface CustomerOrdersModalProps {
  customer: Customer | null;
  onClose: () => void;
}

function CustomerOrdersModal({ customer, onClose }: CustomerOrdersModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    const params: Record<string, string | number> = {};
    if (customer.user_id !== null) {
      params.userId = String(customer.user_id);
    } else {
      params.phone = customer.phone;
    }

    api
      .get("/api/admin/orders", { params })
      .then((res) => {
        setOrders(res.data.data.orders || []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-stroke bg-white p-4 sm:p-6 shadow-xl dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between border-b border-stroke pb-3.5 dark:border-dark-3">
          <div className="min-w-0 pr-3">
            <h2 className="truncate text-base sm:text-lg font-bold text-dark dark:text-white">
              Đơn hàng đã đặt — {customer.username || customer.phone || "Khách hàng"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stroke text-gray-500 transition hover:bg-gray-100 dark:border-dark-3 dark:hover:bg-dark-2 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">Không tìm thấy đơn hàng nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-100 dark:bg-dark-2">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase">Mã đơn</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase">Ngày đặt</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase">Tổng tiền</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase">Loại đơn</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-dark dark:text-white">
                      #{order.order_id}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500">
                      {dayjs(order.created_at).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-dark dark:text-white">
                      {order.total_order?.toLocaleString()} đ
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                      {order.order_type === "delivery" ? "Giao hàng" : "Nhận tại quán"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.order_status === "completed"
                            ? "bg-green-100 text-green-700"
                            : order.order_status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.order_status === "completed"
                          ? "Đã hoàn thành"
                          : order.order_status === "cancelled"
                            ? "Đã hủy"
                            : "Đang xử lý"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [customerStats, setCustomerStats] = useState({ total: 0, registered: 0, guests: 0, locked: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    api
      .get("/api/admin/customers", { params: { page, limit: 20 } })
      .then((res) => {
        setCustomers(res.data.data.customers);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
        if (res.data.data.stats) {
          setCustomerStats(res.data.data.stats);
        }
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">QUẢN LÝ KHÁCH HÀNG</h1>
        <span className="text-xs sm:text-sm text-gray-500">Tổng cộng: {total} khách hàng</span>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng khách hàng</p>
          <p className="mt-2 text-2xl font-black text-dark dark:text-white">
            {(customerStats.total || total).toLocaleString("vi-VN")} khách
          </p>
          <p className="mt-1 text-xs text-gray-400">Toàn bộ hồ sơ khách hàng trên hệ thống</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Thành viên đăng ký</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {(customerStats.registered || customers.filter((c) => c.role !== "GUEST").length).toLocaleString("vi-VN")} tài khoản
          </p>
          <p className="mt-1 text-xs text-gray-400">Khách hàng có tài khoản tích điểm & ưu đãi</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Khách vãng lai</p>
          <p className="mt-2 text-2xl font-black text-primary">
            {(customerStats.guests || customers.filter((c) => c.role === "GUEST").length).toLocaleString("vi-VN")} khách
          </p>
          <p className="mt-1 text-xs text-gray-400">Đặt hàng nhanh không cần đăng nhập</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Tài khoản tạm khóa</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {(customerStats.locked || customers.filter((c) => !c.user_status).length).toLocaleString("vi-VN")} tài khoản
          </p>
          <p className="mt-1 text-xs text-gray-400">Tài khoản đang bị giới hạn quyền truy cập</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-primary text-white">
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-[11px] font-semibold uppercase tracking-wide">
                  ID
                </th>
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-[11px] font-semibold uppercase tracking-wide">
                  Tên
                </th>
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-[11px] font-semibold uppercase tracking-wide">
                  Email
                </th>
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-[11px] font-semibold uppercase tracking-wide">
                  SĐT
                </th>
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-[11px] font-semibold uppercase tracking-wide">
                  Loại KH
                </th>
                <th className="whitespace-nowrap px-2 py-3 xl:px-3 text-center text-[11px] font-semibold uppercase tracking-wide">
                  Đơn
                </th>
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-[11px] font-semibold uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-[11px] font-semibold uppercase tracking-wide">
                  Ngày tham gia
                </th>
                <th className="whitespace-nowrap px-2.5 py-3 xl:px-3.5 text-center text-[11px] font-semibold uppercase tracking-wide">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.user_id || `guest-${c.phone}`}
                    className="border-b border-stroke last:border-0 hover:bg-gray-50/60 dark:border-dark-3 dark:hover:bg-dark-2/40 transition-colors"
                  >
                    <td className="whitespace-nowrap px-2.5 py-2.5 xl:px-3.5 text-dark dark:text-white">
                      {c.user_id || (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-400 dark:bg-dark-2">
                          Chưa có
                        </span>
                      )}
                    </td>
                    <td
                      className="max-w-[140px] xl:max-w-[190px] truncate px-2.5 py-2.5 xl:px-3.5 font-medium text-dark dark:text-white"
                      title={c.username || "N/A"}
                    >
                      {c.username || "N/A"}
                    </td>
                    <td
                      className="max-w-[165px] xl:max-w-[230px] truncate px-2.5 py-2.5 xl:px-3.5"
                      title={c.email || ""}
                    >
                      {c.email || (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-400 dark:bg-dark-2">
                          Chưa cập nhật
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 xl:px-3.5">
                      {c.phone || (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-400 dark:bg-dark-2">
                          Chưa cập nhật
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 xl:px-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          c.user_id ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {c.user_id ? "Đã đăng ký" : "Khách vãng lai"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 xl:px-3 text-center font-semibold text-dark dark:text-white">
                      {c._count.orders}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 xl:px-3.5">
                      <Badge
                        variant={
                          c.user_id
                            ? c.user_status
                              ? "outlineSuccess"
                              : "outlineDanger"
                            : "outlineSuccess"
                        }
                      >
                        {c.user_id
                          ? c.user_status
                            ? "Đang hoạt động"
                            : "Đang khóa"
                          : "Đang hoạt động"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 xl:px-3.5 text-gray-500">
                      {c.created_at ? dayjs(c.created_at).format("DD/MM/YYYY") : "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 xl:px-3.5 text-center">
                      <button
                        onClick={() => setActiveCustomer(c)}
                        className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-600 cursor-pointer"
                      >
                        Xem đơn hàng
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stroke px-4 py-3.5 sm:px-6 dark:border-dark-3">
            <span className="text-xs sm:text-sm text-gray-500">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border px-3.5 py-1.5 text-xs sm:text-sm disabled:opacity-50 dark:border-dark-3"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border px-3.5 py-1.5 text-xs sm:text-sm disabled:opacity-50 dark:border-dark-3"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <CustomerOrdersModal customer={activeCustomer} onClose={() => setActiveCustomer(null)} />
    </div>
  );
}
