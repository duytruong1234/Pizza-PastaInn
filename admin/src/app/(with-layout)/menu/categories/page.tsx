// Trang quản lý danh mục
"use client";

import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui-elements/button";
import { Modal } from "@/components/ui/modal";
import InputGroup from "@/components/FormElements/InputGroup";

interface Category {
  category_id: number;
  category_name: string;
  _count: { dishes: number; combos: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout states
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: "category_id" | "category_name" | "dishes" | "combos";
    direction: "asc" | "desc";
  } | null>(null);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Modal
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

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
    if (!addName.trim()) {
      setAddError("Vui lòng nhập tên loại món ăn");
      return;
    }
    setAddError("");
    setAddSaving(true);
    try {
      await api.post("/api/admin/categories", {
        category_name: addName.trim(),
      });
      setAddName("");
      setAddError("");
      setShowAddModal(false);
      toast.success("Tạo loại món ăn thành công");
      fetchCategories();
    } catch {
      toast.error("Lỗi khi tạo loại món ăn");
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.category_name);
    setEditError("");
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    if (!editName.trim()) {
      setEditError("Vui lòng nhập tên loại món ăn");
      return;
    }
    setEditError("");
    setEditSaving(true);
    try {
      await api.put(`/api/admin/categories/${editingCategory.category_id}`, {
        category_name: editName.trim(),
      });
      setEditingCategory(null);
      toast.success("Cập nhật loại món ăn thành công");
      fetchCategories();
    } catch {
      toast.error("Lỗi khi cập nhật");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await api.delete(`/api/admin/categories/${deletingCategory.category_id}`);
      toast.success("Xóa thành công");
      setDeletingCategory(null);
      fetchCategories();
    } catch {
      toast.error("Lỗi khi xóa — loại món ăn có thể đang có món ăn");
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
  }, [categories, globalSearch, sortConfig]);

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
          QUẢN LÝ LOẠI MÓN ĂN
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Tổng: {categories.length} loại món ăn</span>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outlinePrimary"
            shape="full"
            size="small"
            label="Thêm Loại Món Ăn"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
            }
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
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
              Hiển thị:
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
        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-primary text-white">
                <tr className="text-left">
                  <th
                    className="cursor-pointer whitespace-nowrap rounded-tl-lg px-4 py-4 font-semibold uppercase tracking-wide hover:bg-indigo-600"
                    onClick={() => handleSort("category_id")}
                  >
                    ID
                  </th>
                  <th
                    className="cursor-pointer whitespace-nowrap px-4 py-4 font-semibold uppercase tracking-wide hover:bg-indigo-600"
                    onClick={() => handleSort("category_name")}
                  >
                    TÊN LOẠI MÓN ĂN
                  </th>
                  <th
                    className="cursor-pointer whitespace-nowrap px-4 py-4 font-semibold uppercase tracking-wide hover:bg-indigo-600"
                    onClick={() => handleSort("dishes")}
                  >
                    SỐ MÓN ĂN
                  </th>
                  <th
                    className="cursor-pointer whitespace-nowrap px-4 py-4 font-semibold uppercase tracking-wide hover:bg-indigo-600"
                    onClick={() => handleSort("combos")}
                  >
                    SỐ COMBO
                  </th>
                  <th className="rounded-tr-lg px-4 py-4 text-center font-semibold uppercase tracking-wide">THAO TÁC</th>
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
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((cat) => (
                    <tr
                      key={cat.category_id}
                      className="border-b border-stroke text-sm text-dark last:border-0 dark:border-dark-3 dark:text-white"
                    >
                      <td className="px-4 py-4">{cat.category_id}</td>
                      <td className="px-4 py-4 font-medium">{cat.category_name}</td>
                      <td className="px-4 py-4">{cat._count.dishes}</td>
                      <td className="px-4 py-4">{cat._count.combos}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(cat)}
                            title="Sửa"
                            className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20"
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
                            onClick={() => setDeletingCategory(cat)}
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
              Trang {currentPage} / {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL THÊM DANH MỤC ── */}
      <Modal isOpen={showAddModal} setIsOpen={setShowAddModal} title="THÊM LOẠI MÓN ĂN MỚI">
        <div className="space-y-5 p-2">
          <InputGroup
            label="TÊN LOẠI MÓN ĂN (*)"
            type="text"
            placeholder="Nhập tên loại món ăn"
            value={addName}
            handleChange={(e) => { setAddName(e.target.value); setAddError(""); }}
            error={addError}
          />
          <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <Button onClick={() => setShowAddModal(false)} variant="outlineDark" label="Hủy" shape="rounded" />
            <Button onClick={handleAdd} variant="primary" label={addSaving ? "Đang lưu..." : "Thêm mới"} disabled={addSaving} shape="rounded" />
          </div>
        </div>
      </Modal>

      {/* ── MODAL SỬA DANH MỤC ── */}
      <Modal isOpen={!!editingCategory} setIsOpen={() => setEditingCategory(null)} title="SỬA LOẠI MÓN ĂN">
        <div className="space-y-5 p-2">
          <InputGroup
            label="TÊN LOẠI MÓN ĂN (*)"
            type="text"
            value={editName}
            handleChange={(e) => { setEditName(e.target.value); setEditError(""); }}
            error={editError}
          />
          <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <Button onClick={() => setEditingCategory(null)} variant="outlineDark" label="Hủy" shape="rounded" />
            <Button onClick={handleUpdate} variant="primary" label={editSaving ? "Đang lưu..." : "Lưu thay đổi"} disabled={editSaving} shape="rounded" />
          </div>
        </div>
      </Modal>

      {/* ── MODAL XÓA DANH MỤC ── */}
      <Modal isOpen={!!deletingCategory} setIsOpen={() => setDeletingCategory(null)} className="relative max-w-[400px] p-8">
        {deletingCategory && (
          <div className="flex flex-col items-center text-center">
            <button type="button" onClick={() => setDeletingCategory(null)} className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-gray-400 text-white transition hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#d34053] dark:bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">Xóa Loại Món Ăn</h3>
            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              Bạn có chắc chắn muốn xóa <span className="font-semibold text-dark dark:text-white">"{deletingCategory.category_name}"</span> không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex w-full gap-4">
              <button type="button" onClick={() => setDeletingCategory(null)} className="flex-1 rounded-xl bg-gray-100 py-3 font-medium text-dark transition hover:bg-gray-200 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4">Hủy bỏ</button>
              <button type="button" onClick={handleDelete} className="flex-1 rounded-xl bg-[#d34053] py-3 font-medium text-white transition hover:bg-[#ba3849]">Đồng ý</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
