// Trang quản lý đánh giá
"use client";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

interface Review {
  review_id: number; rating_star: number; comment: string;
  image_url: string | null; shop_reply: string | null;
  is_visible: boolean; created_at: string;
  user?: { username: string; email: string };
  order?: { order_id: number; total_order: number };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/reviews").then(r => {
      setReviews(r.data.data.reviews);
      setTotal(r.data.data.total);
    }).catch(() => setReviews([])).finally(() => setLoading(false));
  }, []);

  const renderStars = (n: number) => '★'.repeat(Math.min(n, 5));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark dark:text-white">QUẢN LÝ ĐÁNH GIÁ</h1>
        <span className="text-sm text-gray-500">Tổng: {total} đánh giá</span>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-2xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-dark-2" />
              <div className="mt-2 h-4 w-2/3 rounded bg-gray-200 dark:bg-dark-2" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Chưa có đánh giá</div>
        ) : reviews.map(r => (
          <div key={r.review_id} className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-medium text-dark dark:text-white">{r.user?.username || 'Ẩn danh'}</span>
                <span className="ml-2 text-sm text-gray-400">{r.user?.email}</span>
                <div className="mt-1">{renderStars(r.rating_star || 0)}</div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div>Đơn #{r.order?.order_id}</div>
                <div>{r.created_at ? dayjs(r.created_at).format('DD/MM/YYYY') : ''}</div>
              </div>
            </div>
            {r.comment && <p className="mt-3 text-sm text-dark dark:text-gray-300">{r.comment}</p>}
            {r.image_url && <img src={r.image_url} alt="Review" className="mt-3 h-24 rounded-lg object-cover" />}
            {r.shop_reply && (
              <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Phản hồi từ cửa hàng:</p>
                <p className="mt-1 text-sm text-dark dark:text-gray-300">{r.shop_reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
