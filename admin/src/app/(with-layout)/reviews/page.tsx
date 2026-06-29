// Premium reviews management page
"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { createPortal } from "react-dom";
import { 
  Star, 
  Eye, 
  EyeOff, 
  Trash2, 
  Search, 
  CornerDownRight, 
  MessageSquare, 
  MessageSquareOff, 
  Send, 
  X, 
  Check, 
  Edit3, 
  Filter,
  RotateCw
} from "lucide-react";

interface Review {
  review_id: number;
  rating_star: number;
  comment: string;
  image_url: string | null;
  shop_reply: string | null;
  is_visible: boolean;
  created_at: string;
  user?: { username: string; email: string };
  order?: { order_id: number; total_order: number };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [replyFilter, setReplyFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Interactive Reply states
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Edit Reply states
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");

  // Fetch reviews from API
  const fetchReviews = () => {
    setLoading(true);
    api.get("/api/admin/reviews?limit=100")
      .then(r => {
        if (r.data.success && r.data.data) {
          setReviews(r.data.data.reviews || []);
        } else {
          setError("Failed to load reviews list");
        }
      })
      .catch(() => {
        setError("Server connection error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Calculate Metrics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating_star || 0), 0) / totalReviews).toFixed(1)
    : "0.0";

  const starCounts = [0, 0, 0, 0, 0, 0]; // Index maps to stars 1-5
  reviews.forEach(r => {
    const star = Math.min(Math.max(r.rating_star || 0, 1), 5);
    starCounts[star] += 1;
  });

  // Action: Toggle visibility
  const handleToggleVisibility = async (review: Review) => {
    try {
      const nextVisible = !review.is_visible;
      const res = await api.patch(`/api/admin/reviews/${review.review_id}`, {
        is_visible: nextVisible
      });
      if (res.data.success) {
        setReviews(prev => prev.map(r => 
          r.review_id === review.review_id ? { ...r, is_visible: nextVisible } : r
        ));
      }
    } catch (err) {
      alert("Lỗi khi thay đổi trạng thái hiển thị");
    }
  };

  // Action: Submit shop reply
  const handleSendReply = async (reviewId: number, isEdit = false) => {
    const text = isEdit ? editReplyText : replyText;
    if (!text.trim()) return;

    setReplyLoading(true);
    try {
      const res = await api.patch(`/api/admin/reviews/${reviewId}`, {
        shop_reply: text.trim()
      });
      if (res.data.success) {
        setReviews(prev => prev.map(r => 
          r.review_id === reviewId ? { ...r, shop_reply: text.trim() } : r
        ));
        setReplyingReviewId(null);
        setEditingReviewId(null);
        setReplyText("");
      }
    } catch (err) {
      alert("Lỗi khi gửi phản hồi");
    } finally {
      setReplyLoading(false);
    }
  };

  // Action: Delete shop reply
  const handleDeleteReply = async (reviewId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phản hồi này không?")) return;

    try {
      const res = await api.patch(`/api/admin/reviews/${reviewId}`, {
        shop_reply: "" // Empty string deletes reply on backend
      });
      if (res.data.success) {
        setReviews(prev => prev.map(r => 
          r.review_id === reviewId ? { ...r, shop_reply: null } : r
        ));
      }
    } catch (err) {
      alert("Lỗi khi xóa phản hồi");
    }
  };

  // Action: Delete review completely
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Cảnh báo: Hành động này sẽ xóa vĩnh viễn đánh giá này. Bạn có chắc chắn muốn xóa?")) return;

    try {
      const res = await api.delete(`/api/admin/reviews/${reviewId}`);
      if (res.data.success) {
        setReviews(prev => prev.filter(r => r.review_id !== reviewId));
      }
    } catch (err) {
      alert("Lỗi khi xóa đánh giá");
    }
  };

  // Real-time reactive filtering
  const filteredReviews = reviews.filter(r => {
    // 1. Search Query
    const query = searchQuery.trim().toLowerCase();
    const matchSearch = !query || 
      (r.user?.username || "").toLowerCase().includes(query) ||
      (r.user?.email || "").toLowerCase().includes(query) ||
      (r.comment || "").toLowerCase().includes(query) ||
      (r.order?.order_id || "").toString().includes(query);

    // 2. Star Rating
    const matchStar = starFilter === "all" || r.rating_star === parseInt(starFilter);

    // 3. Visibility
    const matchVisible = visibilityFilter === "all" || 
      (visibilityFilter === "visible" && r.is_visible) || 
      (visibilityFilter === "hidden" && !r.is_visible);

    // 4. Reply status
    const matchReply = replyFilter === "all" ||
      (replyFilter === "replied" && r.shop_reply) ||
      (replyFilter === "unreplied" && !r.shop_reply);

    return matchSearch && matchStar && matchVisible && matchReply;
  });

  const renderStars = (starCount: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            size={15} 
            className={`${s <= starCount ? "fill-[#f5c043] text-[#f5c043]" : "text-gray-300 dark:text-zinc-700"}`} 
          />
        ))}
      </div>
    );
  };

