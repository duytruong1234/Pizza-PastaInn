"use client";
import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui-elements/button";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { toast } from "sonner";
import { DishPicker } from "@/components/combo/DishPicker";

interface Combo {
  combo_id: number; combo_name: string; combo_price: number;
  description: string | null; is_active: boolean; image_combo?: string | null;
  category_id?: number | null;
  categories?: { category_name: string };
  groups: Array<{
    group_id: string; group_name: string;
    min_select?: number; max_select?: number;
    combo_items: Array<{ dish_price_id?: string; price_extra?: number; dish_price?: { dish?: { dish_name: string; image?: string }; size?: { size_name: string }; crust?: { crust_name: string } } }>;
  }>;
}

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewCombo, setViewCombo] = useState<Combo | null>(null);

  const [categories, setCategories] = useState<{ category_id: number; category_name: string }[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);

  // Add/Edit Combo States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addUploading, setAddUploading] = useState(false);
  const [addForm, setAddForm] = useState({
    combo_name: "",
    combo_price: 0,
    description: "",
    is_active: true,
    category_id: null as number | null,
    image_combo: null as string | null,
    groups: [] as Array<{
      group_name: string;
      min_select: number;
      max_select: number;
      items: Array<{ dish_price_id: string; price_extra: number }>;
    }>
  });

  // Delete State
  const [comboToDelete, setComboToDelete] = useState<Combo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});

  // Group Modal State (for adding a new group)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ group_id: "", group_name: "", min_select: 1, max_select: 1 });

  // Dish Picker State
  const [pickerGroupIdx, setPickerGroupIdx] = useState<number | null>(null);
  const [allSizes, setAllSizes] = useState<string[]>([]);
  const [allCrusts, setAllCrusts] = useState<string[]>([]);

  const fetchCombos = () => {
    setLoading(true);
    api.get("/api/admin/combos").then(r => setCombos(r.data.data)).catch(() => setCombos([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCombos();
    api.get("/api/admin/categories").then(r => setCategories(r.data.data)).catch(() => { });
    api.get("/api/admin/dishes").then(r => setDishes(r.data.data)).catch(() => { });
    api.get("/api/admin/sizes").then(r => setAllSizes((r.data.data || []).map((s: any) => s.size_name))).catch(() => { });
    api.get("/api/admin/crusts").then(r => setAllCrusts((r.data.data || []).map((c: any) => c.crust_name))).catch(() => { });
  }, []);

  const dishOptions = useMemo(() => {
    const options: { value: string; label: string; data: any }[] = [];
    dishes.forEach((dish) => {
      if (dish.prices && dish.prices.length > 0) {
        dish.prices.forEach((price: any) => {
          options.push({
            value: price.dish_price_id,
            label: `${dish.dish_name} (${price.size?.size_name || 'Default'} - ${price.crust?.crust_name || 'Default'})`,
            data: { dish_name: dish.dish_name, image: dish.image, size: price.size?.size_name, crust: price.crust?.crust_name, category_name: dish.category?.category_name || null }
          });
        });
      }
    });
    return options;
  }, [dishes]);

  const handlePickerConfirm = (selectedIds: string[]) => {
    if (pickerGroupIdx === null || pickerGroupIdx >= addForm.groups.length) return;
    const newG = [...addForm.groups];
    selectedIds.forEach(id => {
      if (!newG[pickerGroupIdx].items.find(i => i.dish_price_id === id)) {
        newG[pickerGroupIdx].items.push({ dish_price_id: id, price_extra: 0 });
      }
    });
    setAddForm(f => ({ ...f, groups: newG }));
    setPickerGroupIdx(null);
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const getImageUrl = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${API_BASE}${img}`;
  };

  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/api/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setAddForm((f) => ({ ...f, image_combo: res.data.data.url }));
      toast.success("Image uploaded successfully");
    } catch {
      toast.error("Error uploading image");
    } finally {
      setAddUploading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setAddErrors({});
    setAddForm({
      combo_name: "", combo_price: 0, description: "", is_active: true, category_id: null, image_combo: null, groups: []
    });
    setShowAddModal(true);
  };

  const handleEdit = (combo: Combo) => {
    setEditId(combo.combo_id);
    setAddErrors({});
    setAddForm({
      combo_name: combo.combo_name,
      combo_price: combo.combo_price,
      description: combo.description || "",
      is_active: combo.is_active,
      category_id: combo.category_id || null,
      image_combo: combo.image_combo || null,
      groups: combo.groups.map(g => ({
        group_name: g.group_name,
        min_select: g.min_select ?? 1,
        max_select: g.max_select ?? 1,
        items: g.combo_items.map(item => ({
          dish_price_id: item.dish_price_id || "",
          price_extra: item.price_extra || 0
        }))
      }))
    });
    setShowAddModal(true);
  };

  const handleSaveCombo = async () => {
    const errors: Record<string, string> = {};
    if (!addForm.combo_name.trim()) errors.combo_name = "Please enter combo name";
    if (addForm.combo_price <= 0) errors.combo_price = "Combo price must be greater than 0";
    if (!addForm.category_id) errors.category_id = "Please select category for combo";

    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (addForm.groups.length === 0) return toast.error("Please add at least one dish group for combo");

    for (const group of addForm.groups) {
      if (!group.group_name.trim()) return toast.error("Some groups are missing names");
      if (group.items.length === 0) return toast.error(`Dish group "${group.group_name}" has no dishes selected`);
      for (const item of group.items) {
        if (!item.dish_price_id) return toast.error(`Dish group "${group.group_name}" has unselected dishes`);
      }
    }

    setAddSaving(true);
    try {
      if (editId) {
        await api.put(`/api/admin/combos/${editId}`, addForm);
        toast.success("Combo updated successfully");
      } else {
        await api.post("/api/admin/combos", addForm);
        toast.success("Combo added successfully");
      }
      setShowAddModal(false);
      fetchCombos();
    } catch (error: any) {
      const msg = error.response?.data?.message || (editId ? "Error updating combo" : "Error adding combo");
      toast.error(msg);
    } finally {
      setAddSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!comboToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/combos/${comboToDelete.combo_id}`);
      toast.success("Combo deleted successfully");
      fetchCombos();
    } catch {
      toast.error("Error deleting combo");
    } finally {
      setDeleting(false);
      setComboToDelete(null);
    }
  };

  const handleAddGroup = () => {
    const errors: Record<string, string> = {};
    if (!groupForm.group_id.trim()) errors.group_id = "Please enter dish group code";
    if (!groupForm.group_name.trim()) errors.group_name = "Please enter dish group name";
    setGroupErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAddForm(f => ({
      ...f,
      groups: [...f.groups, { group_name: groupForm.group_name, min_select: groupForm.min_select, max_select: groupForm.max_select, items: [] }]
    }));
    setShowGroupModal(false);
    setGroupForm({ group_id: "", group_name: "", min_select: 1, max_select: 1 });
    setGroupErrors({});
  };

  const filteredCombos = useMemo(() => {
    if (!globalSearch) return combos;
    const s = globalSearch.toLowerCase();
    return combos.filter(c => c.combo_name.toLowerCase().includes(s) || (c.categories?.category_name || "").toLowerCase().includes(s));
  }, [combos, globalSearch]);

  const totalPages = Math.ceil(filteredCombos.length / perPage) || 1;
  const paginatedData = filteredCombos.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">COMBOS MANAGEMENT</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: {combos.length} combos</span>
          <Button
            onClick={openAddModal}
            variant="outlinePrimary"
            size="small"
            shape="full"
            label="Add Combo"
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input type="text" placeholder="Search..." value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }} className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 outline-none focus:border-primary dark:border-dark-3" />
            <button type="button" className="flex items-center justify-center rounded-r-lg bg-indigo-500 px-4 py-3 text-white transition hover:bg-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark dark:text-white">Show:</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} className="rounded-lg border border-stroke bg-transparent py-2 pl-3 pr-8 outline-none focus:border-primary dark:border-dark-3">
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
            <table className="w-full text-left">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="rounded-tl-lg py-4 pl-4 pr-3 text-sm font-semibold uppercase tracking-wide">COMBO CODE</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">COMBO NAME</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wide">IMAGE</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">CATEGORY</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">PRICE (VND)</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wide">STATUS</th>
                  <th className="rounded-tr-lg py-4 pl-3 pr-4 text-center text-sm font-semibold uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No combos found</td></tr>
                ) : (
                  paginatedData.map((combo) => (
                    <tr key={combo.combo_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                      <td className="py-4 pl-4 pr-3 text-sm text-dark dark:text-white">CB-{combo.combo_id}</td>
                      <td className="px-4 py-4 font-medium text-dark dark:text-white">{combo.combo_name}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          {combo.image_combo ? (
                            <img src={getImageUrl(combo.image_combo)!} alt={combo.combo_name} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium dark:bg-dark-2">Empty</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{combo.categories?.category_name || "N/A"}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{combo.combo_price.toLocaleString("en-US")} đ</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={combo.is_active ? "outlineSuccess" : "outlineDanger"}>
                          {combo.is_active ? 'Selling' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="py-4 pl-3 pr-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Xem, Edit, Delete */}
                          <button type="button" onClick={() => setViewCombo(combo)} title="View details" className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" /></svg>
                          </button>
                          <button type="button" onClick={() => handleEdit(combo)} title="Edit" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                          </button>
                          <button type="button" onClick={() => setComboToDelete(combo)} title="Delete" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20">
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
            <div className="text-sm text-gray-500">Page {currentPage} / {totalPages}</div>
          </div>
        )}
      </div>

      {/* Modal View Detail */}
      <Modal isOpen={!!viewCombo} setIsOpen={(val) => !val && setViewCombo(null)} title="COMBO DETAILS" className="max-w-3xl">
        {viewCombo && (
          <div className="space-y-6">
            <div className="flex gap-5 rounded-xl border border-stroke bg-gray-50/50 p-5 dark:border-dark-3 dark:bg-dark-2/20">
              <div className="shrink-0">
                {viewCombo.image_combo ? (
                  <img src={getImageUrl(viewCombo.image_combo)!} alt={viewCombo.combo_name} className="h-28 w-28 rounded-2xl border border-stroke object-cover shadow-sm dark:border-dark-3" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-stroke bg-white text-gray-400 dark:border-dark-3 dark:bg-dark-2">No image</div>
                )}
              </div>
              <div className="flex flex-1 items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-dark dark:text-white">{viewCombo.combo_name}</h3>
                  <p className="mt-1 text-sm font-medium text-gray-500">{viewCombo.categories?.category_name}</p>
                  {viewCombo.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {viewCombo.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className="whitespace-nowrap text-xl font-black text-primary">{viewCombo.combo_price.toLocaleString("en-US")} đ</span>
                  <Badge variant={viewCombo.is_active ? "outlineSuccess" : "outlineDanger"} className="shadow-sm">
                    {viewCombo.is_active ? 'Selling' : 'Suspended'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Combo Options</h4>
              {viewCombo.groups.length > 0 ? (
                <div className="space-y-4">
                  {viewCombo.groups.map((g, index) => (
                    <div key={g.group_id} className="rounded-xl border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-gray-dark">
                      <div className="flex items-center gap-3 border-b border-stroke pb-3 dark:border-dark-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="font-semibold text-dark dark:text-white uppercase text-sm">{g.group_name}</p>
                        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                          <span>Min: <strong className="text-dark dark:text-white">{g.min_select}</strong></span>
                          <span>Max: <strong className="text-dark dark:text-white">{g.max_select}</strong></span>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {g.combo_items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-2 dark:border-dark-3 dark:bg-dark-2">
                            {item.dish_price?.dish?.image ? (
                              <img src={getImageUrl(item.dish_price.dish.image)!} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-gray-200 dark:bg-dark-3"></div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-dark dark:text-white">{item.dish_price?.dish?.dish_name || 'N/A'} {item.dish_price?.size?.size_name && `(Size ${item.dish_price.size.size_name})`}</p>
                            </div>
                            {item.price_extra ? (
                              <div className="text-xs font-medium text-amber-600">+ {item.price_extra.toLocaleString("en-US")} đ</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-gray-400">No options configured</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL THÊM / SỬA COMBO ── */}
      <Modal isOpen={showAddModal} setIsOpen={setShowAddModal} title={editId ? "EDIT COMBO CONFIGURATION" : "COMBO CONFIGURATION"} className="max-w-[1200px]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cột trái: Thông tin cơ bản */}
          <div className="lg:col-span-4 space-y-5 rounded-2xl border border-stroke bg-gray-50/30 p-5 dark:border-dark-3 dark:bg-dark-2/20">
            <h4 className="flex items-center gap-2 font-bold text-dark dark:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 text-primary"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
              Combo Information
            </h4>
            <InputGroup label="COMBO NAME (*)" type="text" placeholder="Enter combo name..." value={addForm.combo_name} handleChange={(e) => { setAddForm(f => ({ ...f, combo_name: e.target.value })); setAddErrors(p => ({ ...p, combo_name: "" })); }} error={addErrors.combo_name} />

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <InputGroup label="COMBO PRICE (*)" type="number" placeholder="0" value={addForm.combo_price || ""} handleChange={(e) => { setAddForm(f => ({ ...f, combo_price: Number(e.target.value) })); setAddErrors(p => ({ ...p, combo_price: "" })); }} error={addErrors.combo_price} />
              </div>
              <div className="pb-1 text-sm font-medium text-gray-500">VND</div>
            </div>

            <Select label="STATUS (*)" value={addForm.is_active ? "1" : "0"} onChange={(e) => setAddForm(f => ({ ...f, is_active: e.target.value === "1" }))} items={[{ value: "1", label: "Selling" }, { value: "0", label: "Suspended" }]} />
            <Select label="CATEGORY (*)" value={addForm.category_id ?? ""} onChange={(e) => { setAddForm(f => ({ ...f, category_id: e.target.value ? Number(e.target.value) : null })); setAddErrors(p => ({ ...p, category_id: "" })); }} items={categories.map(c => ({ value: c.category_id, label: c.category_name }))} placeholder="-- Select category --" error={addErrors.category_id} />

            <TextAreaGroup label="COMBO DESCRIPTION" placeholder="Enter combo description..." value={addForm.description} onChange={(e) => setAddForm(f => ({ ...f, description: e.target.value }))} />

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase text-dark dark:text-white">Combo Image</label>
              <div className={`relative flex items-center justify-center rounded-xl border border-dashed border-stroke bg-white text-center transition-colors hover:border-primary dark:border-dark-3 dark:bg-dark-3 ${addForm.image_combo ? "py-4" : "py-10"}`}>
                {addForm.image_combo ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={getImageUrl(addForm.image_combo)!} alt="Preview" className="h-32 w-32 rounded-xl object-cover shadow-sm border border-stroke" />
                    <div className="flex items-center gap-2">
                      <label className={`cursor-pointer text-sm font-medium text-primary hover:underline ${addUploading ? "pointer-events-none opacity-50" : ""}`}>
                        {addUploading ? "Loading..." : "Change image"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAddImageUpload} disabled={addUploading} />
                      </label>
                      <span className="text-gray-300">|</span>
                      <button type="button" onClick={() => setAddForm((f) => ({ ...f, image_combo: null }))} className="text-sm font-medium text-red-500 hover:underline">Delete image</button>
                    </div>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-4 cursor-pointer ${addUploading ? "pointer-events-none opacity-50" : ""}`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shadow-sm dark:bg-dark-2">
                      {addUploading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 text-gray-500"><path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03l2.955-3.129v8.614Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-500">{addUploading ? "Uploading image..." : "Drag & drop or click to upload image"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddImageUpload} disabled={addUploading} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Cấu hình nhóm món */}
          <div className="lg:col-span-8 space-y-4">
            {addForm.groups.map((g, gIdx) => (
              <div key={gIdx} className="rounded-xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
                {/* Group Header */}
                <div className="flex items-center gap-3 border-b border-stroke p-4 dark:border-dark-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {gIdx + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="ENTER NEW DISH GROUP NAME..."
                      className="w-full bg-transparent text-sm font-bold uppercase outline-none placeholder:text-gray-400 dark:text-white"
                      value={g.group_name}
                      onChange={(e) => {
                        const newG = [...addForm.groups]; newG[gIdx].group_name = e.target.value; setAddForm(f => ({ ...f, groups: newG }));
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>MIN:</span>
                      <input type="number" min={1} max={g.max_select} className="w-12 rounded border border-stroke px-2 py-1 text-center outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2" value={g.min_select} onChange={(e) => {
                        const newG = [...addForm.groups]; newG[gIdx].min_select = Math.min(newG[gIdx].max_select, Math.max(1, Number(e.target.value))); setAddForm(f => ({ ...f, groups: newG }));
                      }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>MAX:</span>
                      <input type="number" min={g.min_select} className="w-12 rounded border border-stroke px-2 py-1 text-center outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2" value={g.max_select} onChange={(e) => {
                        const newG = [...addForm.groups]; newG[gIdx].max_select = Math.max(newG[gIdx].min_select, Number(e.target.value)); setAddForm(f => ({ ...f, groups: newG }));
                      }} />
                    </div>
                    <button type="button" onClick={() => {
                      setPickerGroupIdx(null);
                      const newG = [...addForm.groups]; newG.splice(gIdx, 1); setAddForm(f => ({ ...f, groups: newG }));
                    }} className="ml-2 rounded-lg bg-gray-100 p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:bg-dark-2 dark:hover:bg-red-900/20">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                {/* Group Body */}
                <div className="p-4">
                  {g.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-stroke bg-gray-50/50 py-8 text-center dark:border-dark-3 dark:bg-dark-2/50">
                      <div className="mb-2 rounded-full bg-gray-200 p-3 text-gray-500 dark:bg-dark-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V4.25A2.25 2.25 0 0 0 15.75 2H4.25Zm4.03 6.28a.75.75 0 0 0-1.06-1.06L4.97 9.47a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 0 0 1.06-1.06L6.56 10l1.72-1.72Zm4.5-1.06a.75.75 0 1 0-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06l2.25-2.25a.75.75 0 0 0 0-1.06l-2.25-2.25Z" clipRule="evenodd" /></svg>
                      </div>
                      <p className="mb-3 text-sm text-gray-500">This group has no dishes selected.</p>
                      <button type="button" onClick={() => setPickerGroupIdx(gIdx)} className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3">+ Select dishes now</button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <span className="w-1/2">Dish name</span>
                        <span className="w-1/3 text-right">Extra price (VND)</span>
                        <span className="w-12 text-center">Delete</span>
                      </div>
                      <div className="space-y-3">
                        {g.items.map((item, iIdx) => {
                          const selectedDishOpt = dishOptions.find(o => o.value === item.dish_price_id);
                          return (
                            <div key={iIdx} className="flex items-center gap-4 border-b border-stroke pb-3 last:border-0 last:pb-0 dark:border-dark-3">
                              <div className="flex w-1/2 items-center gap-3">
                                {selectedDishOpt?.data.image ? (
                                  <img src={getImageUrl(selectedDishOpt.data.image)!} alt="" className="h-8 w-8 rounded object-cover" />
                                ) : (
                                  <div className="h-8 w-8 rounded bg-gray-200 dark:bg-dark-3"></div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-dark dark:text-white">{selectedDishOpt?.data.dish_name || 'Unselected'}</p>
                                  <p className="text-xs text-gray-400">{selectedDishOpt?.data.size || ''} {selectedDishOpt?.data.crust ? `- ${selectedDishOpt.data.crust}` : ''}</p>
                                </div>
                              </div>
                              <div className="flex w-1/3 justify-end">
                                <input type="number" placeholder="0" className="w-32 rounded-lg border border-stroke bg-transparent px-3 py-2 text-right text-sm outline-none focus:border-primary dark:border-dark-3" value={item.price_extra || ""} onChange={(e) => {
                                  const newG = [...addForm.groups]; newG[gIdx].items[iIdx].price_extra = Number(e.target.value); setAddForm(f => ({ ...f, groups: newG }));
                                }} />
                              </div>
                              <div className="flex w-12 justify-center">
                                <button type="button" onClick={() => {
                                  const newG = [...addForm.groups]; newG[gIdx].items.splice(iIdx, 1); setAddForm(f => ({ ...f, groups: newG }));
                                }} className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:bg-dark-3 dark:text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" /></svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button type="button" onClick={() => setPickerGroupIdx(gIdx)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-50/50 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-50 dark:bg-green-500/10 dark:text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                        SELECT DISHES FOR THIS GROUP
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={() => setShowGroupModal(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stroke bg-[#f8fafd] py-5 text-sm font-bold uppercase text-primary transition hover:border-primary hover:bg-primary/5 dark:border-dark-3 dark:bg-dark-2/50 dark:hover:border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
              ADD NEW DISH GROUP
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
          <Button onClick={() => setShowAddModal(false)} variant="outlineDark" label="Cancel without saving" shape="rounded" />
          <Button onClick={handleSaveCombo} variant="warning" label={addSaving ? "Saving..." : (editId ? "SAVE CHANGES" : "SAVE COMBO")} disabled={addSaving || addUploading} shape="rounded" className="font-bold uppercase" />
        </div>
      </Modal>

      {/* Modal Thêm nhóm món mới (nhỏ) */}
      <Modal isOpen={showGroupModal} setIsOpen={setShowGroupModal} title="ADD NEW DISH GROUP" className="max-w-md">
        <div className="space-y-4">
          <InputGroup label="DISH GROUP CODE (*)" type="text" placeholder="Enter dish group code" value={groupForm.group_id} handleChange={(e) => { setGroupForm(f => ({ ...f, group_id: e.target.value })); setGroupErrors(p => ({ ...p, group_id: "" })); }} error={groupErrors.group_id} />
          <InputGroup label="DISH GROUP NAME (*)" type="text" placeholder="Enter dish group name" value={groupForm.group_name} handleChange={(e) => { setGroupForm(f => ({ ...f, group_name: e.target.value })); setGroupErrors(p => ({ ...p, group_name: "" })); }} error={groupErrors.group_name} />
          <p className="text-xs italic text-gray-400">This name will be displayed directly to customers when selecting the combo.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-dark dark:text-white">MIN SELECTION</label>
              <div className="flex rounded-lg border border-stroke bg-white dark:border-dark-3 dark:bg-dark-2">
                <button type="button" onClick={() => setGroupForm(f => ({ ...f, min_select: Math.max(1, f.min_select - 1) }))} className="px-3 py-2 text-gray-500 hover:text-dark dark:hover:text-white">-</button>
                <input type="number" min={1} max={groupForm.max_select} value={groupForm.min_select} readOnly className="w-full bg-transparent text-center font-bold text-green-700 outline-none dark:text-green-500" />
                <button type="button" onClick={() => setGroupForm(f => ({ ...f, min_select: Math.min(f.max_select, f.min_select + 1) }))} className="px-3 py-2 text-gray-500 hover:text-dark dark:hover:text-white">+</button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-dark dark:text-white">MAX SELECTION</label>
              <div className="flex rounded-lg border border-stroke bg-white dark:border-dark-3 dark:bg-dark-2">
                <button type="button" onClick={() => setGroupForm(f => ({ ...f, max_select: Math.max(f.min_select, f.max_select - 1) }))} className="px-3 py-2 text-gray-500 hover:text-dark dark:hover:text-white">-</button>
                <input type="number" min={groupForm.min_select} value={groupForm.max_select} readOnly className="w-full bg-transparent text-center font-bold text-green-700 outline-none dark:text-green-500" />
                <button type="button" onClick={() => setGroupForm(f => ({ ...f, max_select: f.max_select + 1 }))} className="px-3 py-2 text-gray-500 hover:text-dark dark:hover:text-white">+</button>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50/50 p-4 text-sm text-blue-700 dark:bg-blue-900/10 dark:text-blue-400 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 mt-0.5 shrink-0"><path d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .572.729 6.016 6.016 0 0 0 2.856 0A.75.75 0 0 0 12 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM8.863 17.414a.75.75 0 0 0-.226 1.483 9.066 9.066 0 0 0 2.726 0 .75.75 0 0 0-.226-1.483 7.553 7.553 0 0 1-2.274 0Z" /></svg>
            <p><strong>Tip:</strong> Nếu muốn khách <strong>must select exactly 1 item</strong>, set both Min and Max to 1.</p>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button onClick={() => setShowGroupModal(false)} variant="outlineDark" label="Cancel" shape="rounded" />
            <Button onClick={handleAddGroup} variant="success" label="CREATE DISH GROUP" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>} shape="rounded" />
          </div>
        </div>
      </Modal>

      {/* ── DISH PICKER MODAL ── */}
      <DishPicker
        isOpen={pickerGroupIdx !== null}
        onClose={() => setPickerGroupIdx(null)}
        dishOptions={dishOptions}
        alreadySelected={pickerGroupIdx !== null ? addForm.groups[pickerGroupIdx]?.items.map(i => i.dish_price_id) || [] : []}
        onConfirm={handlePickerConfirm}
        getImageUrl={getImageUrl}
        categories={categories}
        sizes={allSizes}
        crusts={allCrusts}
      />

      {/* ── MODAL XÓA ── */}
      <Modal isOpen={!!comboToDelete} setIsOpen={(val) => !val && setComboToDelete(null)} className="relative max-w-[400px] p-8">
        {comboToDelete && (
          <div className="flex flex-col items-center text-center">
            <button type="button" onClick={() => setComboToDelete(null)} className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-gray-400 text-white transition hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#d34053] dark:bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">Delete Combo</h3>
            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <span className="font-semibold text-dark dark:text-white">"{comboToDelete.combo_name}"</span>? This action cannot be undone.
            </p>
            <div className="flex w-full gap-4">
              <button type="button" onClick={() => setComboToDelete(null)} className="flex-1 rounded-xl bg-gray-100 py-3 font-medium text-dark transition hover:bg-gray-200 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="flex-1 rounded-xl bg-[#d34053] py-3 font-medium text-white transition hover:bg-[#ba3849] disabled:opacity-70">
                {deleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
