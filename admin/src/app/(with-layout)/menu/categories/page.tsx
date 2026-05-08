// Trang quản lý danh mục
"use client";

import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui-elements/button";

interface Category {
  category_id: number;
  category_name: string;
  _count: { dishes: number; combos: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Layout states
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({
    id: "",
    name: "",
    dishes: "",
    combos: "",
  });
  const [sortConfig, setSortConfig] = useState<{
    key: "category_id" | "category_name" | "dishes" | "combos";
    direction: "asc" | "desc";
  } | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/categories");
      setCategories(res.data.data);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await api.post("/api/admin/categories", {
        category_name: newName.trim(),
      });
      setNewName("");
      setShowAdd(false);
      toast.success("Tạo danh mục thành công");
      fetchCategories();
    } catch {
      toast.error("Lỗi khi tạo danh mục");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/api/admin/categories/${id}`, {
        category_name: editName.trim(),
      });
      setEditId(null);
      toast.success("Cập nhật thành công");
      fetchCategories();
    } catch {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      toast.success("Xóa thành công");
      fetchCategories();
    } catch {
      toast.error("Lỗi khi xóa — danh mục có thể đang có món ăn");
    }
  };

  // Processing data
  const filteredAndSorted = useMemo(() => {
    let result = [...categories];

    // Global Search
    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      result = result.filter((c) =>
        c.category_name.toLowerCase().includes(search)
      );
    }

    // Column Filters
    if (columnFilters.id) {
      result = result.filter((c) =>
        c.category_id.toString().includes(columnFilters.id)
      );
    }
    if (columnFilters.name) {
      result = result.filter((c) =>
        c.category_name.toLowerCase().includes(columnFilters.name.toLowerCase())
      );
    }
    if (columnFilters.dishes) {
      result = result.filter((c) =>
        c._count.dishes.toString().includes(columnFilters.dishes)
      );
    }
    if (columnFilters.combos) {
      result = result.filter((c) =>
        c._count.combos.toString().includes(columnFilters.combos)
      );
    }

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Category];
        let bVal: any = b[sortConfig.key as keyof Category];

        if (sortConfig.key === "dishes" || sortConfig.key === "combos") {
          aVal = a._count[sortConfig.key];
          bVal = b._count[sortConfig.key];
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [categories, globalSearch, columnFilters, sortConfig]);

  const totalPages = Math.ceil(filteredAndSorted.length / perPage) || 1;
  const paginatedData = filteredAndSorted.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handleSort = (
    key: "category_id" | "category_name" | "dishes" | "combos"
  ) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };


  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          Quản lý danh mục
        </h1>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          variant="outlinePrimary"
          shape="full"
          size="small"
          label="Thêm danh mục"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          }
        />
      </div>

      {showAdd && (
        <div className="mb-6 flex gap-2 rounded-xl border border-stroke bg-white p-4 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên danh mục mới..."
            className="flex-1 rounded-lg border border-stroke px-4 py-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button
            onClick={handleAdd}
            variant="primary"
            size="small"
            label="Lưu"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            }
          />
          <Button
            onClick={() => setShowAdd(false)}
            variant="outlineDark"
            size="small"
            label="Hủy"
          />
        </div>
      )}

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input
              type="text"
              placeholder="Search here..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 outline-none focus:border-primary dark:border-dark-3"
            />
            <button className="flex items-center justify-center rounded-r-lg bg-indigo-500 px-4 py-3 text-white transition hover:bg-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark dark:text-white">
              Per Page:
            </span>
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

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th
                  className="cursor-pointer whitespace-nowrap px-4 pb-2 pt-4 font-medium text-gray-500 hover:text-dark dark:hover:text-white"
                  onClick={() => handleSort("category_id")}
                >
                  ID
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 pb-2 pt-4 font-medium text-gray-500 hover:text-dark dark:hover:text-white"
                  onClick={() => handleSort("category_name")}
                >
                  Tên danh mục
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 pb-2 pt-4 font-medium text-gray-500 hover:text-dark dark:hover:text-white"
                  onClick={() => handleSort("dishes")}
                >
                  Số món
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 pb-2 pt-4 font-medium text-gray-500 hover:text-dark dark:hover:text-white"
                  onClick={() => handleSort("combos")}
                >
                  Số combo
                </th>
                <th className="px-4 pb-2 pt-4 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginatedData.map((cat) => (
                  <tr
                    key={cat.category_id}
                    className="border-b border-stroke text-sm text-dark last:border-0 dark:border-dark-3 dark:text-white"
                  >
                    <td className="px-4 py-4">{cat.category_id}</td>
                    <td className="px-4 py-4">
                      {editId === cat.category_id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border px-3 py-1 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleUpdate(cat.category_id)
                          }
                          autoFocus
                        />
                      ) : (
                        cat.category_name
                      )}
                    </td>
                    <td className="px-4 py-4">{cat._count.dishes}</td>
                    <td className="px-4 py-4">{cat._count.combos}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {editId === cat.category_id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(cat.category_id)}
                              title="Lưu"
                              className="rounded p-1.5 text-green-600 transition hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="size-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              title="Hủy"
                              className="rounded p-1.5 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-dark-3"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="size-5"
                              >
                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditId(cat.category_id);
                                setEditName(cat.category_name);
                              }}
                              title="Sửa"
                              className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="size-4.5"
                              >
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(cat.category_id)}
                              title="Xóa"
                              className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="size-4.5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </>
                        )}
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
    </div>
  );
}