  const getStarPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  // Convert DB image_url array or string
  const parseImages = (imageUrlStr: string | null): string[] => {
    if (!imageUrlStr) return [];
    try {
      if (imageUrlStr.startsWith("[")) {
        return JSON.parse(imageUrlStr);
      }
      return [imageUrlStr];
    } catch (e) {
      return [imageUrlStr];
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-dark dark:text-white">
            QUẢN LÝ ĐÁNH GIÁ CỬA HÀNG
          </h1>
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
            Xem, phản hồi trực tiếp và lọc các đánh giá công khai từ khách hàng.
          </p>
        </div>
        <button 
          onClick={fetchReviews}
          className="rounded-xl border border-stroke bg-white p-2.5 text-gray-500 hover:bg-gray-100 hover:text-primary dark:border-dark-3 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-dark-2 transition-all active:scale-[0.95] cursor-pointer inline-flex items-center justify-center shadow-sm"
          title="Tải lại danh sách"
        >
          <RotateCw size={16} className={`${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500 flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Dashboard */}
      {!loading && totalReviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Rating summary */}
          <div className="rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark flex flex-col justify-center items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-gray-500 dark:text-zinc-400">
              ĐIỂM ĐÁNH GIÁ TRUNG BÌNH
            </span>
            <div className="text-5xl font-black tracking-tight text-primary dark:text-white">
              {averageRating} <span className="text-lg text-gray-400 font-semibold">/ 5</span>
            </div>
            <div className="mt-1">{renderStars(Math.round(parseFloat(averageRating)))}</div>
            <span className="text-xs font-semibold text-gray-400 mt-1">Dựa trên {totalReviews} đánh giá thực tế</span>
          </div>

          {/* Column 2: Rating breakdown bars */}
          <div className="md:col-span-2 rounded-[24px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b pb-1.5 mb-2">
              CHI TIẾT ĐÁNH GIÁ
            </h3>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starCounts[star];
              const pct = getStarPercentage(count);
              return (
                <div key={star} className="flex items-center gap-3 text-xs font-semibold">
                  <span className="w-6 text-right font-black text-dark dark:text-white">{star}★</span>
                  <div className="flex-1 h-3 rounded-full bg-gray-150 dark:bg-zinc-800 overflow-hidden">
                    <div 
                      className="h-full bg-[#f5c043] rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-zinc-550 dark:text-zinc-400 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="rounded-[24px] border border-stroke bg-white p-5 shadow-sm dark:border-dark-3 dark:bg-gray-dark space-y-4">
        {/* Row 1: Search & Title */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black uppercase text-dark dark:text-white">
            <Filter size={16} className="text-primary" />
            <span>BỘ LỌC & TÌM KIẾM</span>
          </div>
          
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Tìm theo tên, email, bình luận..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-gray-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-dark outline-none focus:border-primary dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white focus:dark:border-primary"
            />
          </div>
        </div>

        {/* Row 2: Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Star Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">Đánh giá sao</label>
            <select
              value={starFilter}
              onChange={e => setStarFilter(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-white py-2.5 px-3 text-xs font-bold text-dark-4 outline-none focus:border-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              <option value="all">Tất cả sao</option>
              <option value="5">5★ Hoàn hảo</option>
              <option value="4">4★ Rất tốt</option>
              <option value="3">3★ Trung bình</option>
              <option value="2">2★ Kém</option>
              <option value="1">1★ Rất kém</option>
            </select>
          </div>

          {/* Visibility Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-550">Trạng thái hiển thị</label>
            <select
              value={visibilityFilter}
              onChange={e => setVisibilityFilter(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-white py-2.5 px-3 text-xs font-bold text-dark-4 outline-none focus:border-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="visible">Đang hiển thị</option>
              <option value="hidden">Đang ẩn</option>
            </select>
          </div>

          {/* Reply Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">Trạng thái phản hồi</label>
            <select
              value={replyFilter}
              onChange={e => setReplyFilter(e.target.value)}
              className="w-full rounded-xl border border-stroke bg-white py-2.5 px-3 text-xs font-bold text-dark-4 outline-none focus:border-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              <option value="all">Tất cả phản hồi</option>
              <option value="replied">Đã phản hồi</option>
              <option value="unreplied">Chưa phản hồi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List Feed */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-[24px] border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-dark-2" />
                <div className="h-4 w-12 rounded bg-gray-200 dark:bg-dark-2" />
              </div>
              <div className="h-12 w-full rounded bg-gray-200 dark:bg-dark-2" />
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-[24px] border border-stroke bg-white py-16 text-center shadow-sm dark:border-dark-3 dark:bg-gray-dark flex flex-col items-center justify-center gap-3">
            <MessageSquareOff size={32} className="text-gray-400" />
            <div className="text-sm font-bold text-gray-500 dark:text-zinc-400">KHÔNG TÌM THẤY ĐÁNH GIÁ NÀO</div>
            <p className="text-xs text-gray-450 dark:text-zinc-500 max-w-xs leading-relaxed">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các đánh giá khác.
            </p>
          </div>
        ) : (
          filteredReviews.map(r => {
            const attachedImages = parseImages(r.image_url);
            const isReplying = replyingReviewId === r.review_id;
            const isEditing = editingReviewId === r.review_id;

            return (
              <div 
                key={r.review_id} 
                className={`rounded-[24px] border bg-white p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-gray-dark ${
                  r.is_visible 
                    ? "border-stroke dark:border-dark-3" 
                    : "border-amber-400/40 bg-amber-500/[0.01] dark:border-amber-500/20"
                }`}
              >
                {/* Review Header card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary dark:text-white shrink-0 shadow-sm text-sm uppercase">
                      {r.user?.username?.charAt(0) || "K"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-dark dark:text-white">{r.user?.username || 'Khách hàng ẩn danh'}</span>
                        <span className="text-[11px] font-semibold text-gray-400">{r.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        {renderStars(r.rating_star || 0)}
                        <span className="text-[10px] font-extrabold text-gray-400 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded">
                          {r.created_at ? dayjs(r.created_at).format('DD/MM/YYYY HH:mm') : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center sm:items-end justify-between sm:flex-col gap-2 sm:text-right">
                    {r.order ? (
                      <button
                        onClick={() => setSelectedOrderId(r.order?.order_id ?? null)}
                        className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold tracking-wide text-emerald-550 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1 shadow-sm"
                        title="Nhấp để xem chi tiết đơn hàng đã mua của khách"
                      >
                        <span>
                          ĐƠN #{r.order?.order_id} ({r.order?.total_order ? `${(r.order.total_order / 1000).toFixed(0)}k` : ''})
                        </span>
                      </button>
                    ) : (
                      <span className="rounded bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-550">
                        Đánh giá không kèm đơn hàng
                      </span>
                    )}

                    {/* Action buttons row */}
                    <div className="flex items-center gap-1.5">
                      {/* Button Toggle Visibility */}
                      <button 
                        onClick={() => handleToggleVisibility(r)}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          r.is_visible 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                        }`}
                        title={r.is_visible ? "Nhấp để ẩn khỏi trang chủ" : "Nhấp để hiển thị trên trang chủ"}
                      >
                        {r.is_visible ? <Eye size={14} className="stroke-[2.5px]" /> : <EyeOff size={14} className="stroke-[2.5px]" />}
                      </button>

                      {/* Button Delete Review */}
                      <button 
                        onClick={() => handleDeleteReview(r.review_id)}
                        className="p-2 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer"
                        title="Xóa vĩnh viễn đánh giá này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment Text block */}
                {r.comment && (
                  <p className="mt-3 text-xs md:text-sm font-semibold text-dark-4 dark:text-zinc-300 leading-relaxed max-w-3xl">
                    {r.comment}
                  </p>
                )}

                {/* Attached review images */}
                {attachedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-3.5">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border border-stroke dark:border-zinc-800 shadow-sm shrink-0">
                        <img src={img} alt="Attached feedback" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Shop Reply Container */}
                {r.shop_reply && !isEditing && (
                  <div className="mt-4 rounded-2xl bg-primary/[0.02] border border-primary/10 p-4 relative animate-fadeIn">
                    <div className="absolute top-4 left-4 text-primary dark:text-white">
                      <CornerDownRight size={16} />
                    </div>
                    <div className="pl-6 space-y-1 text-left">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-black uppercase tracking-widest text-primary dark:text-white">
                          PHẢN HỒI CỦA CỬA HÀNG
                        </span>
                        
                        <div className="flex items-center gap-2.5">
                          <button 
                            onClick={() => {
                              setEditingReviewId(r.review_id);
                              setEditReplyText(r.shop_reply || "");
                            }}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={11} />
                            Sửa
                          </button>
                          <button 
                            onClick={() => handleDeleteReply(r.review_id)}
                            className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} />
                            Xoá
                          </button>
                        </div>
                      </div>
                      <p className="text-xs md:text-[13px] font-semibold text-dark-5 dark:text-zinc-305 leading-relaxed pt-0.5">
                        {r.shop_reply}
                      </p>
                    </div>
                  </div>
                )}

                {/* Direct Inline Replying Panel */}
                {isReplying && (
                  <div className="mt-4 border-t pt-4 border-stroke dark:border-zinc-800 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary mb-2">
                      <MessageSquare size={13} />
                      <span>Viết phản hồi cho {r.user?.username || 'Khách hàng'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung cửa hàng phản hồi..."
                        rows={2}
                        className="flex-1 rounded-xl border border-stroke bg-gray-50 p-3 text-xs font-semibold text-dark outline-none focus:border-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:dark:border-primary"
                      />
                      
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleSendReply(r.review_id)}
                          disabled={replyLoading || !replyText.trim()}
                          className="rounded-xl bg-primary p-3 text-white hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                          title="Gửi phản hồi"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setReplyingReviewId(null);
                            setReplyText("");
                          }}
                          className="rounded-xl bg-gray-150 dark:bg-zinc-800 p-3 text-gray-500 dark:text-zinc-300 hover:bg-gray-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                          title="Huỷ"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Inline Editing Panel */}
                {isEditing && (
                  <div className="mt-4 border-t pt-4 border-stroke dark:border-zinc-800 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary mb-2">
                      <Edit3 size={13} />
                      <span>Sửa phản hồi</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <textarea
                        value={editReplyText}
                        onChange={e => setEditReplyText(e.target.value)}
                        placeholder="Sửa nội dung phản hồi..."
                        rows={2}
                        className="flex-1 rounded-xl border border-stroke bg-gray-50 p-3 text-xs font-semibold text-dark outline-none focus:border-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:dark:border-primary"
                      />
                      
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleSendReply(r.review_id, true)}
                          disabled={replyLoading || !editReplyText.trim()}
                          className="rounded-xl bg-primary p-3 text-white hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                          title="Lưu thay đổi"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingReviewId(null);
                            setEditReplyText("");
                          }}
                          className="rounded-xl bg-gray-150 dark:bg-zinc-800 p-3 text-gray-500 dark:text-zinc-300 hover:bg-gray-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                          title="Huỷ"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply button when not replying and not replied yet */}
                {!r.shop_reply && !isReplying && (
                  <div className="mt-3.5 flex justify-end">
                    <button
                      onClick={() => {
                        setReplyingReviewId(r.review_id);
                        setReplyText("");
                      }}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer transition-all hover:translate-x-0.5"
                    >
                      <MessageSquare size={13} />
                      Phản hồi đánh giá
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}

// ── Read-only Order Detail Modal for Reviews ───────────────────────────────────
interface OrderDetail {
  order_id: number;
  user?: { username: string; email: string; phone: string };
  user_address?: { address_line: string };
  order_status: string;
  payment_method: string;
  payment_status: string;
  total_price_dish: number;
  shipping_fee: number;
  discount_amount: number;
  total_order: number;
  order_note: string;
  created_at: string;
  order_type: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items?: any[];
  confirmed_at?: string;
  preparing_at?: string;
  shipped_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  pickup_time?: string;
  estimated_delivery_time?: string;
  store?: { store_id: number; store_name: string; address: string; hotline?: string };
}

const STATUS_COLORS: Record<string, "warning" | "info" | "primary" | "secondary" | "success" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  preparing: "primary",
  shipped: "secondary",
  completed: "success",
  cancelled: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipped: "Đang giao hàng",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  vietqr: "Chuyển khoản VietQR",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  delivery: "Giao hàng",
  pickup: "Nhận tại cửa hàng",
};

function OrderDetailModal({
  orderId,
  onClose,
}: {
  orderId: number;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/admin/orders/${orderId}`)
      .then(res => {
        if (res.data.success && res.data.data) {
          setOrder(res.data.data);
        } else {
          setError("Không thể tải chi tiết đơn hàng");
        }
      })
      .catch(() => {
        setError("Lỗi kết nối máy chủ");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-dark mx-4 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div>
            <h2 className="text-lg font-bold text-dark dark:text-white">
              CHI TIẾT ĐƠN HÀNG #{orderId}
            </h2>
            {order && (
              <p className="text-xs text-gray-400 mt-1">
                {order.created_at ? dayjs(order.created_at).format("DD/MM/YYYY HH:mm:ss") : ""}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-stroke w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-150 dark:border-dark-3 dark:hover:bg-dark-2 font-bold transition"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-2" />
            <span className="text-xs font-bold">Đang tải chi tiết đơn hàng...</span>
          </div>
        ) : error || !order ? (
          <div className="p-8 text-center text-red-500 font-bold">{error || "Không tìm thấy đơn hàng"}</div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Information */}
              <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
                <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tên:</span>
                    <span className="font-medium text-dark dark:text-white">
                      {order.customer_name || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số điện thoại:</span>
                    <span className="font-medium text-dark dark:text-white">
                      {order.customer_phone || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="font-medium text-dark dark:text-white">
                      {order.customer_email || "Chưa cập nhật"}
                    </span>
                  </div>
                  {order.user_address?.address_line && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Địa chỉ:</span>
                      <span className="font-medium text-dark dark:text-white text-right max-w-[60%]">
                        {(() => {
                          const line = order.user_address.address_line;
                          if (line?.trim().startsWith("{")) {
                            try {
                              const parsed = JSON.parse(line);
                              return parsed.address || parsed.address_line || line;
                            } catch (e) {
                              return line;
                            }
                          }
                          return line;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
                <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trạng thái:</span>
                    <Badge variant={STATUS_COLORS[order.order_status] || "warning"}>
                      {STATUS_LABELS[order.order_status] || order.order_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Loại đơn hàng:</span>
                    <span className="font-medium text-dark dark:text-white">
                      {ORDER_TYPE_LABELS[order.order_type] || order.order_type}
                    </span>
                  </div>
                  {order.order_type === 'pickup' && order.store && (
                    <div className="flex flex-col border-t border-stroke pt-2 mt-2 dark:border-dark-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cửa hàng nhận:</span>
                        <span className="font-bold text-primary">{order.store.store_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Địa chỉ:</span>
                        <span className="font-medium text-dark dark:text-white text-right max-w-[70%]">{order.store.address}</span>
                      </div>
                      {order.store.hotline && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Hotline:</span>
                          <span className="font-medium text-dark dark:text-white">{order.store.hotline}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phương thức thanh toán:</span>
                    <span className="font-medium text-dark dark:text-white">
                      {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trạng thái thanh toán:</span>
                    <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                      {order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Badge>
                  </div>
                  {order.pickup_time && (
                    <div className="flex justify-between border-t border-stroke pt-1.5 mt-1.5 dark:border-dark-3 font-semibold">
                      <span className="text-gray-400">Thời gian nhận hàng:</span>
                      <span className="font-extrabold text-[#d4a017]">
                        {dayjs(order.pickup_time).format("HH:mm - DD/MM/YYYY")}
                      </span>
                    </div>
                  )}
                  {order.estimated_delivery_time && (
                    <div className="flex justify-between border-t border-stroke pt-1.5 mt-1.5 dark:border-dark-3 font-semibold">
                      <span className="text-gray-400">Giao hàng dự kiến:</span>
                      <span className="font-extrabold text-[#d4a017]">
                        {dayjs(order.estimated_delivery_time).format("HH:mm - DD/MM/YYYY")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chi tiết món */}
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                Món ăn đã đặt ({order.items?.length || 0} món)
              </h3>
              <div className="divide-y divide-stroke dark:divide-dark-3 border border-stroke dark:border-dark-3 p-5 rounded-xl space-y-4 bg-gray-50/20 dark:bg-dark-2/10">
                {(order.items || []).map((item: any, idx: number) => {
                  let dishName = '';
                  let imageSrc = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
                  let itemSpec = '';

                  const isCombo = !!item.combo_id;
                  const isHalfHalf = !!item.is_half_half;

                  if (isCombo) {
                    dishName = item.combo?.combo_name || `Combo #${item.combo_id}`;
                    imageSrc = item.combo?.image_combo || 'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=100&auto=format&fit=crop';
                  } else if (isHalfHalf) {
                    dishName = 'PIZZA HALF & HALF';
                    imageSrc = 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=100&auto=format&fit=crop';
                    const size = item.dish_price?.size?.size_name;
                    const crust = item.dish_price?.crust?.crust_name;
                    itemSpec = `${size ? `SIZE: ${size.toUpperCase()}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` - CRUST: ${crust.toUpperCase()}` : ''}`;
                  } else {
                    dishName = item.dish_price?.dish?.dish_name || 'Món ăn';
                    imageSrc = item.dish_price?.dish?.image || imageSrc;
                    const isPizza = dishName.toLowerCase().includes('pizza');
                    if (isPizza) {
                      const size = item.dish_price?.size?.size_name;
                      const crust = item.dish_price?.crust?.crust_name;
                      itemSpec = `${size ? `SIZE: ${size.toUpperCase()}` : ''}${crust && crust.toLowerCase() !== 'none' ? ` - CRUST: ${crust.toUpperCase()}` : ''}`;
                    }
                  }

                  return (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <img
                          src={imageSrc}
                          alt={dishName}
                          className="w-16 h-16 rounded-full object-cover shrink-0 border border-stroke dark:border-dark-3 shadow-md"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-extrabold text-sm md:text-base text-dark dark:text-white leading-snug">
                            {dishName}
                          </h4>
                          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                            Số lượng: x{item.quantity}
                          </div>
                          {itemSpec && (
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">
                              {itemSpec}
                            </p>
                          )}

                          {/* Render combo details */}
                          {isCombo && item.combos && item.combos.length > 0 && (
                            <div className="mt-2 pl-3 border-l-2 border-primary/20 text-xs space-y-2 text-gray-500 dark:text-gray-400">
                              {item.combos.map((sel: any, cIdx: number) => {
                                const selDishName = sel.dish_price?.dish?.dish_name || sel.dish_price_id || "Combo item";
                                const selSizeName = sel.dish_price?.size?.size_name;
                                const selCrustName = sel.dish_price?.crust?.crust_name;
                                const isPizza = selDishName.toLowerCase().includes("pizza");
                                const selQtyPrefix = sel.quantity && sel.quantity > 1 ? `${sel.quantity} x ` : "";
                                const selSpec = isPizza && (selSizeName || selCrustName)
                                  ? `${selSizeName ? `SIZE: ${selSizeName.toUpperCase()}` : ''}${selCrustName && selCrustName.toLowerCase() !== 'none' ? ` - CRUST: ${selCrustName.toUpperCase()}` : ''}`
                                  : '';

                                return (
                                  <div key={cIdx} className="space-y-0.5">
                                    <p className="font-bold text-dark dark:text-white">
                                      {cIdx + 1}. {selQtyPrefix}{sel.is_half_half ? 'Pizza Half & Half' : selDishName}
                                    </p>
                                    <div className="pl-3 text-[10px] text-gray-400 space-y-0.5">
                                      {selSpec && <p className="font-bold uppercase tracking-wider text-gray-400">{selSpec}</p>}
                                      {sel.toppings && sel.toppings.length > 0 && (
                                        <p className="italic">
                                          + Topping: {sel.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                                        </p>
                                      )}
                                      {sel.is_half_half && sel.halves && sel.halves.length > 0 && (
                                        <div className="pl-2 border-l border-blue-400/30 py-0.5 space-y-1">
                                          {sel.halves.map((h: any, hIdx: number) => (
                                            <div key={hIdx} className="text-[11px]">
                                              <span className="text-gray-400 font-medium">Nửa {hIdx + 1}: </span>
                                              <span className="font-bold text-dark dark:text-white">{h.dish?.dish_name}</span>
                                              {h.order_item_toppings && h.order_item_toppings.length > 0 && (
                                                <span className="block pl-3 text-[10px] text-gray-400 italic">
                                                  + Topping: {h.order_item_toppings.map((t: any) => `${t.topping?.topping_name} (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {sel.order_combo_note && (
                                        <p className="text-red-500 italic text-[11px]">Ghi chú: {sel.order_combo_note}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Render half-half details */}
                          {isCombo ? null : (isHalfHalf && item.halves && item.halves.length > 0 && (
                            <div className="mt-2 pl-3 border-l-2 border-blue-500/20 text-xs space-y-1.5 text-gray-500 dark:text-gray-400">
                              {item.halves.map((h: any, hIdx: number) => (
                                <div key={hIdx} className="text-xs">
                                  <span className="font-semibold">• Nửa {hIdx + 1}: </span>
                                  <span className="font-bold text-dark dark:text-white">{h.dish?.dish_name}</span>
                                  {h.order_item_toppings && h.order_item_toppings.length > 0 && (
                                    <span className="text-gray-400 block ml-3 italic">
                                      + Topping tự chọn: {h.order_item_toppings.map((t: any) => `${t.topping?.topping_name} (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}

                          {/* Render regular toppings */}
                          {!isCombo && !isHalfHalf && item.toppings && item.toppings.length > 0 && (
                            <p className="text-[11px] text-gray-400 font-medium pt-1">
                              + Topping: {item.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                            </p>
                          )}
                          {isHalfHalf && item.toppings && item.toppings.length > 0 && (
                            <p className="text-[11px] text-gray-400 font-medium pt-1">
                              + Topping: {item.toppings.map((t: any) => `${t.topping?.topping_name} (x${t.quantity || 1}) (${(t.topping_price || t.topping?.price_topping || 0).toLocaleString()} đ)`).join(", ")}
                            </p>
                          )}

                          {item.order_item_note && (
                            <p className="text-xs text-red-500 font-bold mt-1 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded inline-block">
                              Ghi chú: {item.order_item_note}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-dark dark:text-white whitespace-nowrap mt-0.5">
                        {(item.order_price || 0).toLocaleString()} đ
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tạm tính:</span>
                  <span className="text-dark dark:text-white">
                    {(order.total_price_dish || 0).toLocaleString()} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phí giao hàng:</span>
                  <span className="text-green-500 font-medium">
                    {order.shipping_fee ? `${order.shipping_fee.toLocaleString()} đ` : "Chưa áp phí ship"}
                  </span>
                </div>
                {(order.discount_amount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Giảm giá:</span>
                    <span className="text-red-500">
                      -{(order.discount_amount || 0).toLocaleString()} đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stroke pt-2 mt-2 dark:border-dark-3">
                  <span className="font-bold text-dark dark:text-white text-base">Tổng cộng:</span>
                  <span className="font-bold text-primary text-lg">
                    {(order.total_order || 0).toLocaleString()} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            {order.order_note && (
              <div className="rounded-xl border border-red-500 bg-red-50 dark:bg-red-950/20 p-4">
                <h3 className="text-sm font-bold text-red-650 dark:text-red-400 mb-2 uppercase tracking-wide">
                  Ghi chú đơn hàng
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 font-semibold italic">&quot;{order.order_note}&quot;</p>
              </div>
            )}

            {/* Cột mốc thời gian */}
            {(() => {
              const milestones = [
                { label: "Đã đặt hàng", time: order.created_at },
                { label: "Đã xác nhận", time: order.confirmed_at },
                { label: "Đang chuẩn bị", time: order.preparing_at },
                { label: "Đang giao hàng", time: order.shipped_at },
                { label: "Đã hoàn thành", time: order.completed_at },
                { label: "Đã hủy", time: order.cancelled_at },
              ].filter(m => m.time);

              if (milestones.length === 0) return null;

              return (
                <div className="rounded-xl border border-stroke p-4 dark:border-dark-3 bg-gray-50/50 dark:bg-dark-2/50">
                  <h3 className="text-sm font-bold text-dark dark:text-white mb-3 uppercase tracking-wide">
                    Tiến trình đơn hàng (Lịch sử)
                  </h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    {milestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="bg-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                          {m.label}
                        </div>
                        <div className="text-[11px] font-bold text-gray-500">
                          {dayjs(m.time).format("HH:mm:ss DD/MM")}
                        </div>
                        {idx < milestones.length - 1 && (
                          <div className="text-gray-300 font-extrabold mx-1">➔</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
