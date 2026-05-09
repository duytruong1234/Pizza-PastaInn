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

interface Combo {
  combo_id: number; combo_name: string; combo_price: number;
  description: string | null; is_active: boolean;
  categories?: { category_name: string };
  groups: Array<{
    group_id: string; group_name: string;
    combo_items: Array<{ dish_price?: { dish?: { dish_name: string } } }>;
  }>;
}

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewCombo, setViewCombo] = useState<Combo | null>(null);

  const [categories, setCategories] = useState<{category_id: number; category_name: string}[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);

  // Add Combo States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    combo_name: "",
    combo_price: 0,
    description: "",
    is_active: true,
    category_id: null as number | null,
    groups: [] as Array<{
      group_name: string;
      min_select: number;
      max_select: number;
      items: Array<{ dish_price_id: string; price_extra: number }>;
    }>
  });

  const fetchCombos = () => {
    setLoading(true);
    api.get("/api/admin/combos").then(r => setCombos(r.data.data)).catch(() => setCombos([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCombos();
    api.get("/api/admin/categories").then(r => setCategories(r.data.data)).catch(() => {});
    api.get("/api/admin/dishes").then(r => setDishes(r.data.data)).catch(() => {});
  }, []);

  const dishOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    dishes.forEach((dish) => {
      if (dish.prices && dish.prices.length > 0) {
        dish.prices.forEach((price: any) => {
          options.push({
            value: price.dish_price_id,
            label: `${dish.dish_name} (${price.size?.size_name || 'Mặc định'} - ${price.crust?.crust_name || 'Mặc định'})`
          });
        });
      }
    });
    return options;
  }, [dishes]);

  const handleAddCombo = async () => {
    if (!addForm.combo_name.trim()) return toast.error("Vui lòng nhập tên combo");
    if (addForm.combo_price <= 0) return toast.error("Giá combo phải lớn hơn 0");

    setAddSaving(true);
    try {
      await api.post("/api/admin/combos", addForm);
      toast.success("Thêm combo thành công");
      setShowAddModal(false);
      setAddForm({
        combo_name: "", combo_price: 0, description: "", is_active: true, category_id: null, groups: []
      });
      fetchCombos();
    } catch {
      toast.error("Lỗi khi thêm combo");
    } finally {
      setAddSaving(false);
    }
  };

  const filteredCombos = useMemo(() => {
    if (!globalSearch) return combos;
    const s = globalSearch.toLowerCase();
    return combos.filter(c => c.combo_name.toLowerCase().includes(s) || (c.categories?.category_name || "").toLowerCase().includes(s));
  }, [combos, globalSearch]);

  const totalPages = Math.ceil(filteredCombos.length / perPage) || 1;
  const paginatedData = filteredCombos.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Quản lý Combo</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Tổng: {combos.length} combo</span>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outlinePrimary"
            size="small"
            shape="full"
            label="Thêm Combo"
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

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="rounded-tl-lg py-4 pl-4 pr-3 text-sm font-semibold uppercase tracking-wide">Mã Combo</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Tên Combo</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Danh mục</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Giá (VNĐ)</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold uppercase tracking-wide">Trạng thái</th>
                  <th className="rounded-tr-lg py-4 pl-3 pr-4 text-center text-sm font-semibold uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Không tìm thấy combo nào</td></tr>
                ) : (
                  paginatedData.map((combo) => (
                    <tr key={combo.combo_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                      <td className="py-4 pl-4 pr-3 text-sm text-dark dark:text-white">CB-{combo.combo_id}</td>
                      <td className="px-4 py-4 font-medium text-dark dark:text-white">{combo.combo_name}</td>
                      <td className="px-4 py-4 text-sm">{combo.categories?.category_name || "N/A"}</td>
                      <td className="px-4 py-4 text-sm font-medium text-primary">{combo.combo_price.toLocaleString("vi-VN")} đ</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={combo.is_active ? "success" : "danger"}>
                          {combo.is_active ? 'Đang bán' : 'Ngưng'}
                        </Badge>
                      </td>
                      <td className="py-4 pl-3 pr-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewCombo(combo)} title="Xem chi tiết" className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" /></svg>
                          </button>
                          <button title="Sửa" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                          </button>
                          <button title="Xóa" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20">
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

      {/* Modal View Detail */}
      <Modal isOpen={!!viewCombo} setIsOpen={(val) => !val && setViewCombo(null)} title="Chi tiết Combo" className="max-w-2xl">
        {viewCombo && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between rounded-xl border border-stroke bg-gray-50/50 p-5 dark:border-dark-3 dark:bg-dark-2/20">
              <div>
                <h3 className="text-xl font-bold text-dark dark:text-white">{viewCombo.combo_name}</h3>
                <p className="mt-1 text-sm font-medium text-gray-500">{viewCombo.categories?.category_name}</p>
                {viewCombo.description && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {viewCombo.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <span className="text-xl font-black text-primary">{viewCombo.combo_price.toLocaleString("vi-VN")} đ</span>
                <Badge variant={viewCombo.is_active ? "success" : "danger"} className="shadow-sm">
                  {viewCombo.is_active ? 'Đang bán' : 'Ngưng bán'}
                </Badge>
              </div>
            </div>

            {/* Content options */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Các tùy chọn trong Combo</h4>
              {viewCombo.groups.length > 0 ? (
                <div className="space-y-4">
                  {viewCombo.groups.map((g, index) => (
                    <div key={g.group_id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-dark dark:text-white">{g.group_name}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {g.combo_items.map((item, i) => (
                            <span key={i} className="inline-flex items-center rounded-lg border border-stroke bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-dark-3 dark:bg-dark-2 dark:text-gray-300">
                              {item.dish_price?.dish?.dish_name || 'N/A'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-gray-400">Chưa cấu hình tùy chọn</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL THÊM COMBO ── */}
      <Modal isOpen={showAddModal} setIsOpen={setShowAddModal} title="Thêm Combo mới" className="max-w-4xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Tên Combo" type="text" placeholder="Nhập tên combo..." value={addForm.combo_name} handleChange={(e) => setAddForm(f => ({ ...f, combo_name: e.target.value }))} />
            <InputGroup label="Giá Combo (VNĐ)" type="number" placeholder="0" value={addForm.combo_price || ""} handleChange={(e) => setAddForm(f => ({ ...f, combo_price: Number(e.target.value) }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Danh mục" value={addForm.category_id ?? ""} onChange={(e) => setAddForm(f => ({ ...f, category_id: e.target.value ? Number(e.target.value) : null }))} items={categories.map(c => ({ value: c.category_id, label: c.category_name }))} placeholder="-- Chọn danh mục --" />
            <Select label="Trạng thái" value={addForm.is_active ? "1" : "0"} onChange={(e) => setAddForm(f => ({ ...f, is_active: e.target.value === "1" }))} items={[{ value: "1", label: "Đang bán" }, { value: "0", label: "Ngừng bán" }]} />
          </div>

          <TextAreaGroup label="Mô tả" placeholder="Nhập mô tả combo..." value={addForm.description} onChange={(e) => setAddForm(f => ({ ...f, description: e.target.value }))} />

          {/* Groups Builder */}
          <div className="rounded-xl border border-stroke bg-gray-50/50 p-5 dark:border-dark-3 dark:bg-dark-2/50">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-dark dark:text-white">Cấu hình tùy chọn món ăn</h4>
              <button onClick={() => setAddForm(f => ({ ...f, groups: [...f.groups, { group_name: "", min_select: 1, max_select: 1, items: [] }] }))} className="text-sm font-medium text-primary hover:underline">+ Thêm nhóm tùy chọn</button>
            </div>

            {addForm.groups.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">Chưa có nhóm tùy chọn nào.</p>
            ) : (
              <div className="space-y-6">
                {addForm.groups.map((g, gIdx) => (
                  <div key={gIdx} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
                    <div className="mb-4 flex gap-4">
                      <div className="flex-1">
                        <InputGroup label={`Tên nhóm (VD: Chọn 1 Pizza)`} type="text" value={g.group_name} handleChange={(e) => {
                          const newG = [...addForm.groups]; newG[gIdx].group_name = e.target.value; setAddForm(f => ({ ...f, groups: newG }));
                        }} />
                      </div>
                      <div className="w-24">
                        <InputGroup label="Min chọn" type="number" value={g.min_select} handleChange={(e) => {
                          const newG = [...addForm.groups]; newG[gIdx].min_select = Number(e.target.value); setAddForm(f => ({ ...f, groups: newG }));
                        }} />
                      </div>
                      <div className="w-24">
                        <InputGroup label="Max chọn" type="number" value={g.max_select} handleChange={(e) => {
                          const newG = [...addForm.groups]; newG[gIdx].max_select = Number(e.target.value); setAddForm(f => ({ ...f, groups: newG }));
                        }} />
                      </div>
                      <div className="flex items-end pb-1">
                        <button onClick={() => {
                          const newG = [...addForm.groups]; newG.splice(gIdx, 1); setAddForm(f => ({ ...f, groups: newG }));
                        }} className="text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="ml-4 space-y-2 border-l-2 border-gray-100 pl-4 dark:border-dark-3">
                      {g.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex gap-4">
                          <div className="flex-1">
                            <Select label="" value={item.dish_price_id} onChange={(e) => {
                              const newG = [...addForm.groups]; newG[gIdx].items[iIdx].dish_price_id = e.target.value; setAddForm(f => ({ ...f, groups: newG }));
                            }} items={dishOptions} placeholder="-- Chọn món ăn --" />
                          </div>
                          <div className="w-32">
                            <InputGroup label="" type="number" placeholder="Phụ thu" value={item.price_extra || ""} handleChange={(e) => {
                              const newG = [...addForm.groups]; newG[gIdx].items[iIdx].price_extra = Number(e.target.value); setAddForm(f => ({ ...f, groups: newG }));
                            }} />
                          </div>
                          <button onClick={() => {
                            const newG = [...addForm.groups]; newG[gIdx].items.splice(iIdx, 1); setAddForm(f => ({ ...f, groups: newG }));
                          }} className="mt-1 text-gray-400 hover:text-red-500">✕</button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const newG = [...addForm.groups]; newG[gIdx].items.push({ dish_price_id: "", price_extra: 0 }); setAddForm(f => ({ ...f, groups: newG }));
                      }} className="text-xs font-medium text-blue-500 hover:underline">+ Thêm món vào nhóm</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowAddModal(false)} variant="outlineDark" label="Hủy" />
            <Button onClick={handleAddCombo} variant="primary" label={addSaving ? "Đang lưu..." : "Lưu Combo"} disabled={addSaving} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
