// Trang quản lý chi nhánh — CRUD đầy đủ + Chọn địa chỉ theo Tỉnh/Quận/Phường
"use client";

import { api } from "@/lib/api";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui-elements/button";
import { Modal } from "@/components/ui/modal";
import InputGroup from "@/components/FormElements/InputGroup";
import { Switch } from "@/components/FormElements/switch";
import { Pagination } from "@/components/ui/pagination";
import AddressPickerVN from "@/components/FormElements/AddressPickerVN";
import { toast } from "sonner";

interface Store {
  store_id: number;
  store_name: string;
  address: string | null;
  hotline: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

interface StoreForm {
  store_name: string;
  address: string;
  hotline: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
}

const emptyForm: StoreForm = { store_name: "", address: "", hotline: "", latitude: "", longitude: "", is_active: true };

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);

  // Form states
  const [addForm, setAddForm] = useState<StoreForm>({ ...emptyForm });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<StoreForm>({ ...emptyForm });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Key để force remount AddressPickerVN khi mở modal mới
  const [addAddressKey, setAddAddressKey] = useState(0);
  const [editAddressKey, setEditAddressKey] = useState(0);

  const fetchData = () => {
    setLoading(true);
    api.get("/api/admin/stores")
      .then((res) => setStores(res.data.data))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Pagination
  const filteredData = useMemo(() => {
    let result = [...stores];
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter(
        (x) =>
          (x.store_name || "").toLowerCase().includes(s) ||
          (x.address || "").toLowerCase().includes(s) ||
          (x.hotline || "").toLowerCase().includes(s)
      );
    }
    return result;
  }, [stores, globalSearch]);

  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Validate
  const validate = (form: StoreForm): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.store_name.trim()) errs.store_name = "Please enter branch name";
    if (!form.address.trim()) errs.address = "Please select address";
    // Validate coordinates if provided (Vietnam bounds)
    if (form.latitude.trim()) {
      const lat = parseFloat(form.latitude);
      if (isNaN(lat) || lat < 8 || lat > 24) {
        errs.latitude = "Invalid latitude (8-24 for Vietnam)";
      }
    }
    if (form.longitude.trim()) {
      const lon = parseFloat(form.longitude);
      if (isNaN(lon) || lon < 102 || lon > 110) {
        errs.longitude = "Invalid longitude (102-110 for Vietnam)";
      }
    }
    return errs;
  };

  // --- THÊM ---
  const openAddModal = () => {
    setAddForm({ ...emptyForm });
    setAddErrors({});
    setAddAddressKey((k) => k + 1);
    setShowAdd(true);
  };

  const handleAddAddressChange = useCallback((fullAddress: string) => {
    setAddForm((prev) => ({ ...prev, address: fullAddress }));
    setAddErrors((prev) => ({ ...prev, address: "" }));
  }, []);

  const handleAdd = async () => {
    const errs = validate(addForm);
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return; }
    setAddErrors({});
    try {
      const payload = {
        ...addForm,
        latitude: addForm.latitude ? parseFloat(addForm.latitude) : null,
        longitude: addForm.longitude ? parseFloat(addForm.longitude) : null,
      };
      await api.post("/api/admin/stores", payload);
      toast.success("Branch added successfully");
      setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Error adding branch");
    }
  };

  // --- SỬA ---
  const openEditModal = (store: Store) => {
    setEditForm({
      store_name: store.store_name || "",
      address: store.address || "",
      hotline: store.hotline || "",
      latitude: store.latitude != null ? String(store.latitude) : "",
      longitude: store.longitude != null ? String(store.longitude) : "",
      is_active: store.is_active ?? true,
    });
    setEditErrors({});
    setEditAddressKey((k) => k + 1);
    setEditingStore(store);
  };

  const handleEditAddressChange = useCallback((fullAddress: string) => {
    setEditForm((prev) => ({ ...prev, address: fullAddress }));
    setEditErrors((prev) => ({ ...prev, address: "" }));
  }, []);

  const handleEdit = async () => {
    if (!editingStore) return;
    const errs = validate(editForm);
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    setEditErrors({});
    try {
      const payload = {
        ...editForm,
        latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
        longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
      };
      await api.put(`/api/admin/stores/${editingStore.store_id}`, payload);
      toast.success("Branch updated successfully");
      setEditingStore(null);
      fetchData();
    } catch {
      toast.error("Error updating branch");
    }
  };

  // --- XÓA ---
  const handleDelete = async () => {
    if (!deletingStore) return;
    try {
      await api.delete(`/api/admin/stores/${deletingStore.store_id}`);
      toast.success("Branch deleted successfully");
      setDeletingStore(null);
      fetchData();
    } catch {
      toast.error("Error deleting branch");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">BRANCHES MANAGEMENT</h1>
        <Button
          onClick={openAddModal}
          variant="outlinePrimary"
          size="small"
          shape="full"
          label="Add Branch"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>}
        />
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Search & Per-page */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center">
            <input
              type="text"
              placeholder="Search name, address, hotline..."
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

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="rounded-tl-lg px-6 py-4 text-sm font-semibold uppercase tracking-wide">ID</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Branch Name</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Address</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">Hotline</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">Status</th>
                  <th className="rounded-tr-lg px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No data available</td></tr>
                ) : paginatedData.map((store) => (
                  <tr key={store.store_id} className="border-b border-stroke last:border-0 dark:border-dark-3">
                    <td className="px-6 py-4 text-dark dark:text-white">{store.store_id}</td>
                    <td className="px-6 py-4 font-medium text-dark dark:text-white">{store.store_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={store.address || ""}>
                      {store.address || <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {store.hotline || <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={store.is_active ? "success" : "danger"}>
                        {store.is_active ? "Active" : "Closed"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(store)} title="Edit" className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                        </button>
                        <button onClick={() => setDeletingStore(store)} title="Delete" className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20">
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

      {/* === MODAL THÊM CHI NHÁNH === */}
      <Modal isOpen={showAdd} setIsOpen={setShowAdd} title="ADD BRANCH">
        <div className="space-y-4 p-2">
          <InputGroup
            label="BRANCH NAME (*)"
            type="text"
            placeholder="Enter branch name"
            value={addForm.store_name}
            handleChange={(e) => { setAddForm(prev => ({ ...prev, store_name: e.target.value })); setAddErrors(prev => ({ ...prev, store_name: "" })); }}
            error={addErrors.store_name}
          />

          {/* Chọn địa chỉ dropdown Tỉnh/Quận/Phường */}
          <AddressPickerVN
            key={`add-${addAddressKey}`}
            onChange={handleAddAddressChange}
            error={addErrors.address}
          />

          <InputGroup
            label="HOTLINE"
            type="text"
            placeholder="Enter hotline number"
            value={addForm.hotline}
            handleChange={(e) => setAddForm(prev => ({ ...prev, hotline: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="LATITUDE (*)"
              type="text"
              placeholder="VD: 10.7536"
              value={addForm.latitude}
              handleChange={(e) => { setAddForm(prev => ({ ...prev, latitude: e.target.value })); setAddErrors(prev => ({ ...prev, latitude: "" })); }}
              error={addErrors.latitude}
            />
            <InputGroup
              label="LONGITUDE (*)"
              type="text"
              placeholder="VD: 106.6634"
              value={addForm.longitude}
              handleChange={(e) => { setAddForm(prev => ({ ...prev, longitude: e.target.value })); setAddErrors(prev => ({ ...prev, longitude: "" })); }}
              error={addErrors.longitude}
            />
          </div>
          {(!addForm.latitude.trim() || !addForm.longitude.trim()) && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              ⚠️ GPS coordinates are required to calculate delivery fee. You can get coordinates from Google Maps (right-click → Coordinates).
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-dark dark:text-white">ACTIVE</label>
            <Switch checked={addForm.is_active} onChange={(checked) => setAddForm(prev => ({ ...prev, is_active: checked }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setShowAdd(false)} variant="outlineDark" label="Cancel" shape="rounded" />
            <Button onClick={handleAdd} variant="primary" label="Add New" shape="rounded" />
          </div>
        </div>
      </Modal>

      {/* === MODAL SỬA CHI NHÁNH === */}
      <Modal isOpen={!!editingStore} setIsOpen={() => setEditingStore(null)} title="EDIT BRANCH">
        <div className="space-y-4 p-2">
          <InputGroup
            label="BRANCH NAME (*)"
            type="text"
            placeholder="Enter branch name"
            value={editForm.store_name}
            handleChange={(e) => { setEditForm(prev => ({ ...prev, store_name: e.target.value })); setEditErrors(prev => ({ ...prev, store_name: "" })); }}
            error={editErrors.store_name}
          />

          {/* Chọn địa chỉ dropdown — tự parse lại từ address cũ */}
          <AddressPickerVN
            key={`edit-${editAddressKey}`}
            initialAddress={editingStore?.address || ""}
            onChange={handleEditAddressChange}
            error={editErrors.address}
          />

          <InputGroup
            label="HOTLINE"
            type="text"
            placeholder="Enter hotline number"
            value={editForm.hotline}
            handleChange={(e) => setEditForm(prev => ({ ...prev, hotline: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="LATITUDE (*)"
              type="text"
              placeholder="VD: 10.7536"
              value={editForm.latitude}
              handleChange={(e) => { setEditForm(prev => ({ ...prev, latitude: e.target.value })); setEditErrors(prev => ({ ...prev, latitude: "" })); }}
              error={editErrors.latitude}
            />
            <InputGroup
              label="LONGITUDE (*)"
              type="text"
              placeholder="VD: 106.6634"
              value={editForm.longitude}
              handleChange={(e) => { setEditForm(prev => ({ ...prev, longitude: e.target.value })); setEditErrors(prev => ({ ...prev, longitude: "" })); }}
              error={editErrors.longitude}
            />
          </div>
          {(!editForm.latitude.trim() || !editForm.longitude.trim()) && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              ⚠️ GPS coordinates are required to calculate delivery fee. You can get coordinates from Google Maps (right-click → Coordinates).
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-dark dark:text-white">ACTIVE</label>
            <Switch checked={editForm.is_active} onChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setEditingStore(null)} variant="outlineDark" label="Cancel" shape="rounded" />
            <Button onClick={handleEdit} variant="primary" label="Save Changes" shape="rounded" />
          </div>
        </div>
      </Modal>

      {/* === MODAL XÓA CHI NHÁNH === */}
      <Modal isOpen={!!deletingStore} setIsOpen={() => setDeletingStore(null)} title="DELETE BRANCH">
        <div className="p-2">
          <p className="mb-6 text-gray-500">
            Are you sure you want to delete branch <strong>{deletingStore?.store_name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setDeletingStore(null)} variant="outlineDark" label="Cancel" shape="rounded" />
            <Button onClick={handleDelete} variant="danger" label="Delete" shape="rounded" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
