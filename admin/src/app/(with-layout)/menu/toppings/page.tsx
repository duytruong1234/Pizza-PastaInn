// Trang quản lý topping
"use client";
import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui-elements/button";
import { Modal } from "@/components/ui/modal";
import InputGroup from "@/components/FormElements/InputGroup";
import { Switch } from "@/components/FormElements/switch";
import { Select } from "@/components/FormElements/select";
import { toast } from "sonner";

interface Topping {
  topping_id: number; topping_name: string; price_topping: number;
  is_for_pizza: boolean; is_for_spaghetti: boolean;
  size_id?: number | null;
  sizes?: { size_name: string };
}

interface Size { size_id: number; size_name: string; }

export default function ToppingsPage() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [sizes, setSizes] = useState<Size[]>([]);

  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Add Modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    topping_name: "", price_topping: 0,
    is_for_pizza: true, is_for_spaghetti: false,
    size_id: null as number | null,
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<Record<string, string>>({});

  // Edit Modal
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [editForm, setEditForm] = useState({
    topping_name: "", price_topping: 0,
    is_for_pizza: true, is_for_spaghetti: false,
    size_id: null as number | null,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<Record<string, string>>({});

  // Delete Modal
  const [deletingTopping, setDeletingTopping] = useState<Topping | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.get("/api/admin/toppings").then(r => setToppings(r.data.data)).catch(() => setToppings([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get("/api/admin/sizes").then(r => setSizes(r.data.data)).catch(() => {});
  }, []);

  const filteredToppings = useMemo(() => {
    let result = [...toppings];
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter(x => x.topping_name.toLowerCase().includes(s));
    }
    return result;
  }, [toppings, globalSearch]);

  const totalPages = Math.ceil(filteredToppings.length / perPage) || 1;
  const paginatedData = filteredToppings.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Add handler
  const handleAdd = async () => {
    const errors: Record<string, string> = {};
    if (!addForm.topping_name.trim()) errors.topping_name = "Vui lòng nhập tên topping";
    if (!addForm.price_topping || addForm.price_topping <= 0) errors.price_topping = "Vui lòng nhập giá topping";
    if (!addForm.size_id) errors.size_id = "Vui lòng chọn kích thước";
    setAddError(errors);
    if (Object.keys(errors).length > 0) return;
    if (!addForm.is_for_pizza && !addForm.is_for_spaghetti) return toast.error("Vui lòng chọn ít nhất một trạng thái sử dụng (Dùng cho Pizza hoặc Mỳ Ý)");
    setAddSaving(true);
    try {
      await api.post("/api/admin/toppings", addForm);
      toast.success("Thêm topping thành công");
      setAddForm({ topping_name: "", price_topping: 0, is_for_pizza: true, is_for_spaghetti: false, size_id: null });
      setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Lỗi khi thêm topping");
    } finally {
      setAddSaving(false);
    }
  };

  // Edit handler
  const openEdit = (t: Topping) => {
    setEditingTopping(t);
    setEditForm({
      topping_name: t.topping_name,
      price_topping: t.price_topping,
      is_for_pizza: t.is_for_pizza,
      is_for_spaghetti: t.is_for_spaghetti,
      size_id: t.size_id ?? null,
    });
    setEditError({});
  };

  const handleEdit = async () => {
    if (!editingTopping) return;
    const errors: Record<string, string> = {};
    if (!editForm.topping_name.trim()) errors.topping_name = "Vui lòng nhập tên topping";
    if (!editForm.price_topping || editForm.price_topping <= 0) errors.price_topping = "Vui lòng nhập giá topping";
    if (!editForm.size_id) errors.size_id = "Vui lòng chọn kích thước";
    setEditError(errors);
    if (Object.keys(errors).length > 0) return;
    if (!editForm.is_for_pizza && !editForm.is_for_spaghetti) return toast.error("Vui lòng chọn ít nhất một trạng thái sử dụng (Dùng cho Pizza hoặc Mỳ Ý)");
    setEditSaving(true);
    try {
      await api.put(`/api/admin/toppings/${editingTopping.topping_id}`, editForm);
      toast.success("Cập nhật topping thành công");
      setEditingTopping(null);
      fetchData();
    } catch {
      toast.error("Lỗi khi cập nhật topping");
    } finally {
      setEditSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deletingTopping) return;
    try {
      await api.delete(`/api/admin/toppings/${deletingTopping.topping_id}`);
      toast.success("Xóa topping thành công");
      setDeletingTopping(null);
      fetchData();
    } catch {
      toast.error("Lỗi khi xóa topping");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">QUẢN LÝ TOPPING</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Tổng cộng: {toppings.length} topping</span>
          <Button
            onClick={() => setShowAdd(true)}
            variant="outlinePrimary"
            size="small"
            shape="full"
            label="Thêm topping"
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input type="text" placeholder="Tìm kiếm..." value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }} className="w-full rounded-l-lg border border-r-0 border-stroke bg-transparent py-2.5 pl-4 pr-3 outline-none focus:border-primary dark:border-dark-3" />
            <button className="flex items-center justify-center rounded-r-lg bg-indigo-500 px-4 py-3 text-white transition hover:bg-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark dark:text-white">Hiển thị:</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} className="rounded-lg border border-stroke bg-transparent py-2 pl-3 pr-8 outline-none focus:border-primary dark:border-dark-3">
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-primary text-white">
              <tr>
                <th className="rounded-tl-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide">ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">TÊN TOPPING</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">GIÁ (đ)</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">SIZE</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">DÙNG CHO PIZZA</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">DÙNG CHO MỲ Ý, GRATIN, RISOTTO</th>
                <th className="rounded-tr-lg px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : paginatedData.map(t => (
                <tr key={t.topping_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                  <td className="px-6 py-4 text-dark dark:text-white">{t.topping_id}</td>
                  <td className="px-6 py-4 font-medium text-dark dark:text-white">{t.topping_name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">{(t.price_topping || 0).toLocaleString("en-US")} đ</td>
                  <td className="px-6 py-4 text-sm">{t.sizes?.size_name || 'Tất cả'}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={t.is_for_pizza ? "outlineSuccess" : "outlineDanger"}>
                      {t.is_for_pizza ? "Có" : "Không"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={t.is_for_spaghetti ? "outlineSuccess" : "outlineDanger"}>
                      {t.is_for_spaghetti ? "Có" : "Không"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(t)} title="Sửa" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                      </button>
                      <button onClick={() => setDeletingTopping(t)} title="Xóa" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* ── MODAL THÊM TOPPING ── */}
      <Modal isOpen={showAdd} setIsOpen={setShowAdd} title="THÊM TOPPING MỚI">
        <div className="space-y-5 p-2">
          <InputGroup label="TÊN TOPPING (*)" type="text" placeholder="Nhập tên topping..." value={addForm.topping_name} handleChange={(e) => { setAddForm(prev => ({ ...prev, topping_name: e.target.value })); setAddError(p => ({ ...p, topping_name: "" })); }} error={addError.topping_name} />
          <InputGroup label="GIÁ TOPPING (đ) (*)" type="number" placeholder="0" value={addForm.price_topping || ""} handleChange={(e) => { setAddForm(prev => ({ ...prev, price_topping: Number(e.target.value) })); setAddError(p => ({ ...p, price_topping: "" })); }} error={addError.price_topping} />
          <Select label="KÍCH THƯỚC ÁP DỤNG (*)" value={addForm.size_id ?? ""} onChange={(e) => { setAddForm(prev => ({ ...prev, size_id: e.target.value ? Number(e.target.value) : null })); setAddError(p => ({ ...p, size_id: "" })); }} items={sizes.map(s => ({ value: s.size_id, label: s.size_name }))} placeholder="-- Tất cả kích thước --" error={addError.size_id} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-stroke p-3 dark:border-dark-3">
              <label className="text-sm font-semibold text-dark dark:text-white">Dùng cho Pizza</label>
              <Switch checked={addForm.is_for_pizza} onChange={(checked) => setAddForm(prev => ({ ...prev, is_for_pizza: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-stroke p-3 dark:border-dark-3">
              <label className="text-sm font-semibold text-dark dark:text-white">Dùng cho Mỳ Ý, Gratin, Risotto</label>
              <Switch checked={addForm.is_for_spaghetti} onChange={(checked) => setAddForm(prev => ({ ...prev, is_for_spaghetti: checked }))} />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <Button onClick={() => setShowAdd(false)} variant="outlineDark" label="Hủy bỏ" shape="rounded" />
            <Button onClick={handleAdd} variant="primary" label={addSaving ? "Đang lưu..." : "Thêm mới"} disabled={addSaving} shape="rounded" />
          </div>
        </div>
      </Modal>

      {/* ── MODAL SỬA TOPPING ── */}
      <Modal isOpen={!!editingTopping} setIsOpen={() => setEditingTopping(null)} title="SỬA TOPPING">
        <div className="space-y-5 p-2">
          <InputGroup label="TÊN TOPPING (*)" type="text" placeholder="Nhập tên topping..." value={editForm.topping_name} handleChange={(e) => { setEditForm(prev => ({ ...prev, topping_name: e.target.value })); setEditError(p => ({ ...p, topping_name: "" })); }} error={editError.topping_name} />
          <InputGroup label="GIÁ TOPPING (đ) (*)" type="number" placeholder="0" value={editForm.price_topping || ""} handleChange={(e) => { setEditForm(prev => ({ ...prev, price_topping: Number(e.target.value) })); setEditError(p => ({ ...p, price_topping: "" })); }} error={editError.price_topping} />
          <Select label="KÍCH THƯỚC ÁP DỤNG (*)" value={editForm.size_id ?? ""} onChange={(e) => { setEditForm(prev => ({ ...prev, size_id: e.target.value ? Number(e.target.value) : null })); setEditError(p => ({ ...p, size_id: "" })); }} items={sizes.map(s => ({ value: s.size_id, label: s.size_name }))} placeholder="-- Tất cả kích thước --" error={editError.size_id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-stroke p-3 dark:border-dark-3">
              <label className="text-sm font-semibold text-dark dark:text-white">Dùng cho Pizza</label>
              <Switch checked={editForm.is_for_pizza} onChange={(checked) => setEditForm(prev => ({ ...prev, is_for_pizza: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-stroke p-3 dark:border-dark-3">
              <label className="text-sm font-semibold text-dark dark:text-white">Dùng cho Mỳ Ý, Gratin, Risotto</label>
              <Switch checked={editForm.is_for_spaghetti} onChange={(checked) => setEditForm(prev => ({ ...prev, is_for_spaghetti: checked }))} />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
            <Button onClick={() => setEditingTopping(null)} variant="outlineDark" label="Hủy bỏ" shape="rounded" />
            <Button onClick={handleEdit} variant="primary" label={editSaving ? "Đang lưu..." : "Lưu thay đổi"} disabled={editSaving} shape="rounded" />
          </div>
        </div>
      </Modal>

      {/* ── MODAL XÓA TOPPING ── */}
      <Modal isOpen={!!deletingTopping} setIsOpen={() => setDeletingTopping(null)} className="relative max-w-[400px] p-8">
        {deletingTopping && (
          <div className="flex flex-col items-center text-center">
            <button type="button" onClick={() => setDeletingTopping(null)} className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-gray-400 text-white transition hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#d34053] dark:bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">Xóa Topping</h3>
            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              Bạn có chắc chắn muốn xóa <span className="font-semibold text-dark dark:text-white">"{deletingTopping.topping_name}"</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex w-full gap-4">
              <button type="button" onClick={() => setDeletingTopping(null)} className="flex-1 rounded-xl bg-gray-100 py-3 font-medium text-dark transition hover:bg-gray-200 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4">Hủy</button>
              <button type="button" onClick={handleDelete} className="flex-1 rounded-xl bg-[#d34053] py-3 font-medium text-white transition hover:bg-[#ba3849]">Xác nhận</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
