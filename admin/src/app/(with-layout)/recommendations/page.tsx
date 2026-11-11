"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  RotateCcw,
  ShoppingCart,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  PackageCheck,
} from "lucide-react";

interface ItemStats {
  dish_id: number;
  dish_name: string;
  category: string;
  image: string;
  ingredient: string;
  total_ordered?: number;
  avg_rating?: number;
  review_count?: number;
  type?: string;
  prices?: any[];
}

interface RecommendationOverview {
  coreAlgorithmsCount: number;
  utilityFeaturesCount: number;
  vectorizedDishesCount: number;
  vectorDimensions: number;
  sixStepCandidatesCount: number;
  sixStepIngredientsCount: number;
  pairingGroupsCount: number;
}

interface RecommendationStats {
  popular: ItemStats[];
  topRated: ItemStats[];
  overview?: RecommendationOverview;
}

export default function RecommendationsPage() {
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/recommendations/stats");
      if (res.data.success && res.data.data) {
        setStats(res.data.data);
      }
    } catch {
      toast.error("Lỗi khi tải dữ liệu gợi ý");
    } finally {
      setLoading(false);
    }
  };

  const parseImage = (imgUrl: string) => {
    if (!imgUrl) return "/images/placeholder.jpg";
    if (imgUrl.startsWith("http")) return imgUrl;
    return `${API_URL}${imgUrl}`;
  };

  const overview = stats?.overview;

  const coreAlgorithms = [
    {
      id: "content_based",
      title: "1. Lọc Dựa Trên Nội Dung (Content-Based Filtering)",
      reference: "Salton, Wong & Yang (1975) · Aggarwal (2016, Chương 4)",
      formula: "sim(A, B) = (A · B) / (||A|| × ||B||)",
      extraction: `Số hóa ${overview?.vectorizedDishesCount || 61} món thành Vector ${overview?.vectorDimensions || 14} chiều: 5 danh mục (One-Hot), 7 nhóm vị/nguyên liệu, 1 giá Min-Max đảo và 1 điểm đánh giá sao.`,
      placements: [
        "Món cùng hương vị (Popup chi tiết món)",
        "Lựa chọn món chay thanh đạm (Popup món mặn)",
        "Gợi ý món mới từ lịch sử đặt hàng (Dành riêng cho bạn)",
      ],
      icon: <Sparkles className="text-sky-600 dark:text-sky-400" size={22} />,
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      id: "knowledge_based",
      title: "2. Lọc Ràng Buộc Tri Thức 6 Bước (Knowledge-Based Filtering)",
      reference: "Burke (2000) · Jannach, Zanker, Felfernig & Friedrich (2010, Chương 4)",
      formula: "Score(d, P) = (|I(d) ∩ P| / |P|) × 100%",
      extraction: `Trích xuất ${overview?.sixStepIngredientsCount || 12} nhóm nguyên liệu chuẩn & cờ độ cay trên ${overview?.sixStepCandidatesCount || 48} món lẻ/Combo; lọc cứng Câu 1–5 và tính độ khớp nguyên liệu Câu 6 (Bitmask DP cho Combo).`,
      placements: [
        'Khung tư vấn "Lựa chọn phù hợp cho bạn" (6 câu hỏi đầu trang)',
        "Giải quyết khách hàng mới (Cold-Start), lọc dị ứng & cỡ bánh theo số người",
      ],
      icon: <SlidersHorizontal className="text-emerald-600 dark:text-emerald-400" size={22} />,
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
  ];

  const utilityFeatures = [
    {
      id: "popular",
      title: "Món bán chạy",
      method: "Truy vấn tổng sản lượng bán SUM(quantity) từ đơn hoàn tất",
      icon: <TrendingUp className="text-orange-500" size={20} />,
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      id: "top_rated",
      title: "Xếp hạng đánh giá cao",
      method: "Thống kê điểm trung bình AVG(rating_star) ≥ 4.0 sao",
      icon: <Star className="text-amber-500" size={20} />,
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      id: "reorder",
      title: "Đặt lại món quen",
      method: "Thống kê lịch sử đặt món của từng tài khoản khách hàng",
      icon: <RotateCcw className="text-teal-600" size={20} />,
      bg: "bg-teal-100 dark:bg-teal-900/30",
    },
    {
      id: "pairing",
      title: "Món ăn kèm & Mua cùng",
      method: `Kết hợp ${overview?.pairingGroupsCount ?? "các"} nhóm cấu hình sẵn & tần suất đơn gọi chung`,
      icon: <ShoppingCart className="text-indigo-500" size={20} />,
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      id: "combo_upsell",
      title: "Nhắc nâng cấp Combo",
      method: "Đối chiếu giỏ hàng với gói Combo có mức tiết kiệm thực dương",
      icon: <PackageCheck className="text-rose-500" size={20} />,
      bg: "bg-rose-100 dark:bg-rose-900/30",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wide text-dark dark:text-white">
          THỐNG KÊ HỆ THỐNG GỢI Ý MÓN ĂN
        </h1>
        <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-zinc-400">
          Kiến trúc lai chuyển mạch theo ngữ cảnh (Switching Hybrid) gồm 2 thuật toán gợi ý cốt lõi và nhóm tiện ích thống kê bán hàng.
        </p>
      </div>

      {/* 1. Chỉ số tổng quan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Thuật toán gợi ý cốt lõi</p>
          <p className="mt-2 text-2xl font-black text-dark dark:text-white">
            {overview?.coreAlgorithmsCount ?? 2} mô hình
          </p>
          <p className="mt-1 text-xs text-gray-400">Content-Based & Knowledge-Based 6 bước</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Không gian đặc trưng</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {overview?.vectorizedDishesCount ?? 61} món · {overview?.vectorDimensions ?? 14} chiều
          </p>
          <p className="mt-1 text-xs text-gray-400">Số hóa tự động từ dữ liệu thực đơn</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Món bán chạy dẫn đầu</p>
          <p className="mt-2 text-2xl font-black text-primary">
            {(stats?.popular?.[0]?.total_ordered || 0).toLocaleString("vi-VN")} lượt đặt
          </p>
          <p className="mt-1 truncate text-xs text-gray-400">
            {stats?.popular?.[0]?.dish_name || "Đang tổng hợp dữ liệu"}
          </p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Điểm đánh giá cao nhất</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {stats?.topRated?.[0]?.avg_rating
              ? `${Number(stats.topRated[0].avg_rating).toFixed(1)} sao`
              : "5.0 sao"}
          </p>
          <p className="mt-1 truncate text-xs text-gray-400">
            {stats?.topRated?.[0]?.dish_name || "Ưu tiên đề xuất trên trang chủ"}
          </p>
        </div>
      </div>

      {/* 2. Tầng 1: 2 Thuật toán gợi ý cốt lõi */}
      <div className="space-y-4">
        <div className="border-b border-stroke pb-2 dark:border-dark-3">
          <h2 className="text-sm font-black uppercase text-dark dark:text-white">
            Tầng 1 · Hai Thuật Toán Gợi Ý Cốt Lõi
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {coreAlgorithms.map((algo) => (
            <div
              key={algo.id}
              className="flex flex-col justify-between rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-xl p-3 ${algo.bg}`}>{algo.icon}</div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    Hoạt động trực tuyến
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-dark dark:text-white">{algo.title}</h3>
                <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-zinc-400">{algo.reference}</p>

                <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 dark:border-dark-3 dark:bg-dark-2 dark:text-slate-100">
                  {algo.formula}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-zinc-300">{algo.extraction}</p>
              </div>

              <div className="mt-4 border-t border-stroke pt-3 dark:border-dark-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Vị trí vận hành trên giao diện khách hàng
                </p>
                <ul className="mt-1.5 space-y-1 text-xs font-medium text-gray-700 dark:text-zinc-200">
                  {algo.placements.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tầng 2: Tiện ích thống kê CSDL & Nghiệp vụ bán kèm */}
      <div className="space-y-4">
        <div className="border-b border-stroke pb-2 dark:border-dark-3">
          <h2 className="text-sm font-black uppercase text-dark dark:text-white">
            Tầng 2 · Tiện Ích Thống Kê CSDL & Nghiệp Vụ Bán Kèm
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {utilityFeatures.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl border border-stroke bg-white p-4 shadow-xs dark:border-dark-3 dark:bg-gray-dark"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-2.5 ${item.bg}`}>{item.icon}</div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-dark-2 dark:text-slate-300">
                  Thống kê / Quy tắc
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-dark dark:text-white">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-400">{item.method}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bảng thống kê sản lượng & đánh giá thực tế */}
      <div className="space-y-4">
        <h2 className="border-b border-stroke pb-2 text-sm font-black uppercase text-dark dark:text-white dark:border-dark-3">
          Thống Kê Món Bán Chạy & Đánh Giá Thực Tế
        </h2>

        {loading ? (
          <div className="py-12 text-center text-sm font-semibold text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Table 1: Món phổ biến */}
            <div className="overflow-hidden rounded-[24px] border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
              <div className="border-b border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-zinc-800">
                <h3 className="text-sm font-bold text-dark dark:text-white">Top 10 Món Phổ Biến Nhất</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stroke bg-white font-bold uppercase text-gray-500 dark:border-dark-3 dark:bg-gray-dark dark:text-zinc-400">
                    <tr>
                      <th className="w-16 px-4 py-3 text-center">Hạng</th>
                      <th className="px-4 py-3">Món ăn</th>
                      <th className="px-4 py-3 text-right">Đã bán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-dark-3">
                    {(stats?.popular || []).map((item, index) => (
                      <tr key={`${item.type || "dish"}_${item.dish_id}`} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 text-center">
                          {index === 0 && (
                            <span className="inline-block rounded bg-yellow-100 px-2 py-1 font-bold text-yellow-700">#1</span>
                          )}
                          {index === 1 && (
                            <span className="inline-block rounded bg-gray-200 px-2 py-1 font-bold text-gray-700">#2</span>
                          )}
                          {index === 2 && (
                            <span className="inline-block rounded bg-orange-100 px-2 py-1 font-bold text-orange-700">#3</span>
                          )}
                          {index > 2 && <span className="font-bold text-gray-400">#{index + 1}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-stroke dark:border-dark-3">
                              <img src={parseImage(item.image)} alt={item.dish_name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <div className="line-clamp-1 font-bold text-dark dark:text-white">{item.dish_name}</div>
                              <div className="text-[10px] text-gray-500">{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-primary">{item.total_ordered}</td>
                      </tr>
                    ))}
                    {!stats?.popular?.length && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Đánh giá cao */}
            <div className="overflow-hidden rounded-[24px] border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark">
              <div className="border-b border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-zinc-800">
                <h3 className="text-sm font-bold text-dark dark:text-white">Top 10 Món Đánh Giá Cao Nhất</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stroke bg-white font-bold uppercase text-gray-500 dark:border-dark-3 dark:bg-gray-dark dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Món ăn</th>
                      <th className="px-4 py-3 text-center">Đánh giá</th>
                      <th className="px-4 py-3 text-right">Lượt ĐG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-dark-3">
                    {(stats?.topRated || []).map((item) => (
                      <tr key={`${item.type || "dish"}_${item.dish_id}`} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-stroke dark:border-dark-3">
                              <img src={parseImage(item.image)} alt={item.dish_name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <div className="line-clamp-1 font-bold text-dark dark:text-white">{item.dish_name}</div>
                              <div className="text-[10px] text-gray-500">{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 font-bold text-yellow-500">
                            {Number(item.avg_rating || 0).toFixed(1)} <Star size={12} className="fill-current" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-400">
                          {item.review_count}
                        </td>
                      </tr>
                    ))}
                    {!stats?.topRated?.length && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
