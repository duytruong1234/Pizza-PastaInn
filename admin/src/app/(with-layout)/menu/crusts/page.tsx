"use client";
import { api } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui-elements/button";
import { Modal } from "@/components/ui/modal";
import InputGroup from "@/components/FormElements/InputGroup";
import { Switch } from "@/components/FormElements/switch";
import { toast } from "sonner";

interface Crust { crust_id: number; crust_name: string; is_visible: boolean }

export default function CrustsPage() {
  const [crusts, setCrusts] = useState<Crust[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [editingCrust, setEditingCrust] = useState<Crust | null>(null);
  const [deletingCrust, setDeletingCrust] = useState<Crust | null>(null);

  // Forms
  const [addForm, setAddForm] = useState({ crust_name: "", is_visible: true });

  const fetchData = () => {
    setLoading(true);
    api.get("/api/admin/crusts")
      .then((res) => setCrusts(res.data.data))
      .catch(() => setCrusts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let result = [...crusts];
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter(x => x.crust_name.toLowerCase().includes(s));
    }
    return result;
  }, [crusts, globalSearch]);

  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleAdd = async () => {
    if (!addForm.crust_name.trim()) return toast.error("Vui lòng nhập tên đế bánh");
    try {
      await api.post("/api/admin/crusts", addForm);
      toast.success("Thêm đế bánh thành công");
      setAddForm({ crust_name: "", is_visible: true });
      setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Lỗi khi thêm");
    }
  };

  const handleEdit = async () => {
    if (!editingCrust?.crust_name.trim()) return toast.error("Vui lòng nhập tên đế bánh");
    try {
      await api.put(`/api/admin/crusts/${editingCrust.crust_id}`, {
        crust_name: editingCrust.crust_name,
        is_visible: editingCrust.is_visible
      });
      toast.success("Cập nhật thành công");
      setEditingCrust(null);
      fetchData();
    } catch {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!deletingCrust) return;
    try {
      await api.delete(`/api/admin/crusts/${deletingCrust.crust_id}`);
      toast.success("Xóa thành công");
      setDeletingCrust(null);
      fetchData();
    } catch {
      toast.error("Lỗi khi xóa");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Quản lý đế bánh</h1>
        <Button
          onClick={() => setShowAdd(true)}
          variant="outlinePrimary"
          size="small"
          shape="full"
          label="Thêm đế bánh"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>}
        />
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark dark:text-white">Per Page:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded-lg border border-stroke bg-transparent py-2 pl-3 pr-8 outline-none focus:border-primary dark:border-dark-3"
            >
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
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Tên đế bánh</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">Trạng thái</th>
                <th className="rounded-tr-lg px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : paginatedData.map(c => (
                <tr key={c.crust_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                  <td className="px-6 py-4 text-dark dark:text-white">{c.crust_id}</td>
                  <td className="px-6 py-4 font-medium text-dark dark:text-white">{c.crust_name}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={c.is_visible ? "outlineSuccess" : "outlineDanger"}>
                      {c.is_visible ? "Đang bán" : "Ngừng bán"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingCrust(c)} title="Sửa" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                      </button>
                      <button onClick={() => setDeletingCrust(c)} title="Xóa" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20">
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
              Showing {currentPage} of {totalPages} pages
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      <Modal isOpen={showAdd} setIsOpen={setShowAdd} title="Thêm Đế bánh">
        <div className="space-y-4 p-2">
          <InputGroup label="Tên đế bánh" type="text" placeholder="Ví dụ: Đế dày..." value={addForm.crust_name} handleChange={(e) => setAddForm(prev => ({ ...prev, crust_name: e.target.value }))} />
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-dark dark:text-white">Hiển thị (Đang bán)</label>
            <Switch checked={addForm.is_visible} onChange={(checked) => setAddForm(prev => ({ ...prev, is_visible: checked }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setShowAdd(false)} variant="outlineDark" label="Hủy" shape="rounded" />
            <Button onClick={handleAdd} variant="primary" label="Thêm mới" shape="rounded" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingCrust} setIsOpen={() => setEditingCrust(null)} title="Sửa Đế bánh">
        <div className="space-y-4 p-2">
          <InputGroup label="Tên đế bánh" type="text" value={editingCrust?.crust_name || ""} handleChange={(e) => setEditingCrust(prev => prev ? { ...prev, crust_name: e.target.value } : null)} />
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-dark dark:text-white">Hiển thị (Đang bán)</label>
            <Switch checked={editingCrust?.is_visible || false} onChange={(checked) => setEditingCrust(prev => prev ? { ...prev, is_visible: checked } : null)} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setEditingCrust(null)} variant="outlineDark" label="Hủy" shape="rounded" />
            <Button onClick={handleEdit} variant="primary" label="Lưu thay đổi" shape="rounded" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingCrust} setIsOpen={() => setDeletingCrust(null)} title="Xóa Đế bánh">
        <div className="p-2">
          <p className="mb-6 text-gray-500">Bạn có chắc chắn muốn xóa đế bánh <strong>{deletingCrust?.crust_name}</strong>? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setDeletingCrust(null)} variant="outlineDark" label="Hủy" shape="rounded" />
            <Button onClick={handleDelete} variant="danger" label="Xóa ngay" shape="rounded" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
