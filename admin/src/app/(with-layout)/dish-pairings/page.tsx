// Trang quản lý gợi ý kết hợp món ăn
"use client";
import { api, getApiErrorMessage } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui-elements/button";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getImageUrl = (img: string | null) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
};

interface Dish {
  dish_id: number;
  dish_name: string;
  image: string | null;
  dish_type: string;
  category: {
    category_name: string;
  };
}

interface DishPairingItem {
  dish_id: number;
  dish: Dish;
}

interface DishPairing {
  pairing_id: number;
  reason: string;
  created_at: string;
  items: DishPairingItem[];
}

export default function DishPairingPage() {
  const [pairings, setPairings] = useState<DishPairing[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [selectedDishIds, setSelectedDishIds] = useState<number[]>([]);
  
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPairings();
  }, [page, search]);

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchPairings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/dish-pairings`, {
        params: { page, limit, search }
      });
      if (res.data && res.data.data) {
        setPairings(res.data.data.pairings || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách kết hợp món");
      console.warn(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchDishes = async () => {
    try {
      const res = await api.get('/api/admin/dishes-list');
      if (res.data && res.data.data) {
        setDishes(res.data.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách món ăn");
      console.warn(getApiErrorMessage(error));
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setReason("");
    setSelectedDishIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (pairing: DishPairing) => {
    setEditingId(pairing.pairing_id);
    setReason(pairing.reason || "");
    setSelectedDishIds(pairing.items.map((item) => item.dish_id));
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    if (selectedDishIds.length < 2) {
      toast.error("Vui lòng chọn ít nhất 2 món ăn để tạo kết hợp");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/admin/dish-pairings/${editingId}`, {
          reason,
          dish_ids: selectedDishIds
        });
        toast.success("Cập nhật nhóm kết hợp thành công");
      } else {
        await api.post(`/api/admin/dish-pairings`, {
          reason,
          dish_ids: selectedDishIds
        });
        toast.success("Thêm mới nhóm kết hợp thành công");
      }
      setIsModalOpen(false);
      fetchPairings();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu nhóm kết hợp");
      console.warn(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/admin/dish-pairings/${deletingId}`);
      toast.success("Xóa nhóm kết hợp thành công");
      setIsDeleteModalOpen(false);
      fetchPairings();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa nhóm kết hợp");
      console.warn(getApiErrorMessage(error));
    }
  };

  const toggleDishSelection = (dishId: number) => {
    setSelectedDishIds(prev => 
      prev.includes(dishId) 
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const dishesByCategory = useMemo(() => {
    const grouped: Record<string, Dish[]> = {};
    dishes.forEach(dish => {
      const cat = dish.category?.category_name || 'Khác';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(dish);
    });
    return grouped;
  }, [dishes]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">QUẢN LÝ MÓN ĂN KÈM</h1>
          <p className="text-sm text-gray-500 mt-1">Thiết lập các nhóm món ăn kèm để hiển thị gợi ý khi khách hàng chọn món</p>
        </div>
        <Button 
          label="Thêm nhóm kết hợp mới" 
          variant="primary" 
          size="small" 
          onClick={openCreateModal}
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>}
        />
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng nhóm kết hợp</p>
          <p className="mt-2 text-2xl font-black text-dark dark:text-white">{total} nhóm</p>
          <p className="mt-1 text-xs text-gray-400">Các bộ gợi ý món ăn kèm đã thiết lập</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đang áp dụng</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{total} nhóm</p>
          <p className="mt-1 text-xs text-gray-400">Hiển thị trực tiếp khi khách chọn món</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Món ăn tham gia</p>
          <p className="mt-2 text-2xl font-black text-primary">
            {new Set(pairings.flatMap((p) => (p.items || []).map((i) => i.dish_id))).size} món
          </p>
          <p className="mt-1 text-xs text-gray-400">Số món ăn xuất hiện trong các nhóm hiện tại</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Trung bình món / nhóm</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {pairings.length
              ? (pairings.reduce((s, p) => s + (p.items?.length || 0), 0) / pairings.length).toFixed(1).replace(".", ",")
              : 0}{" "}
            món
          </p>
          <p className="mt-1 text-xs text-gray-400">Quy mô trung bình của mỗi nhóm kết hợp</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white px-5 pb-5 pt-6 shadow-sm sm:px-7.5 dark:border-dark-3 dark:bg-gray-dark">
        {/* Tìm kiếm */}
        <div className="mb-6 max-w-md">
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Tìm kiếm</label>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm theo lý do gợi ý hoặc tên món..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none transition placeholder:text-gray-400 focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="py-4 pl-4 pr-3 text-sm font-semibold uppercase tracking-wide">STT</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Tên các món trong nhóm</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Lý do gợi ý kết hợp</th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-wide">Ngày tạo</th>
                  <th className="py-4 pl-3 pr-4 text-center text-sm font-semibold uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </td>
                  </tr>
                ) : pairings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Chưa có nhóm kết hợp món ăn nào
                    </td>
                  </tr>
                ) : (
                  pairings.map((pairing, index) => (
                    <tr key={pairing.pairing_id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-50/50 dark:hover:bg-dark-2/50">
                      <td className="py-4 pl-4 pr-3 text-sm text-dark dark:text-white">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {pairing.items?.map(item => (
                            <span 
                              key={item.dish_id} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-2 text-xs font-medium text-dark dark:text-white border border-stroke dark:border-dark-3"
                            >
                              {item.dish?.image && (
                                <img
                                  src={getImageUrl(item.dish.image)!}
                                  alt=""
                                  className="h-4 w-4 rounded-full object-cover"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              )}
                              <span>{item.dish?.dish_name || `Món #${item.dish_id}`}</span>
                              {item.dish?.dish_type && (
                                <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${
                                  item.dish.dish_type === 'chay' 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' 
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                }`}>
                                  {item.dish.dish_type === 'chay' ? 'Chay' : 'Mặn'}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-dark dark:text-gray-300">
                        {pairing.reason || <span className="italic text-gray-400">Không có lý do</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(pairing.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 pl-3 pr-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(pairing)} 
                            title="Sửa" 
                            className="rounded p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4.5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                          </button>
                          <button 
                            onClick={() => confirmDelete(pairing.pairing_id)} 
                            title="Xóa" 
                            className="rounded p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
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

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Pagination
              totalPages={totalPages}
              currentPage={page}
              onPageChange={setPage}
            />
            <div className="text-sm text-gray-500">Trang {page} / {totalPages}</div>
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa nhóm kết hợp */}
      <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} className="max-w-4xl p-6">
        <div>
          <h2 className="text-xl font-bold mb-4 text-dark dark:text-white uppercase tracking-wide">
            {editingId ? "Cập nhật nhóm kết hợp" : "Thêm nhóm kết hợp mới"}
          </h2>
          
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
              LÝ DO GỢI Ý KẾT HỢP (*)
            </label>
            <textarea
              placeholder="Ví dụ: Thưởng thức pizza nóng giòn cùng salad thanh mát và nước có ga sảng khoái để cân bằng hương vị..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition placeholder:text-gray-400 focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-dark dark:text-white uppercase">
                CHỌN CÁC MÓN ĂN TRONG NHÓM (*)
              </label>
              <span className="text-sm font-semibold text-primary">
                Đã chọn {selectedDishIds.length} món (Tối thiểu 2 món)
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto border border-stroke rounded-xl p-4 bg-gray-50/50 dark:border-dark-3 dark:bg-dark-2/50 space-y-5">
              {Object.keys(dishesByCategory).map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="font-bold text-sm text-dark dark:text-white border-b border-stroke dark:border-dark-3 pb-1 uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {dishesByCategory[category].map(dish => {
                      const isSelected = selectedDishIds.includes(dish.dish_id);
                      const imgUrl = getImageUrl(dish.image);
                      return (
                        <div 
                          key={dish.dish_id}
                          onClick={() => toggleDishSelection(dish.dish_id)}
                          className={`flex items-center p-2.5 rounded-xl cursor-pointer border transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/10 shadow-sm' 
                              : 'border-stroke bg-white dark:border-dark-3 dark:bg-dark-2 hover:border-gray-300 dark:hover:border-dark-4'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-dark-3 mr-3 border border-stroke dark:border-dark-3 flex items-center justify-center">
                            {imgUrl ? (
                              <img 
                                src={imgUrl} 
                                alt={dish.dish_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium">Trống</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark dark:text-white truncate">
                              {dish.dish_name}
                            </p>
                            <p className="mt-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                dish.dish_type === 'chay' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              }`}>
                                {dish.dish_type === 'chay' ? 'Món chay' : 'Món mặn'}
                              </span>
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button label="Hủy" variant="outlineDark" size="default" shape="rounded" onClick={() => setIsModalOpen(false)} />
            <Button label={editingId ? "Lưu thay đổi" : "Tạo nhóm kết hợp"} variant="primary" size="default" shape="rounded" onClick={handleSave} />
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} className="max-w-[420px] p-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-dark dark:text-white">Xác nhận xóa nhóm kết hợp</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Bạn có chắc chắn muốn xóa nhóm gợi ý kết hợp này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-center gap-3">
            <Button label="Hủy" variant="outlineDark" size="default" shape="rounded" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} />
            <Button label="Xóa nhóm" variant="danger" size="default" shape="rounded" className="flex-1" onClick={handleDelete} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
