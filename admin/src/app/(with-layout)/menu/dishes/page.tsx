// Trang quản lý món ăn
"use client";

import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui-elements/button";

interface Dish {
  dish_id: number;
  dish_name: string;
  image: string | null;
  ingredient: string | null;
  dish_status: boolean;
  category?: { category_name: string };
  prices: Array<{
    dish_price_id: string;
    dish_price: number;
    size?: { size_name: string };
    crust?: { crust_name: string };
  }>;
}

interface FlattenedDish {
  dish_price_id: string;
  dish_name: string;
  image: string | null;
  category_name: string;
  size_name: string;
  crust_name: string;
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState({
    dish_price_id: "",
    dish_name: "",
    category_name: "",
    size_name: "",
    crust_name: "",
  });
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewDish, setViewDish] = useState<FlattenedDish | null>(null);
  const [editDish, setEditDish] = useState<FlattenedDish | null>(null);

  useEffect(() => {
    api.get("/api/admin/dishes")
      .then((res) => setDishes(res.data.data))
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, []);

  const handleView = (dish: FlattenedDish) => {
    setViewDish(dish);
  };

  const handleEdit = (dish: FlattenedDish) => {
    setEditDish(dish);
  };

  const handleDelete = async (dish_price_id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bản ghi này không?")) {
      try {
        // Example logic to update UI state immediately
        setDishes(prev => prev.map(d => ({
          ...d,
          prices: d.prices ? d.prices.filter(p => p.dish_price_id.toString() !== dish_price_id) : []
        })));
        alert("Đã xóa thành công!");
      } catch (err) {
        alert("Có lỗi xảy ra khi xóa!");
      }
    }
  };

  const flattenedDishes = useMemo(() => {
    const list: FlattenedDish[] = [];
    dishes.forEach((dish) => {
      if (!dish.prices || dish.prices.length === 0) {
        list.push({
          dish_price_id: `dish-${dish.dish_id}`,
          dish_name: dish.dish_name,
          image: dish.image,
          category_name: dish.category?.category_name || "N/A",
          size_name: "N/A",
          crust_name: "N/A",
        });
      } else {
        dish.prices.forEach((price) => {
          list.push({
            dish_price_id: price.dish_price_id.toString(),
            dish_name: dish.dish_name,
            image: dish.image,
            category_name: dish.category?.category_name || "N/A",
            size_name: price.size?.size_name || "Mặc định",
            crust_name: price.crust?.crust_name || "Mặc định",
          });
        });
      }
    });
    return list;
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    let result = [...flattenedDishes];

    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      result = result.filter((d) =>
        d.dish_name.toLowerCase().includes(search) ||
        d.category_name.toLowerCase().includes(search)
      );
    }

    if (columnFilters.dish_price_id) {
      result = result.filter((d) =>
        d.dish_price_id.toLowerCase().includes(columnFilters.dish_price_id.toLowerCase())
      );
    }
    if (columnFilters.dish_name) {
      result = result.filter((d) =>
        d.dish_name.toLowerCase().includes(columnFilters.dish_name.toLowerCase())
      );
    }
    if (columnFilters.category_name) {
      result = result.filter((d) =>
        d.category_name.toLowerCase().includes(columnFilters.category_name.toLowerCase())
      );
    }
    if (columnFilters.size_name) {
      result = result.filter((d) =>
        d.size_name.toLowerCase().includes(columnFilters.size_name.toLowerCase())
      );
    }
    if (columnFilters.crust_name) {
      result = result.filter((d) =>
        d.crust_name.toLowerCase().includes(columnFilters.crust_name.toLowerCase())
      );
    }

    return result;
  }, [flattenedDishes, columnFilters, globalSearch]);

  const totalPages = Math.ceil(filteredDishes.length / perPage) || 1;
  const paginatedData = filteredDishes.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          Quản lý món ăn
        </h1>
        <span className="text-sm text-gray-500">Tổng: {flattenedDishes.length} biến thể món ăn</span>
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 outline-none focus:border-primary dark:border-dark-3"
            />
            <button className="flex items-center justify-center rounded-r-lg bg-indigo-500 px-4 py-3 text-white transition hover:bg-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark dark:text-white">Per Page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-stroke bg-transparent py-2 pl-3 pr-8 outline-none focus:border-primary dark:border-dark-3"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="w-28 px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Mã món ăn</th>
                <th className="px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tên món ăn</th>
                <th className="w-24 px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Hình ảnh</th>
                <th className="px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Loại món ăn</th>
                <th className="px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Kích cỡ</th>
                <th className="px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Viền bánh</th>
                <th className="w-32 px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Chưa có món ăn
                  </td>
                </tr>
              ) : (
                paginatedData.map((dish, idx) => (
                  <tr key={`${dish.dish_price_id}-${idx}`} className="border-b border-stroke last:border-0 dark:border-dark-3">
                    <td className="px-4 py-4 text-sm text-dark dark:text-white">{dish.dish_price_id}</td>
                    <td className="px-4 py-4 font-medium text-dark dark:text-white">{dish.dish_name}</td>
                    <td className="px-4 py-4">
                      {dish.image ? (
                        <img src={dish.image} alt={dish.dish_name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium dark:bg-dark-2">Trống</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">{dish.category_name}</td>
                    <td className="px-4 py-4 text-sm">{dish.size_name}</td>
                    <td className="px-4 py-4 text-sm">{dish.crust_name}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleView(dish)} title="Xem chi tiết" className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5">
                            <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button onClick={() => handleEdit(dish)} title="Sửa" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(dish.dish_price_id)} title="Xóa" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

      <Modal isOpen={!!viewDish} setIsOpen={(val) => !val && setViewDish(null)} title="Chi tiết món ăn">
        {viewDish && (
          <div className="mb-2 flex gap-6 text-sm text-dark dark:text-gray-300">
            <div className="flex-1 space-y-3">
              <p><span className="font-semibold text-gray-500">Mã món:</span> <span className="ml-1 break-all font-mono">{viewDish.dish_price_id}</span></p>
              <p><span className="font-semibold text-gray-500">Tên món:</span> <span className="ml-1 font-medium">{viewDish.dish_name}</span></p>
              <p><span className="font-semibold text-gray-500">Danh mục:</span> <span className="ml-1">{viewDish.category_name}</span></p>
              <p><span className="font-semibold text-gray-500">Kích cỡ:</span> <span className="ml-1">{viewDish.size_name}</span></p>
              <p><span className="font-semibold text-gray-500">Viền bánh:</span> <span className="ml-1">{viewDish.crust_name}</span></p>
            </div>
            <div className="flex shrink-0 flex-col items-center justify-start">
              {viewDish.image ? (
                <img src={viewDish.image} alt={viewDish.dish_name} className="h-32 w-32 rounded-2xl border border-stroke object-cover shadow-sm dark:border-dark-3" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-stroke bg-gray-50 px-2 text-center text-gray-400 dark:border-dark-3 dark:bg-dark-2">
                  Không có ảnh
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!editDish} setIsOpen={(val) => !val && setEditDish(null)} title="Sửa thông tin">
        {editDish && (
          <>
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Tên món ăn</label>
                <input type="text" defaultValue={editDish.dish_name} className="w-full rounded-xl border border-stroke bg-gray-50 px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white" disabled />
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">Thuộc tính chỉ đọc ở chức năng này.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Kích cỡ</label>
                <input type="text" defaultValue={editDish.size_name} className="w-full rounded-xl border border-stroke bg-gray-50 px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white" disabled />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">Viền bánh</label>
                <input type="text" defaultValue={editDish.crust_name} className="w-full rounded-xl border border-stroke bg-gray-50 px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white" disabled />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setEditDish(null)}
                variant="outlineDark"
                size="default"
                label="Hủy"
                className="flex-1"
              />
              <Button
                onClick={() => { alert("Chức năng lưu đang chờ API..."); setEditDish(null); }}
                variant="primary"
                size="default"
                label="Lưu thay đổi"
                className="flex-1"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                }
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
