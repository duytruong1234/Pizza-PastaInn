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

    api.get("/api/admin/orders", { params })
      .then((res) => {
        setOrders(res.data.data.orders || []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-dark-3 dark:bg-gray-dark mx-4">
        <div className="flex items-center justify-between border-b border-stroke pb-4 mb-4 dark:border-dark-3">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            Orders Placed — {customer.username} {customer.user_id ? "" : "(Guest)"}
          </h2>
          <button onClick={onClose} className="rounded-lg border border-stroke p-2 text-gray-500 hover:bg-gray-100 dark:border-dark-3 dark:hover:bg-dark-2">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center py-12 text-gray-400">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 dark:bg-dark-2">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Order Code</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Order Date</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Total Price</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Order Type</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                    <td className="px-4 py-3 font-semibold">#{order.order_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {dayjs(order.created_at).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="px-4 py-3 font-medium text-dark dark:text-white">
                      {order.total_order?.toLocaleString()} đ
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {order.order_type === "delivery" ? "Delivery" : "Pickup"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium 
                        ${order.order_status === "completed" ? "bg-green-100 text-green-700" : 
                          order.order_status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {order.order_status === "completed" ? "Completed" : 
                         order.order_status === "cancelled" ? "Cancelled" : "Processing"}
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    api.get("/api/admin/customers", { params: { page, limit: 20 } })
      .then((res) => {
        setCustomers(res.data.data.customers);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">CUSTOMERS MANAGEMENT</h1>
        <span className="text-sm text-gray-500">Total: {total} customers</span>
      </div>

      <div className="rounded-2xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary text-white">
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="rounded-tl-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide">ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Name</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Email</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Phone</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Customer Type</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Orders</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Created At</th>
                <th className="rounded-tr-lg px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </td></tr>
              ) : customers.map((c) => (
                <tr key={c.user_id || `guest-${c.phone}`} className="border-b border-stroke last:border-0 dark:border-dark-3">
                  <td className="px-6 py-4 text-dark dark:text-white">{c.user_id || <span className="text-gray-400 italic">—</span>}</td>
                  <td className="px-6 py-4 font-medium text-dark dark:text-white">{c.username || "N/A"}</td>
                  <td className="px-6 py-4 text-sm">{c.email || <span className="text-gray-400 italic">—</span>}</td>
                  <td className="px-6 py-4 text-sm">{c.phone || <span className="text-gray-400 italic">—</span>}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.user_id ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {c.user_id ? "Registered" : "Guest"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{c._count.orders}</td>
                  <td className="px-6 py-4">
                    <Badge variant={c.user_id ? (c.user_status ? "outlineSuccess" : "outlineDanger") : "outlineSuccess"}>
                      {c.user_id ? (c.user_status ? "Active" : "Locked") : "Active"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.created_at ? dayjs(c.created_at).format("DD/MM/YYYY") : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setActiveCustomer(c)}
                      className="rounded bg-indigo-500 hover:bg-indigo-600 transition text-white px-3 py-1.5 text-xs font-semibold shadow-sm"
                    >
                      View Orders
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stroke px-6 py-4 dark:border-dark-3">
            <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-dark-3">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-dark-3">Next</button>
            </div>
          </div>
        )}
      </div>

      <CustomerOrdersModal customer={activeCustomer} onClose={() => setActiveCustomer(null)} />
    </div>
  );
}
