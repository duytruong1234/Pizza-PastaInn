// Trang quản lý món ăn
"use client";

import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui-elements/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { Checkbox } from "@/components/FormElements/checkbox";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/components/ui/dropdown";

interface Dish {
  dish_id: number;
  dish_name: string;
  image: string | null;
  ingredient: string | null;
  dish_status: boolean;
  category_id: number | null;
  category?: { category_name: string };
  prices: Array<{
    dish_price_id: string;
    dish_price: number;
    size_id?: number | null;
    crust_id?: number | null;
    size?: { size_name: string };
    crust?: { crust_name: string };
  }>;
}

interface FlattenedDish {
  dish_id: number;
  dish_price_id: string;
  dish_name: string;
  image: string | null;
  ingredient: string | null;
  dish_status: boolean;
  category_id: number | null;
  category_name: string;
  size_id: number | null;
  crust_id: number | null;
  size_name: string;
  crust_name: string;
  dish_price: number;
}

interface Category { category_id: number; category_name: string; }
interface Size { size_id: number; size_name: string; }
interface Crust { crust_id: number; crust_name: string; }

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
  const [editForm, setEditForm] = useState({
    dish_name: "",
    image: "" as string | null,
    ingredient: "",
    dish_status: true,
    category_id: null as number | null,
    size_id: null as number | null,
    crust_id: null as number | null,
    dish_price: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dishToDelete, setDishToDelete] = useState<FlattenedDish | null>(null);
  const [uploading, setUploading] = useState(false);

  // Checkbox filters
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [selectedCrusts, setSelectedCrusts] = useState<number[]>([]);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isCrustOpen, setIsCrustOpen] = useState(false);

  // Add dish modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    dish_name: "",
    image: "" as string | null,
    ingredient: "",
    dish_status: true,
    category_id: null as number | null,
    size_id: null as number | null,
    crust_id: null as number | null,
    dish_price: 0,
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addUploading, setAddUploading] = useState(false);

  // Dropdown data
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [crusts, setCrusts] = useState<Crust[]>([]);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/dishes");
      setDishes(res.data.data);
    } catch {
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
    // Fetch dropdown data
    api.get("/api/admin/categories").then((r) => setCategories(r.data.data)).catch(() => { });
    api.get("/api/admin/sizes").then((r) => setSizes(r.data.data)).catch(() => { });
    api.get("/api/admin/crusts").then((r) => setCrusts(r.data.data)).catch(() => { });
  }, []);

  const handleView = (dish: FlattenedDish) => setViewDish(dish);

  const handleEdit = (dish: FlattenedDish) => {
    setEditDish(dish);
    setEditForm({
      dish_name: dish.dish_name,
      image: dish.image || "",
      ingredient: dish.ingredient || "",
      dish_status: dish.dish_status,
      category_id: dish.category_id,
      size_id: dish.size_id,
      crust_id: dish.crust_id,
      dish_price: dish.dish_price,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = res.data.data.url;
      setEditForm((f) => ({ ...f, image: imageUrl }));
      toast.success("Tải ảnh thành công");
    } catch {
      toast.error("Lỗi khi tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editDish) return;
    setSaving(true);
    try {
      // Update dish basic info
      await api.put(`/api/admin/dishes/${editDish.dish_id}`, {
        dish_name: editForm.dish_name.trim(),
        image: editForm.image || null,
        ingredient: editForm.ingredient.trim() || null,
        dish_status: editForm.dish_status,
        category_id: editForm.category_id,
      });
      // Update dish price variant (size, crust, price)
      if (editDish.dish_price_id && !editDish.dish_price_id.startsWith("dish-")) {
        await api.put(`/api/admin/dish-prices/${editDish.dish_price_id}`, {
          size_id: editForm.size_id,
          crust_id: editForm.crust_id,
          dish_price: editForm.dish_price,
        });
      }
      toast.success("Cập nhật món ăn thành công");
      setEditDish(null);
      fetchDishes();
    } catch {
      toast.error("Lỗi khi cập nhật món ăn");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (dish: FlattenedDish) => {
    setDishToDelete(dish);
  };

  const confirmDelete = async () => {
    if (!dishToDelete) return;
    setDeleting(dishToDelete.dish_price_id);
    try {
      await api.delete(`/api/admin/dishes/${dishToDelete.dish_id}`);
      toast.success("Xóa món ăn thành công");
      fetchDishes();
    } catch {
      toast.error("Lỗi khi xóa — món ăn có thể đang được sử dụng trong đơn hàng");
    } finally {
      setDeleting(null);
      setDishToDelete(null);
    }
  };

  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/api/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setAddForm((f) => ({ ...f, image: res.data.data.url }));
      toast.success("Tải ảnh thành công");
    } catch {
      toast.error("Lỗi khi tải ảnh lên");
    } finally {
      setAddUploading(false);
    }
  };

  const handleAddDish = async () => {
    if (!addForm.dish_name.trim()) { toast.error("Vui lòng nhập tên món ăn"); return; }
    setAddSaving(true);
    try {
      const dishRes = await api.post("/api/admin/dishes", {
        dish_name: addForm.dish_name.trim(),
        image: addForm.image || null,
        ingredient: addForm.ingredient.trim() || null,
        dish_status: addForm.dish_status,
        category_id: addForm.category_id,
      });
      const newDishId = dishRes.data.data.dish_id;
      // Create price variant
      if (addForm.size_id || addForm.crust_id || addForm.dish_price) {
        const priceId = `dp_${newDishId}_${Date.now()}`;
        await api.post("/api/admin/dish-prices", {
          dish_price_id: priceId,
          dish_id: newDishId,
          size_id: addForm.size_id,
          crust_id: addForm.crust_id,
          dish_price: addForm.dish_price,
        });
      }
      toast.success("Thêm món ăn thành công");
      setShowAddModal(false);
      setAddForm({ dish_name: "", image: null, ingredient: "", dish_status: true, category_id: null, size_id: null, crust_id: null, dish_price: 0 });
      fetchDishes();
    } catch {
      toast.error("Lỗi khi thêm món ăn");
    } finally {
      setAddSaving(false);
    }
  };

  // Toggle checkbox filter helpers
  const toggleFilter = (arr: number[], val: number, setter: (v: number[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
    setCurrentPage(1);
  };

  const flattenedDishes = useMemo(() => {
    const list: FlattenedDish[] = [];
    dishes.forEach((dish) => {
      if (!dish.prices || dish.prices.length === 0) {
        list.push({
          dish_id: dish.dish_id,
          dish_price_id: `dish-${dish.dish_id}`,
          dish_name: dish.dish_name,
          image: dish.image,
          ingredient: dish.ingredient,
          dish_status: dish.dish_status ?? true,
          category_id: dish.category_id,
          category_name: dish.category?.category_name || "N/A",
          size_id: null, crust_id: null,
          size_name: "N/A", crust_name: "N/A",
          dish_price: 0,
        });
      } else {
        dish.prices.forEach((price) => {
          list.push({
            dish_id: dish.dish_id,
            dish_price_id: price.dish_price_id.toString(),
            dish_name: dish.dish_name,
            image: dish.image,
            ingredient: dish.ingredient,
            dish_status: dish.dish_status ?? true,
            category_id: dish.category_id,
            category_name: dish.category?.category_name || "N/A",
            size_id: price.size_id ?? null,
            crust_id: price.crust_id ?? null,
            size_name: price.size?.size_name || "Mặc định",
            crust_name: price.crust?.crust_name || "Mặc định",
            dish_price: price.dish_price ?? 0,
          });
        });
      }
    });
    return list;
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    let result = [...flattenedDishes];
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter((d) => d.dish_name.toLowerCase().includes(s) || d.category_name.toLowerCase().includes(s));
    }
    if (columnFilters.dish_price_id) result = result.filter((d) => d.dish_price_id.toLowerCase().includes(columnFilters.dish_price_id.toLowerCase()));
    if (columnFilters.dish_name) result = result.filter((d) => d.dish_name.toLowerCase().includes(columnFilters.dish_name.toLowerCase()));
    if (columnFilters.category_name) result = result.filter((d) => d.category_name.toLowerCase().includes(columnFilters.category_name.toLowerCase()));
    if (columnFilters.size_name) result = result.filter((d) => d.size_name.toLowerCase().includes(columnFilters.size_name.toLowerCase()));
    if (columnFilters.crust_name) result = result.filter((d) => d.crust_name.toLowerCase().includes(columnFilters.crust_name.toLowerCase()));
    // Checkbox filters
    if (selectedCategories.length > 0) result = result.filter((d) => d.category_id !== null && selectedCategories.includes(d.category_id));
    if (selectedSizes.length > 0) result = result.filter((d) => d.size_id !== null && selectedSizes.includes(d.size_id));
    if (selectedCrusts.length > 0) result = result.filter((d) => d.crust_id !== null && selectedCrusts.includes(d.crust_id));
    return result;
  }, [flattenedDishes, columnFilters, globalSearch, selectedCategories, selectedSizes, selectedCrusts]);

  const totalPages = Math.ceil(filteredDishes.length / perPage) || 1;
  const paginatedData = filteredDishes.slice((currentPage - 1) * perPage, currentPage * perPage);

  const formatPrice = (p: number) => p.toLocaleString("vi-VN") + " đ";

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const getImageUrl = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${API_BASE}${img}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Quản lý món ăn</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Tổng: {flattenedDishes.length} biến thể</span>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outlinePrimary"
            size="small"
            shape="full"
            label="Thêm món ăn"
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input type="text" placeholder="Tìm kiếm..." value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }} className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 outline-none focus:border-primary dark:border-dark-3" />
            <button className="flex items-center justify-center rounded-r-lg bg-indigo-500 px-4 py-3 text-white transition hover:bg-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark dark:text-white">Per Page:</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} className="rounded-lg border border-stroke bg-transparent py-2 pl-3 pr-8 outline-none focus:border-primary dark:border-dark-3">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Checkbox Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Loại món ăn */}
          <Dropdown isOpen={isCategoryOpen} setIsOpen={setIsCategoryOpen}>
            <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm font-medium text-dark transition hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
              Loại món ăn {selectedCategories.length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">{selectedCategories.length}</span>}
              <svg className={`h-4 w-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </DropdownTrigger>
            <DropdownContent align="start" className="max-h-60 w-56 overflow-y-auto border border-stroke bg-white p-3 shadow-md dark:border-dark-3 dark:bg-dark-2">
              <div className="space-y-3">
                {categories.map((c) => (
                  <Checkbox
                    key={c.category_id}
                    label={c.category_name}
                    withIcon="check"
                    checked={selectedCategories.includes(c.category_id)}
                    onChange={() => toggleFilter(selectedCategories, c.category_id, setSelectedCategories)}
                  />
                ))}
              </div>
            </DropdownContent>
          </Dropdown>

          {/* Kích cỡ */}
          <Dropdown isOpen={isSizeOpen} setIsOpen={setIsSizeOpen}>
            <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm font-medium text-dark transition hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
              Kích cỡ {selectedSizes.length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">{selectedSizes.length}</span>}
              <svg className={`h-4 w-4 transition-transform ${isSizeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </DropdownTrigger>
            <DropdownContent align="start" className="max-h-60 w-56 overflow-y-auto border border-stroke bg-white p-3 shadow-md dark:border-dark-3 dark:bg-dark-2">
              <div className="space-y-3">
                {sizes.map((s) => (
                  <Checkbox
                    key={s.size_id}
                    label={s.size_name}
                    withIcon="check"
                    checked={selectedSizes.includes(s.size_id)}
                    onChange={() => toggleFilter(selectedSizes, s.size_id, setSelectedSizes)}
                  />
                ))}
              </div>
            </DropdownContent>
          </Dropdown>

          {/* Viền bánh */}
          <Dropdown isOpen={isCrustOpen} setIsOpen={setIsCrustOpen}>
            <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm font-medium text-dark transition hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
              Viền bánh {selectedCrusts.length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">{selectedCrusts.length}</span>}
              <svg className={`h-4 w-4 transition-transform ${isCrustOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </DropdownTrigger>
            <DropdownContent align="start" className="max-h-60 w-56 overflow-y-auto border border-stroke bg-white p-3 shadow-md dark:border-dark-3 dark:bg-dark-2">
              <div className="space-y-3">
                {crusts.map((c) => (
                  <Checkbox
                    key={c.crust_id}
                    label={c.crust_name}
                    withIcon="check"
                    checked={selectedCrusts.includes(c.crust_id)}
                    onChange={() => toggleFilter(selectedCrusts, c.crust_id, setSelectedCrusts)}
                  />
                ))}
              </div>
            </DropdownContent>
          </Dropdown>
        </div>

        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-primary text-white">
                <tr>
                <th className="rounded-tl-lg py-4 pl-4 pr-3 text-sm font-semibold uppercase tracking-wide">Mã món ăn</th>
                <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Tên món ăn</th>
                <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wide">Hình ảnh</th>
                <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Loại món ăn</th>
                <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Kích cỡ</th>
                <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Viền bánh</th>
                <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Giá (VNĐ)</th>
                <th className="rounded-tr-lg py-4 pl-3 pr-4 text-center text-sm font-semibold uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Chưa có món ăn</td></tr>
              ) : (
                paginatedData.map((dish, idx) => (
                  <tr key={`${dish.dish_price_id}-${idx}`} className="border-b border-stroke last:border-0 dark:border-dark-3">
                    <td className="py-4 pl-4 pr-3 text-sm text-dark dark:text-white">{dish.dish_price_id}</td>
                    <td className="px-4 py-4 font-medium text-dark dark:text-white">{dish.dish_name}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        {dish.image ? (
                          <img src={getImageUrl(dish.image)!} alt={dish.dish_name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium dark:bg-dark-2">Trống</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{dish.category_name}</td>
                    <td className="px-4 py-4 text-sm">{dish.size_name}</td>
                    <td className="px-4 py-4 text-sm">{dish.crust_name}</td>
                    <td className="px-4 py-4 text-sm font-medium text-primary">{formatPrice(dish.dish_price)}</td>
                    <td className="py-4 pl-3 pr-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleView(dish)} title="Xem chi tiết" className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={() => handleEdit(dish)} title="Sửa" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(dish)} disabled={deleting === dish.dish_price_id} title="Xóa" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
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
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            <div className="text-sm text-gray-500">Showing {currentPage} of {totalPages} pages</div>
          </div>
        )}
      </div>

      {/* ── MODAL XEM CHI TIẾT ── */}
      <Modal isOpen={!!viewDish} setIsOpen={(val) => !val && setViewDish(null)} title="Chi tiết món ăn" className="max-w-xl">
        {viewDish && (
          <div className="space-y-5 text-sm text-dark dark:text-gray-300">
            {/* Ảnh + info chính */}
            <div className="flex gap-5">
              <div className="shrink-0">
                {viewDish.image ? (
                  <img src={getImageUrl(viewDish.image)!} alt={viewDish.dish_name} className="h-28 w-28 rounded-2xl border border-stroke object-cover shadow-sm dark:border-dark-3" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-stroke bg-gray-50 text-gray-400 dark:border-dark-3 dark:bg-dark-2">Không có ảnh</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p><span className="font-semibold text-gray-500">Mã biến thể:</span> <span className="ml-1 font-mono text-xs">{viewDish.dish_price_id}</span></p>
                <p><span className="font-semibold text-gray-500">Tên món:</span> <span className="ml-1 font-medium text-base">{viewDish.dish_name}</span></p>
                <p><span className="font-semibold text-gray-500">Danh mục:</span> <span className="ml-1">{viewDish.category_name}</span></p>
                <p>
                  <span className="font-semibold text-gray-500">Trạng thái:</span>
                  <Badge variant={viewDish.dish_status ? "success" : "danger"} className="ml-2">
                    {viewDish.dish_status ? "Đang bán" : "Ngừng bán"}
                  </Badge>
                </p>
              </div>
            </div>

            {/* Biến thể giá */}
            <div className="rounded-xl border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
              <h4 className="mb-2 font-semibold text-dark dark:text-white">Biến thể hiện tại</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">Kích cỡ:</span> <span className="ml-1 font-medium">{viewDish.size_name}</span></div>
                <div><span className="text-gray-500">Viền bánh:</span> <span className="ml-1 font-medium">{viewDish.crust_name}</span></div>
                <div><span className="text-gray-500">Giá:</span> <span className="ml-1 font-semibold text-primary">{formatPrice(viewDish.dish_price)}</span></div>
              </div>
            </div>

            {/* Thành phần */}
            <div className="rounded-xl border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
              <h4 className="mb-2 font-semibold text-dark dark:text-white">Thành phần (Ingredient)</h4>
              {viewDish.ingredient ? (
                <p className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-400">{viewDish.ingredient}</p>
              ) : (
                <p className="italic text-gray-400">Chưa cập nhật thành phần cho món ăn này.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL SỬA ── */}
      <Modal isOpen={!!editDish} setIsOpen={(val) => !val && setEditDish(null)} title="Sửa thông tin món ăn" className="max-w-2xl">
        {editDish && (
          <>
            <div className="mb-6 space-y-5">
              {/* Row 1: Tên món ăn */}
              <InputGroup
                label="Tên món ăn"
                type="text"
                placeholder="Nhập tên món ăn..."
                value={editForm.dish_name}
                handleChange={(e) => setEditForm((f) => ({ ...f, dish_name: e.target.value }))}
              />

              {/* Row 2: Hình ảnh (File Drop Zone) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Hình ảnh</label>
                <div className={`relative rounded-xl border border-dashed border-stroke bg-[#f8fafd] text-center transition-colors hover:border-primary dark:border-dark-3 dark:bg-dark-2/50 ${editForm.image ? "py-4" : "py-8"}`}>
                  {editForm.image ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={getImageUrl(editForm.image)!} alt="Preview" className="h-32 w-32 rounded-xl object-cover shadow-sm border border-stroke" />
                      <div className="flex items-center gap-2">
                        <label className={`cursor-pointer text-sm font-medium text-primary hover:underline ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                          {uploading ? "Đang tải..." : "Đổi ảnh"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => setEditForm((f) => ({ ...f, image: null }))} className="text-sm font-medium text-red-500 hover:underline">
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-4 cursor-pointer ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-dark-3">
                        {uploading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-dark dark:text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-dark dark:text-white">
                        {uploading ? "Đang tải ảnh lên..." : "Nhấn để tải ảnh từ máy tính"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
                {!editForm.image && (
                  <div className="mt-3">
                    <InputGroup
                      label=""
                      type="text"
                      value={editForm.image || ""}
                      handleChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
                      placeholder="Hoặc dán đường dẫn ảnh (URL) vào đây..."
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Loại món ăn + Trạng thái */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Loại món ăn"
                  value={editForm.category_id ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value ? Number(e.target.value) : null }))}
                  items={categories.map((c) => ({ value: c.category_id, label: c.category_name }))}
                  placeholder="-- Chọn loại --"
                />
                <Select
                  label="Trạng thái"
                  value={editForm.dish_status ? "1" : "0"}
                  onChange={(e) => setEditForm((f) => ({ ...f, dish_status: e.target.value === "1" }))}
                  items={[
                    { value: "1", label: "Đang bán" },
                    { value: "0", label: "Ngừng bán" },
                  ]}
                />
              </div>

              {/* Row 4: Kích cỡ + Viền bánh + Giá */}
              <div className="rounded-xl border border-stroke bg-gray-50/50 p-4 dark:border-dark-3 dark:bg-dark-2/50">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Thông tin biến thể</p>
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    label="Kích cỡ"
                    value={editForm.size_id ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, size_id: e.target.value ? Number(e.target.value) : null }))}
                    items={sizes.map((s) => ({ value: s.size_id, label: s.size_name }))}
                  />
                  <Select
                    label="Viền bánh"
                    value={editForm.crust_id ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, crust_id: e.target.value ? Number(e.target.value) : null }))}
                    items={crusts.map((c) => ({ value: c.crust_id, label: c.crust_name }))}
                  />
                  <InputGroup
                    label="Giá (VNĐ)"
                    type="number"
                    value={editForm.dish_price}
                    handleChange={(e) => setEditForm((f) => ({ ...f, dish_price: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Row 5: Thành phần */}
              <TextAreaGroup
                label="Thành phần (Ingredient)"
                placeholder="Nhập thành phần của món ăn..."
                value={editForm.ingredient}
                onChange={(e) => setEditForm((f) => ({ ...f, ingredient: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setEditDish(null)} variant="outlineDark" size="default" shape="rounded" label="Hủy" className="flex-1" />
              <Button
                onClick={handleSave}
                variant="primary"
                size="default"
                shape="rounded"
                label={saving ? "Đang lưu..." : "Lưu thay đổi"}
                className="flex-1"
                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>}
              />
            </div>
          </>
        )}
      </Modal>

      {/* ── MODAL XÓA ── */}
      <Modal isOpen={!!dishToDelete} setIsOpen={(val) => !val && setDishToDelete(null)} className="relative max-w-[400px] p-8">
        {dishToDelete && (
          <div className="flex flex-col items-center text-center">
            {/* Nút đóng góc phải */}
            <button
              onClick={() => setDishToDelete(null)}
              className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-gray-400 text-white transition hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>

            {/* Icon thùng rác đỏ nhạt */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#d34053] dark:bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>

            <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">Delete</h3>
            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <span className="font-semibold text-dark dark:text-white">"{dishToDelete.dish_name}"</span>?<br />
            </p>

            <div className="flex w-full gap-4">
              <button
                onClick={() => setDishToDelete(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-medium text-dark transition hover:bg-gray-200 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-[#d34053] py-3 font-medium text-white transition hover:bg-[#ba3849]"
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL THÊM MÓN ĂN ── */}
      <Modal isOpen={showAddModal} setIsOpen={setShowAddModal} className="relative max-w-[600px] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-dark dark:text-white">Thêm món ăn mới</h3>
          <button
            onClick={() => setShowAddModal(false)}
            className="flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="mb-8 space-y-6">
          <InputGroup label="Tên món ăn" type="text" placeholder="Nhập tên món ăn..." value={addForm.dish_name} handleChange={(e) => setAddForm((f) => ({ ...f, dish_name: e.target.value }))} />

          {/* Drop Zone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Hình ảnh</label>
            <div className={`relative flex items-center justify-center rounded-xl border border-dashed border-stroke bg-[#fafbfe] text-center transition-colors hover:border-primary dark:border-dark-3 dark:bg-dark-2/50 ${addForm.image ? "py-4" : "py-10"}`}>
              {addForm.image ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={getImageUrl(addForm.image)!} alt="Preview" className="h-32 w-32 rounded-xl object-cover shadow-sm border border-stroke" />
                  <div className="flex items-center gap-2">
                    <label className={`cursor-pointer text-sm font-medium text-primary hover:underline ${addUploading ? "pointer-events-none opacity-50" : ""}`}>
                      {addUploading ? "Đang tải..." : "Đổi ảnh"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAddImageUpload} disabled={addUploading} />
                    </label>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => setAddForm((f) => ({ ...f, image: null }))} className="text-sm font-medium text-red-500 hover:underline">Xóa ảnh</button>
                  </div>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-4 cursor-pointer ${addUploading ? "pointer-events-none opacity-50" : ""}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-dark-3">
                    {addUploading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-dark dark:text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-dark dark:text-white">{addUploading ? "Đang tải ảnh lên..." : "Nhấn để tải ảnh từ máy tính"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddImageUpload} disabled={addUploading} />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Loại món ăn" value={addForm.category_id ?? ""} onChange={(e) => setAddForm((f) => ({ ...f, category_id: e.target.value ? Number(e.target.value) : null }))} items={categories.map((c) => ({ value: c.category_id, label: c.category_name }))} placeholder="-- Chọn loại --" />
            <Select label="Trạng thái" value={addForm.dish_status ? "1" : "0"} onChange={(e) => setAddForm((f) => ({ ...f, dish_status: e.target.value === "1" }))} items={[{ value: "1", label: "Đang bán" }, { value: "0", label: "Ngừng bán" }]} />
          </div>

          <div className="rounded-xl border border-stroke bg-white p-5 dark:border-dark-3 dark:bg-dark-2/50">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Thông tin biến thể</p>
            <div className="grid grid-cols-3 gap-4">
              <Select label="Kích cỡ" value={addForm.size_id ?? ""} onChange={(e) => setAddForm((f) => ({ ...f, size_id: e.target.value ? Number(e.target.value) : null }))} items={sizes.map((s) => ({ value: s.size_id, label: s.size_name }))} placeholder="-- Chọn --" />
              <Select label="Viền bánh" value={addForm.crust_id ?? ""} onChange={(e) => setAddForm((f) => ({ ...f, crust_id: e.target.value ? Number(e.target.value) : null }))} items={crusts.map((c) => ({ value: c.crust_id, label: c.crust_name }))} placeholder="-- Chọn --" />
              <InputGroup label="Giá (VNĐ)" type="number" value={addForm.dish_price} handleChange={(e) => setAddForm((f) => ({ ...f, dish_price: Number(e.target.value) }))} placeholder="0" />
            </div>
          </div>

          <TextAreaGroup label="Thành phần (Ingredient)" placeholder="Nhập thành phần của món ăn..." value={addForm.ingredient} onChange={(e) => setAddForm((f) => ({ ...f, ingredient: e.target.value }))} />
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowAddModal(false)}
            className="flex-1 rounded-xl border border-stroke bg-white py-3 font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
          >
            Hủy
          </button>
          <button
            onClick={handleAddDish}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            {addSaving ? "Đang lưu..." : "Thêm món ăn"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
