// Trang quản lý khách hàng
"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";

interface Customer {
  user_id: number;
  username: string;
  email: string;
  phone: string;
  user_status: boolean;
  created_at: string;
  role: string;
  _count: { orders: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-2xl font-bold text-dark dark:text-white">QUẢN LÝ KHÁCH HÀNG</h1>
        <span className="text-sm text-gray-500">Tổng: {total} khách</span>
      </div>

      <div className="rounded-2xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary text-white">
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="rounded-tl-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide">ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Tên</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Email</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Điện thoại</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Số đơn</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Trạng thái</th>
                <th className="rounded-tr-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </td></tr>
              ) : customers.map((c) => (
                <tr key={c.user_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                  <td className="px-6 py-4 text-dark dark:text-white">{c.user_id}</td>
                  <td className="px-6 py-4 font-medium text-dark dark:text-white">{c.username || "N/A"}</td>
                  <td className="px-6 py-4 text-sm">{c.email}</td>
                  <td className="px-6 py-4 text-sm">{c.phone || "N/A"}</td>
                  <td className="px-6 py-4 text-sm font-medium">{c._count.orders}</td>
                  <td className="px-6 py-4">
                    <Badge variant={c.user_status ? "outlineSuccess" : "outlineDanger"}>
                      {c.user_status ? "Hoạt động" : "Bị khóa"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.created_at ? dayjs(c.created_at).format("DD/MM/YYYY") : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stroke px-6 py-4 dark:border-dark-3">
            <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-dark-3">Trước</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 dark:border-dark-3">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
