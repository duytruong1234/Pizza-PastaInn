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
  Copy,
  CheckCircle2
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

interface RecommendationStats {
  popular: ItemStats[];
  topRated: ItemStats[];
}

export default function RecommendationsPage() {
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

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
    } catch (error) {
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

  const algorithms = [
    {
      id: "content_based",
      title: "Gợi ý theo nguyên liệu",
      desc: "Đối chiếu thành phần & nhóm món tương đồng",
      icon: <Sparkles className="text-blue-500" size={24} />,
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      id: "popular",
      title: "Món phổ biến",
      desc: "Thống kê các món được đặt nhiều nhất",
      icon: <TrendingUp className="text-orange-500" size={24} />,
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      id: "history",
      title: "Đặt lại món quen",
      desc: "Gợi ý theo lịch sử đặt món của khách hàng",
      icon: <RotateCcw className="text-emerald-500" size={24} />,
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      id: "market_basket",
      title: "Món thường đặt kèm",
      desc: "Thống kê các món hay xuất hiện cùng đơn hàng",
      icon: <ShoppingCart className="text-purple-500" size={24} />,
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      id: "top_rated",
      title: "Đánh giá cao",
      desc: "Xếp hạng theo điểm đánh giá của thực khách",
      icon: <Star className="text-yellow-500" size={24} />,
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      id: "similar",
      title: "Món tương tự",
      desc: "Gợi ý các món cùng danh mục và khẩu vị",
      icon: <Copy className="text-cyan-500" size={24} />,
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wide text-dark dark:text-white">
          THỐNG KÊ GỢI Ý MÓN ĂN
        </h1>
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mt-1">
          Theo dõi các nhóm gợi ý món ăn trên thực đơn và danh sách món khách đặt nhiều.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Nhóm thuật toán</p>
          <p className="mt-2 text-2xl font-black text-dark dark:text-white">{algorithms.length} mô hình</p>
          <p className="mt-1 text-xs text-gray-400">Tổ hợp gợi ý hiển thị trên trang khách hàng</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{algorithms.length} mô hình</p>
          <p className="mt-1 text-xs text-gray-400">100% luồng gợi ý đang kích hoạt trực tuyến</p>
        </div>
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-xs dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Món bán chạy dẫn đầu</p>
          <p className="mt-2 text-2xl font-black text-primary">
            {(stats?.popular?.[0]?.total_ordered || 0).toLocaleString("vi-VN")} lượt đặt
          </p>
          <p className="mt-1 text-xs text-gray-400 truncate">
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
          <p className="mt-1 text-xs text-gray-400 truncate">
            {stats?.topRated?.[0]?.dish_name || "Ưu tiên đề xuất trên trang chủ"}
          </p>
        </div>
      </div>

      {/* Section 2: Tổng quan nhóm gợi ý */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase text-dark dark:text-white border-b border-stroke dark:border-dark-3 pb-2">
          Các nhóm gợi ý đang hoạt động
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {algorithms.map((algo) => (
            <div key={algo.id} className="rounded-[24px] border border-stroke bg-white p-5 shadow-sm dark:border-dark-3 dark:bg-gray-dark flex flex-col">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${algo.bg}`}>
                  {algo.icon}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                  <CheckCircle2 size={12} />
                  Hoạt động
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-dark dark:text-white">{algo.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{algo.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Dashboard hiệu suất */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase text-dark dark:text-white border-b border-stroke dark:border-dark-3 pb-2">
          Dashboard hiệu suất
        </h2>
        
        {loading ? (
          <div className="py-12 text-center text-gray-500 font-semibold text-sm">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Table 1: Món phổ biến */}
            <div className="rounded-[24px] border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
              <div className="p-4 border-b border-stroke dark:border-dark-3 bg-gray-50 dark:bg-zinc-800">
                <h3 className="font-bold text-dark dark:text-white text-sm">Top 10 Món Phổ Biến Nhất</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white dark:bg-gray-dark text-gray-500 dark:text-zinc-400 uppercase font-bold border-b border-stroke dark:border-dark-3">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">Hạng</th>
                      <th className="px-4 py-3">Món ăn</th>
                      <th className="px-4 py-3 text-right">Đã bán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-dark-3">
                    {(stats?.popular || []).map((item, index) => (
                      <tr key={item.dish_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 text-center">
                          {index === 0 && <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 font-bold rounded">#1</span>}
                          {index === 1 && <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 font-bold rounded">#2</span>}
                          {index === 2 && <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 font-bold rounded">#3</span>}
                          {index > 2 && <span className="font-bold text-gray-400">#{index + 1}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-stroke dark:border-dark-3">
                              <img src={parseImage(item.image)} alt={item.dish_name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-bold text-dark dark:text-white line-clamp-1">{item.dish_name}</div>
                              <div className="text-[10px] text-gray-500">{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-primary">
                          {item.total_ordered}
                        </td>
                      </tr>
                    ))}
                    {!stats?.popular?.length && (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-gray-500">Không có dữ liệu</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Đánh giá cao */}
            <div className="rounded-[24px] border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
              <div className="p-4 border-b border-stroke dark:border-dark-3 bg-gray-50 dark:bg-zinc-800">
                <h3 className="font-bold text-dark dark:text-white text-sm">Top 10 Món Đánh Giá Cao Nhất</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white dark:bg-gray-dark text-gray-500 dark:text-zinc-400 uppercase font-bold border-b border-stroke dark:border-dark-3">
                    <tr>
                      <th className="px-4 py-3">Món ăn</th>
                      <th className="px-4 py-3 text-center">Đánh giá</th>
                      <th className="px-4 py-3 text-right">Lượt ĐG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-dark-3">
                    {(stats?.topRated || []).map((item) => (
                      <tr key={item.dish_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-stroke dark:border-dark-3">
                              <img src={parseImage(item.image)} alt={item.dish_name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-bold text-dark dark:text-white line-clamp-1">{item.dish_name}</div>
                              <div className="text-[10px] text-gray-500">{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold">
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
                        <td colSpan={3} className="text-center py-6 text-gray-500">Không có dữ liệu</td>
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
