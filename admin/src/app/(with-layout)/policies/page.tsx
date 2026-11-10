"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { api } from "@/lib/api";
import { FileText, Edit, Calendar, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Policy {
  slug: string;
  title: string;
  updated_at: string;
}

export default function PoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState<Policy | null>(null);

  const fetchPolicies = async () => {
    try {
      const res = await api.get("/api/policies");
      if (res.data?.success) {
        setPolicies(res.data.data);
      } else {
        setError("Không thể tải danh sách chính sách.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newTitle.trim()) {
      toast.error("Vui lòng nhập đầy đủ Mã chính sách và Tên chính sách.");
      return;
    }

    const sanitizedId = newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (!sanitizedId) {
      toast.error("Mã chính sách không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/api/policies", {
        id: sanitizedId,
        chapter_name: newTitle.trim()
      });

      if (res.data?.success) {
        toast.success("Tạo chính sách thành công!");
        setIsModalOpen(false);
        setNewId("");
        setNewTitle("");
        // Chuyển hướng trực tiếp tới trang chỉnh sửa chi tiết cấu trúc chính sách
        router.push(`/policies/edit/${sanitizedId}`);
      } else {
        toast.error(res.data?.message || "Tạo thất bại.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo chính sách.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (!deletePolicy) return;
    try {
      const res = await api.delete(`/api/policies/${deletePolicy.slug}`);
      if (res.data?.success) {
        toast.success("Xóa chính sách thành công!");
        fetchPolicies();
      } else {
        toast.error("Xóa chính sách thất bại.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa chính sách.");
    } finally {
      setDeletePolicy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-270">
      <Breadcrumb pageName="Quản lý chính sách" />

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng chính sách</p>
          <p className="mt-2 text-2xl font-black text-dark dark:text-white">{policies.length} văn bản</p>
          <p className="mt-1 text-xs text-gray-400">Điều khoản & quy định công bố trên hệ thống</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đang áp dụng</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{policies.length} văn bản</p>
          <p className="mt-1 text-xs text-gray-400">Hiển thị công khai tại chân trang khách hàng</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Cập nhật gần nhất</p>
          <p className="mt-2 text-2xl font-black text-primary">
            {policies[0]?.updated_at
              ? new Date(policies[0].updated_at).toLocaleDateString("vi-VN")
              : "Hôm nay"}
          </p>
          <p className="mt-1 text-xs text-gray-400">Thời điểm hiệu chỉnh nội dung mới nhất</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Bản nháp / Chờ duyệt</p>
          <p className="mt-2 text-2xl font-black text-amber-600">0 văn bản</p>
          <p className="mt-1 text-xs text-gray-400">Tất cả chính sách đều đã được xuất bản</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-dark dark:text-white">
            Danh sách điều khoản & chính sách
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4.5 py-2 text-center text-sm font-semibold text-white transition-all hover:bg-primary/95"
          >
            <Plus size={16} />
            <span>Thêm chính sách</span>
          </button>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-gray-500">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-red-600 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {policies.map((policy) => (
              <div
                key={policy.slug}
                className="flex flex-col justify-between rounded-xl border border-stroke p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText size={20} />
                  </div>
                  <h4 className="mb-2 text-md font-bold text-dark dark:text-white">
                    {policy.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                    <Calendar size={12} />
                    <span>Cập nhật: {new Date(policy.updated_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/policies/edit/${policy.slug}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-white transition-all hover:bg-primary/95"
                  >
                    <Edit size={12} />
                    <span>Chỉnh sửa</span>
                  </Link>
                  <button
                    onClick={() => setDeletePolicy(policy)}
                    className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50 p-2.5 text-red-500 hover:bg-red-500 hover:text-white transition-all dark:bg-red-950/20 dark:border-red-500/25"
                    title="Xóa chính sách"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THÊM CHÍNH SÁCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-boxdark border border-stroke dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-zinc-800">
              <h4 className="text-lg font-bold text-dark dark:text-white">
                THÊM CHÍNH SÁCH
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-dark dark:text-zinc-400 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                  Mã chính sách (ID):
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="lấy id của bảng polisy_chapters (VD: chinh_sach_hoan_tien)"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-zinc-800 dark:text-white dark:focus:border-primary text-sm"
                  required
                />
                <p className="mt-1.5 text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
                  Đặt tên mã chính sách bằng chữ không dấu, sử dụng gạch dưới để phân tách các từ. Ví dụ: chinh_sach_hoan_tien.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                  Tên chính sách:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="lưu vào chapter_name (VD: IV. CHÍNH SÁCH HOÀN TIỀN)"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-zinc-800 dark:text-white dark:focus:border-primary text-sm"
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  Ghi chú: Đây là tên bao quát của toàn bộ văn bản (Ví dụ: Chính sách bảo mật, Chính sách đổi trả)
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-stroke bg-transparent px-4.5 py-2 text-center text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#007A5A] hover:bg-[#006046] text-white px-6 py-2 text-center text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "LƯU"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletePolicy && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-boxdark border border-stroke dark:border-zinc-800">
            <h4 className="text-lg font-bold text-dark dark:text-white">
              Xác nhận xóa chính sách
            </h4>
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
              Bạn có chắc chắn muốn xóa chính sách <strong>{deletePolicy.title}</strong>? Hành động này không thể hoàn tác và sẽ xóa bỏ toàn bộ nội dung phân cấp bên trong.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletePolicy(null)}
                className="rounded-lg border border-stroke bg-transparent px-4 py-2 text-center text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleDeletePolicy}
                className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-center text-xs font-bold shadow-md"
              >
                XÓA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
