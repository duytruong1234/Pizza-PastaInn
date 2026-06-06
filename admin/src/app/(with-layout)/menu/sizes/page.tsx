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

interface Size { size_id: number; size_name: string; is_visible: boolean }

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [deletingSize, setDeletingSize] = useState<Size | null>(null);

  // Forms
  const [addForm, setAddForm] = useState({ size_name: "", is_visible: true });
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");

  const fetchData = () => {
    setLoading(true);
    api.get("/api/admin/sizes")
      .then((res) => setSizes(res.data.data))
      .catch(() => setSizes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let result = [...sizes];
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter(x => x.size_name.toLowerCase().includes(s));
    }
    return result;
  }, [sizes, globalSearch]);

  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleAdd = async () => {
    if (!addForm.size_name.trim()) {
      setAddError("Please enter size name");
      return;
    }
    setAddError("");
    try {
      await api.post("/api/admin/sizes", addForm);
      toast.success("Size added successfully");
      setAddForm({ size_name: "", is_visible: true });
      setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Error adding size");
    }
  };

  const handleEdit = async () => {
    if (!editingSize?.size_name.trim()) {
      setEditError("Please enter size name");
      return;
    }
    setEditError("");
    try {
      await api.put(`/api/admin/sizes/${editingSize.size_id}`, {
        size_name: editingSize.size_name,
        is_visible: editingSize.is_visible
      });
      toast.success("Updated successfully");
      setEditingSize(null);
      fetchData();
    } catch {
      toast.error("Error updating size");
    }
  };

  const handleDelete = async () => {
    if (!deletingSize) return;
    try {
      await api.delete(`/api/admin/sizes/${deletingSize.size_id}`);
      toast.success("Deleted successfully");
      setDeletingSize(null);
      fetchData();
    } catch {
      toast.error("Error deleting size");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">SIZES MANAGEMENT</h1>
        <Button
          onClick={() => setShowAdd(true)}
          variant="outlinePrimary"
          size="small"
          shape="full"
          label="Add Size"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>}
        />
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input
              type="text"
              placeholder="Search..."
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
            <span className="text-sm font-medium text-dark dark:text-white">Show:</span>
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
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Size Name</th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">Status</th>
                <th className="rounded-tr-lg px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No data available</td></tr>
              ) : paginatedData.map(s => (
                <tr key={s.size_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                  <td className="px-6 py-4 text-dark dark:text-white">{s.size_id}</td>
                  <td className="px-6 py-4 font-medium text-dark dark:text-white">{s.size_name}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={s.is_visible ? "outlineSuccess" : "outlineDanger"}>
                      {s.is_visible ? "Visible" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingSize(s)} title="Edit" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                      </button>
                      <button onClick={() => setDeletingSize(s)} title="Delete" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20">
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
              Page {currentPage} / {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      <Modal isOpen={showAdd} setIsOpen={setShowAdd} title="ADD SIZE">
        <div className="space-y-4 p-2">
          <InputGroup label="SIZE NAME (*)" type="text" placeholder="Enter size name" value={addForm.size_name} handleChange={(e) => { setAddForm(prev => ({ ...prev, size_name: e.target.value })); setAddError(""); }} error={addError} />
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-dark dark:text-white">VISIBLE</label>
            <Switch checked={addForm.is_visible} onChange={(checked) => setAddForm(prev => ({ ...prev, is_visible: checked }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setShowAdd(false)} variant="outlineDark" label="Cancel" shape="rounded" />
            <Button onClick={handleAdd} variant="primary" label="Add New" shape="rounded" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingSize} setIsOpen={() => setEditingSize(null)} title="EDIT SIZE">
        <div className="space-y-4 p-2">
          <InputGroup label="SIZE NAME (*)" type="text" placeholder="Enter size name" value={editingSize?.size_name || ""} handleChange={(e) => { setEditingSize(prev => prev ? { ...prev, size_name: e.target.value } : null); setEditError(""); }} error={editError} />
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-dark dark:text-white">VISIBLE</label>
            <Switch checked={editingSize?.is_visible || false} onChange={(checked) => setEditingSize(prev => prev ? { ...prev, is_visible: checked } : null)} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setEditingSize(null)} variant="outlineDark" label="Cancel" shape="rounded" />
            <Button onClick={handleEdit} variant="primary" label="Save Changes" shape="rounded" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingSize} setIsOpen={() => setDeletingSize(null)} title="DELETE SIZE">
        <div className="p-2">
          <p className="mb-6 text-gray-500">Are you sure you want to delete size <strong>{deletingSize?.size_name}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setDeletingSize(null)} variant="outlineDark" label="Cancel" shape="rounded" />
            <Button onClick={handleDelete} variant="danger" label="Delete" shape="rounded" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
