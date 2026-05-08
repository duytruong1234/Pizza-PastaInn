// Trang quản lý topping
"use client";
import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

interface Topping {
  topping_id: number; topping_name: string; price_topping: number;
  is_for_pizza: boolean; is_for_spaghetti: boolean;
  sizes?: { size_name: string };
}

export default function ToppingsPage() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);

  const [columnFilters, setColumnFilters] = useState({ id: "", name: "", price: "", size: "", pizza: "", spaghetti: "" });
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.get("/api/admin/toppings").then(r => setToppings(r.data.data)).catch(() => setToppings([])).finally(() => setLoading(false));
  }, []);

  const filteredToppings = useMemo(() => {
    let result = [...toppings];
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter(x => x.topping_name.toLowerCase().includes(s));
    }
    if (columnFilters.id) result = result.filter(x => x.topping_id.toString().includes(columnFilters.id));
    if (columnFilters.name) result = result.filter(x => x.topping_name.toLowerCase().includes(columnFilters.name.toLowerCase()));
    if (columnFilters.price) result = result.filter(x => (x.price_topping || 0).toString().includes(columnFilters.price));
    if (columnFilters.size) result = result.filter(x => (x.sizes?.size_name || 'Tất cả').toLowerCase().includes(columnFilters.size.toLowerCase()));
    if (columnFilters.pizza) result = result.filter(x => (x.is_for_pizza ? 'có' : 'không').includes(columnFilters.pizza.toLowerCase()));
    if (columnFilters.spaghetti) result = result.filter(x => (x.is_for_spaghetti ? 'có' : 'không').includes(columnFilters.spaghetti.toLowerCase()));
    return result;
  }, [toppings, columnFilters, globalSearch]);

  const totalPages = Math.ceil(filteredToppings.length / perPage) || 1;
  const paginatedData = filteredToppings.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Quản lý topping</h1>
      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input type="text" placeholder="Search here..." value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }} className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 outline-none focus:border-primary dark:border-dark-3" />
            <button className="flex items-center justify-center rounded-r-lg bg-indigo-500 px-4 py-3 text-white transition hover:bg-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark dark:text-white">Per Page:</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} className="rounded-lg border border-stroke bg-transparent py-2 pl-3 pr-8 outline-none focus:border-primary dark:border-dark-3">
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">ID</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Tên topping</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Giá</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Size</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Pizza</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Spaghetti</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : paginatedData.map(t => (
                <tr key={t.topping_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                  <td className="px-6 py-4 text-dark dark:text-white">{t.topping_id}</td>
                  <td className="px-6 py-4 font-medium text-dark dark:text-white">{t.topping_name}</td>
                  <td className="px-6 py-4">{(t.price_topping || 0).toLocaleString()}đ</td>
                  <td className="px-6 py-4 text-sm">{t.sizes?.size_name || 'Tất cả'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={t.is_for_pizza ? "success" : "light"}>
                      {t.is_for_pizza ? "Có" : "Không"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={t.is_for_spaghetti ? "success" : "light"}>
                      {t.is_for_spaghetti ? "Có" : "Không"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            <div className="text-sm text-gray-500">
              Showing {currentPage} of {totalPages} pages
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
