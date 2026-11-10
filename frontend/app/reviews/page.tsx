'use client';

import React, { useState, useEffect, useCallback } from 'react';
import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import { useUI } from '@/components/UIProvider';
import { useAuthStore } from '@/store/authStore';
import { API_BASE, BACKEND_URL } from '@/lib/config';

// Helper Icon Components for Review Section
const StarIcon = ({ filled, size = 18, onClick }: { filled: boolean; size?: number; onClick?: () => void }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? '#f5c043' : 'none'}
    stroke={filled ? '#f5c043' : '#71717a'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-all duration-150 ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
    onClick={onClick}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CameraIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

interface ReviewItemRating {
  id?: number;
  dish_name: string;
  dish_image: string | null;
  rating_star: number;
}

interface ReviewItem {
  id: number | string;
  name: string;
  userId?: number | null;
  orderId: string;
  rating: number;
  comment: string;
  images: string[];
  time: string;
  shopReply?: string | null;
  itemRatings: ReviewItemRating[];
}

interface OrderCheckItem {
  name: string;
  image: string | null;
  quantity: number;
}

export default function ReviewsPage() {
  const { theme, lang, td } = useUI();
  const isDark = theme === 'dark';
  const isEn = lang === 'en';
  const { user } = useAuthStore();
  const [orderId, setOrderId] = useState<string | null>(null);

  // Review form states
  const [userComment, setUserComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | string | null>(null);

  // Order check states
  const [canReview, setCanReview] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderCheckItem[]>([]);
  const [itemRatings, setItemRatings] = useState<{ [key: string]: number }>({});
  const [, setOrderCheckLoading] = useState(false);
  const [, setOrderCheckReason] = useState<string | null>(null);

  // Reviews list & filter
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | '5' | '4' | '3' | 'photos'>('all');

  // Show form only when we have a valid order to review OR editing
  const showForm = Boolean((canReview && orderId && user) || editingReviewId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderIdParam = params.get('order_id');
      if (orderIdParam) {
        setOrderId(orderIdParam);
      }
    }
  }, []);

  // Check order eligibility when orderId or user changes
  useEffect(() => {
    if (!orderId || !user) {
      setCanReview(false);
      setOrderItems([]);
      setOrderCheckReason(null);
      return;
    }

    const checkOrder = async () => {
      setOrderCheckLoading(true);
      try {
        const res = await fetch(`${API_BASE}/reviews/order-check/${orderId}?user_id=${user.user_id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCanReview(json.data.canReview);
            if (json.data.canReview && json.data.items) {
              setOrderItems(json.data.items);
              const ratings: { [key: string]: number } = {};
              json.data.items.forEach((item: OrderCheckItem) => {
                ratings[item.name] = 0;
              });
              setItemRatings(ratings);
            } else {
              setOrderCheckReason(json.data.reason || null);
            }
          }
        }
      } catch (error) {
        console.error('Error checking order eligibility:', error);
      } finally {
        setOrderCheckLoading(false);
      }
    };

    checkOrder();
  }, [orderId, user]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews?limit=50`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.reviews) {
          const mapped: ReviewItem[] = json.data.reviews.map((r: any) => {
            let imgs: string[] = [];
            if (r.image_url) {
              try {
                if (r.image_url.startsWith('[')) {
                  imgs = JSON.parse(r.image_url);
                } else {
                  imgs = [r.image_url];
                }
              } catch {
                imgs = [r.image_url];
              }
            }

            let formattedTime = 'Vừa xong';
            if (r.created_at) {
              const date = new Date(r.created_at);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              formattedTime = `${hours}:${minutes} • ${day}/${month}/${year}`;
            }

            return {
              id: r.review_id,
              name: r.user?.username?.toUpperCase() || 'KHÁCH HÀNG THÂN THIẾT',
              userId: r.user_id || null,
              orderId: r.order_id ? `${r.order_id}` : 'ONLINE',
              rating: r.rating_star || 5,
              comment: r.comment || '',
              images: imgs,
              time: formattedTime,
              shopReply: r.shop_reply || null,
              itemRatings: r.item_ratings || [],
            };
          });

          setReviewsList(mapped);
        } else {
          setReviewsList([]);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleTriggerFileInput = () => {
    if (reviewImages.length >= 5) return;
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận định dạng ảnh (jpg, png, gif, webp)');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.url) {
          const fullUrl = json.data.url.startsWith('http')
            ? json.data.url
            : `${BACKEND_URL}${json.data.url}`;
          setReviewImages((prev) => [...prev, fullUrl]);
        }
      } else {
        alert('Tải ảnh lên thất bại, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Lỗi kết nối máy chủ khi tải ảnh lên.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== idx));
  };

  const handleStartEdit = (review: ReviewItem) => {
    setEditingReviewId(review.id);
    setUserComment(review.comment);
    setReviewImages(review.images);
    if (review.itemRatings && review.itemRatings.length > 0) {
      setOrderItems(review.itemRatings.map(ir => ({
        name: ir.dish_name,
        image: ir.dish_image,
        quantity: 1,
      })));
      const ratings: { [key: string]: number } = {};
      review.itemRatings.forEach(ir => {
        ratings[ir.dish_name] = ir.rating_star;
      });
      setItemRatings(ratings);
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setUserComment('');
    setReviewImages([]);
    setOrderItems([]);
    setItemRatings({});
  };

  const handleDeleteReview = async (reviewId: number | string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;

    try {
      const response = await fetch(`${API_BASE}/reviews/${reviewId}?user_id=${user ? user.user_id : ''}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (editingReviewId === reviewId) {
          handleCancelEdit();
        }
        fetchReviews();
      } else {
        alert('Không thể xóa đánh giá, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để gửi đánh giá!');
      window.location.href = '/login?redirect=/reviews';
      return;
    }

    const ratedItems = Object.entries(itemRatings).filter(([, rating]) => rating > 0);
    if (ratedItems.length === 0) {
      alert('Vui lòng chấm sao cho ít nhất một món ăn!');
      return;
    }

    const unratedItems = Object.entries(itemRatings).filter(([, rating]) => rating === 0);
    if (unratedItems.length > 0) {
      alert(`Vui lòng chấm sao đầy đủ các món ăn! Còn thiếu: ${unratedItems.map(([name]) => name).join(', ')}`);
      return;
    }

    const commentText = userComment || 'Chất lượng món ăn và dịch vụ tại quán rất tuyệt vời!';

    const itemRatingsPayload = orderItems.map(item => ({
      dish_name: item.name,
      dish_image: item.image,
      rating_star: itemRatings[item.name] || 5,
    }));

    try {
      let response;
      if (editingReviewId) {
        response = await fetch(`${API_BASE}/reviews/${editingReviewId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: commentText,
            image_url: reviewImages,
            user_id: user.user_id,
            item_ratings: itemRatingsPayload,
          }),
        });
      } else {
        response = await fetch(`${API_BASE}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: commentText,
            image_url: reviewImages,
            order_id: orderId ? parseInt(orderId) : undefined,
            user_id: user.user_id,
            item_ratings: itemRatingsPayload,
          }),
        });
      }

      if (response.ok) {
        setUserComment('');
        setReviewImages([]);
        setEditingReviewId(null);
        setOrderId(null);
        setCanReview(false);
        setOrderItems([]);
        setItemRatings({});
        setSubmitted(true);

        setTimeout(() => {
          setSubmitted(false);
          window.location.href = '/reviews';
        }, 1200);
      } else {
        const errorJson = await response.json().catch(() => null);
        alert(errorJson?.message || 'Đã xảy ra lỗi khi gửi đánh giá, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  // Calculate average rating from reviews
  const avgRating = reviewsList.length > 0
    ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length).toFixed(1)
    : '5.0';

  const filteredReviews = reviewsList.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'photos') return r.images && r.images.length > 0;
    return Math.round(r.rating) === Number(activeFilter);
  });

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0e0c0a] text-white' : 'bg-[#f6f6f7] text-zinc-900'}`}>
      <HeaderClient storeName="Pizza&PastaInn" />

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14 w-full select-none">

        {/* Page Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className={`text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {isEn ? 'CUSTOMER REVIEWS & FEEDBACK' : 'ĐÁNH GIÁ & PHẢN HỒI KHÁCH HÀNG'}
          </h1>
          <p className={`text-xs md:text-sm max-w-xl mx-auto font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isEn
              ? 'Authentic feedback from customers who have dined at Pizza & Pasta Inn.'
              : 'Cảm nhận chân thực từ những khách hàng đã thưởng thức món ăn tại Pizza & Pasta Inn.'}
          </p>
        </div>

        {/* Rating Overview & Filter Bar */}
        {!reviewsLoading && reviewsList.length > 0 && (
          <div className={`border rounded-3xl p-5 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-5 ${
            isDark
              ? 'bg-[#161311] border-white/[0.08] shadow-xl'
              : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            {/* Left: Average Score */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shrink-0 ${
                isDark ? 'bg-[#f5c043]/10 border-[#f5c043]/30 text-[#f5c043]' : 'bg-[#f5c043]/15 border-[#f5c043]/40 text-zinc-900'
              }`}>
                <span className="text-2xl font-black leading-none">{avgRating}</span>
                <span className="text-[10px] font-bold opacity-75 mt-0.5">/ 5.0</span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={star <= Math.round(Number(avgRating))} size={16} />
                  ))}
                </div>
                <p className={`text-xs md:text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {isEn ? `Based on ${reviewsList.length} verified reviews` : `Dựa trên ${reviewsList.length} đánh giá xác thực`}
                </p>
                <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isEn ? '100% reviews from completed orders' : '100% đánh giá từ đơn hàng đã hoàn tất'}
                </p>
              </div>
            </div>

            {/* Right: Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'all', label: isEn ? `All (${reviewsList.length})` : `Tất cả (${reviewsList.length})` },
                { id: '5', label: isEn ? '5 Stars' : '5 Sao' },
                { id: '4', label: isEn ? '4 Stars' : '4 Sao' },
                { id: '3', label: isEn ? '3 Stars' : '3 Sao' },
                { id: 'photos', label: isEn ? 'With Photos' : 'Có hình ảnh' },
              ].map((tab) => {
                const active = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      active
                        ? 'bg-[#f5c043] text-zinc-950 border-[#f5c043] shadow-sm'
                        : isDark
                          ? 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LAYOUT: Conditional grid */}
        <div className={`grid grid-cols-1 ${showForm ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>

          {/* LEFT COLUMN: REVIEW FORM (only when showForm is true) */}
          {showForm && (
            <div className={`lg:col-span-5 border rounded-3xl p-6 md:p-7 space-y-5 shadow-xl flex flex-col text-left transition-all duration-300 ${
              isDark ? 'bg-[#161311] border-white/[0.08]' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#f5c043]/15 border border-[#f5c043]/30 text-[#f5c043] text-[10px] font-black uppercase tracking-wider">
                  {isEn ? 'Submit Review' : 'Gửi đánh giá'}
                </span>
                {orderId && !editingReviewId && (
                  <span className="px-3 py-1 rounded-full bg-[#007a3f]/15 border border-[#007a3f]/30 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
                    {isEn ? `Order #PIZZA-${orderId}` : `Đơn hàng #PIZZA-${orderId}`}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className={`text-xl font-black uppercase tracking-wide leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {editingReviewId
                    ? isEn
                      ? 'EDIT REVIEW'
                      : 'CHỈNH SỬA ĐÁNH GIÁ'
                    : isEn
                      ? 'RATE YOUR DISHES'
                      : 'ĐÁNH GIÁ MÓN ĂN'}
                </h3>
                <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {editingReviewId
                    ? isEn
                      ? 'Update your rating and experience at Pizza & Pasta Inn.'
                      : 'Cập nhật lại đánh giá và trải nghiệm của bạn tại Pizza & Pasta Inn.'
                    : isEn
                      ? 'Please rate each dish in your order and share your experience.'
                      : 'Hãy chấm sao cho từng món ăn trong đơn hàng và chia sẻ cảm nhận của bạn.'}
                </p>
              </div>

              {/* Per-Item Ratings */}
              {orderItems.length > 0 && (
                <div className="space-y-2.5">
                  <span className={`text-[11px] font-extrabold tracking-wider uppercase block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isEn ? 'Rate Each Dish (*)' : 'Chấm sao từng món (*)'}
                  </span>
                  <div className="space-y-2.5">
                    {orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center flex-wrap sm:flex-nowrap gap-3 p-3 rounded-2xl border transition-all ${
                          isDark
                            ? 'bg-white/[0.03] border-white/[0.08]'
                            : 'bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        {item.image ? (
                          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm">
                            <img
                              src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-200 text-zinc-500'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2l1.578 4.657A2 2 0 0 0 6.484 8H21" /><path d="M6 8v13" /><path d="M13 8v13" /><path d="M6 15h7" /><path d="M6 11h7" /></svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-bold block truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {td(item.name)}
                          </span>
                          {item.quantity > 1 && (
                            <span className={`text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {isEn ? `Qty: x${item.quantity}` : `Số lượng: x${item.quantity}`}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              filled={star <= (itemRatings[item.name] || 0)}
                              size={20}
                              onClick={() => setItemRatings(prev => ({ ...prev, [item.name]: star }))}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Text */}
              <div className="space-y-2">
                <span className={`text-[11px] font-extrabold tracking-wider uppercase block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isEn ? 'Your Comment' : 'Nhận xét của bạn'}
                </span>
                <textarea
                  className={`w-full border rounded-2xl p-3.5 text-sm focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10 focus:border-[#f5c043] text-white placeholder-zinc-500'
                      : 'bg-zinc-50 border-zinc-200 focus:border-[#007a3f] text-zinc-900 placeholder-zinc-400'
                  }`}
                  placeholder={
                    isEn
                      ? 'Share your thoughts on the flavor and service...'
                      : 'Chia sẻ cảm nhận của bạn về hương vị món ăn và dịch vụ...'
                  }
                  rows={4}
                  value={userComment}
                  onChange={e => setUserComment(e.target.value)}
                />
              </div>

              {/* Attached Images */}
              <div className="space-y-2">
                <span className={`text-[11px] font-extrabold tracking-wider uppercase block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isEn ? 'Photos (Max 5)' : 'Hình ảnh thực tế (Tối đa 5 ảnh)'}
                </span>

                <div className="flex flex-wrap gap-3 items-center">
                  {reviewImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group shadow-md shrink-0 select-none">
                      <img src={img} alt="Review photo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-bold text-xs"
                      >
                        {isEn ? 'Remove' : 'Xóa'}
                      </button>
                    </div>
                  ))}

                  {reviewImages.length < 5 && (
                    <button
                      type="button"
                      onClick={handleTriggerFileInput}
                      disabled={isUploading}
                      className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all select-none focus:outline-none cursor-pointer ${
                        isDark
                          ? 'border-white/15 hover:border-[#f5c043]/50 bg-white/[0.02] text-zinc-400 hover:text-white'
                          : 'border-zinc-300 hover:border-[#007a3f]/50 bg-zinc-50 text-zinc-500 hover:text-zinc-800'
                      } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <CameraIcon size={18} />
                      <span className="text-[8px] font-black mt-1 tracking-wider uppercase">
                        {isUploading ? (isEn ? 'Uploading...' : 'Đang tải...') : (isEn ? 'Add Photo' : 'Thêm ảnh')}
                      </span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  className={`w-full font-extrabold text-xs tracking-wider uppercase py-3.5 rounded-xl shadow-md active:scale-[0.99] transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#f5c043] hover:bg-[#eab308] text-zinc-950'
                      : 'bg-[#007a3f] hover:bg-[#006332] text-white'
                  }`}
                >
                  {editingReviewId
                    ? isEn
                      ? 'Update Review'
                      : 'Cập nhật đánh giá'
                    : isEn
                      ? 'Submit Review'
                      : 'Gửi đánh giá'}
                </button>
                {editingReviewId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={`w-full font-bold text-xs tracking-wider uppercase py-3 rounded-xl border transition-all cursor-pointer ${
                      isDark
                        ? 'border-white/10 hover:border-white/20 text-zinc-400 hover:text-white'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {isEn ? 'Cancel Edit' : 'Hủy chỉnh sửa'}
                  </button>
                )}
                {submitted && (
                  <p className="text-center text-[#10b981] text-xs font-bold mt-2 animate-fadeIn">
                    {isEn ? 'Thank you! Your review has been submitted.' : 'Cảm ơn bạn! Đánh giá đã được gửi thành công.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: REVIEWS LIST */}
          <div className={`${showForm ? 'lg:col-span-7' : ''} space-y-4 flex flex-col text-left`}>

            {/* Loading State */}
            {reviewsLoading && (
              <div className={`border rounded-3xl p-12 text-center shadow-sm ${isDark ? 'bg-[#161311] border-white/[0.08]' : 'bg-white border-zinc-200'}`}>
                <div className="animate-spin w-8 h-8 border-2 border-[#f5c043] border-t-transparent rounded-full mx-auto mb-4" />
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isEn ? 'Loading customer reviews...' : 'Đang tải danh sách đánh giá...'}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!reviewsLoading && filteredReviews.length === 0 && (
              <div className={`border rounded-3xl p-12 text-center shadow-sm space-y-3 ${isDark ? 'bg-[#161311] border-white/[0.08]' : 'bg-white border-zinc-200'}`}>
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${isDark ? 'bg-white/[0.04] text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div className="space-y-1">
                  <h4 className={`text-base font-extrabold uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {isEn ? 'No matching reviews found' : 'Chưa có đánh giá phù hợp'}
                  </h4>
                  <p className={`text-xs font-medium leading-relaxed max-w-sm mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isEn
                      ? 'Try selecting another filter or place an order to be the first to share your experience!'
                      : 'Hãy thử chọn bộ lọc khác hoặc đặt món ngay để trở thành người đầu tiên chia sẻ cảm nhận!'}
                  </p>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {!reviewsLoading && filteredReviews.length > 0 && (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`border rounded-3xl p-5 md:p-6 space-y-4 transition-all animate-fadeIn ${
                      isDark
                        ? 'bg-[#161311] border-white/[0.08] hover:border-white/15 shadow-lg'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                    }`}
                  >
                    {/* Header: Avatar + Name + Time vs Stars */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          isDark
                            ? 'bg-[#f5c043]/15 text-[#f5c043] border border-[#f5c043]/30'
                            : 'bg-[#ee2828]/10 text-[#ee2828] border border-[#ee2828]/20'
                        }`}>
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-extrabold text-sm md:text-[15px] uppercase tracking-wide ${
                              isDark ? 'text-white' : 'text-zinc-900'
                            }`}>
                              {review.name}
                            </span>
                            {review.orderId && review.orderId !== 'ONLINE' && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isDark
                                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}>
                                {isEn ? `Verified Order #${review.orderId}` : `Đã mua hàng #${review.orderId}`}
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-medium block mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            {review.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-[#f5c043]/10 border border-[#f5c043]/25 px-2.5 py-1 rounded-full">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon key={star} filled={star <= review.rating} size={14} />
                        ))}
                      </div>
                    </div>

                    {/* Comment Text */}
                    <p className={`text-sm md:text-[14.5px] leading-relaxed font-medium ${
                      isDark ? 'text-zinc-200' : 'text-zinc-700'
                    }`}>
                      {review.comment}
                    </p>

                    {/* Per-Item Ratings as Compact Chips */}
                    {review.itemRatings && review.itemRatings.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {review.itemRatings.map((ir, idx) => (
                          <div
                            key={idx}
                            className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
                              isDark
                                ? 'bg-white/[0.03] border-white/[0.07]'
                                : 'bg-zinc-50 border-zinc-200/90'
                            }`}
                          >
                            {ir.dish_image ? (
                              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/10">
                                <img
                                  src={ir.dish_image.startsWith('http') ? ir.dish_image : `${BACKEND_URL}${ir.dish_image}`}
                                  alt={ir.dish_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : null}
                            <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                              {td(ir.dish_name)}
                            </span>
                            <div className="flex gap-0.5 shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon key={star} filled={star <= ir.rating_star} size={11} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attached Images */}
                    {review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {review.images.map((img, idx) => (
                          <div
                            key={idx}
                            className={`relative w-20 h-20 rounded-2xl overflow-hidden border shadow-sm ${
                              isDark ? 'border-white/10' : 'border-zinc-200'
                            }`}
                          >
                            <img src={img} alt="Customer review photo" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Shop Reply Container */}
                    {review.shopReply && (
                      <div className={`mt-2 rounded-2xl border p-4 relative text-left ${
                        isDark
                          ? 'bg-[#007a3f]/10 border-[#007a3f]/25'
                          : 'bg-emerald-50/70 border-emerald-200/80'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[#007a3f] ${isDark ? 'text-emerald-400' : 'text-[#007a3f]'}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
                              <polyline points="9 17 4 12 9 7" />
                              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                            </svg>
                          </span>
                          <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-[#007a3f]'}`}>
                            {isEn ? 'Reply from Pizza & Pasta Inn' : 'Phản hồi từ Pizza & Pasta Inn'}
                          </span>
                        </div>
                        <p className={`text-xs md:text-[13.5px] leading-relaxed font-medium ${
                          isDark ? 'text-zinc-200' : 'text-zinc-700'
                        }`}>
                          {review.shopReply}
                        </p>
                      </div>
                    )}

                    {/* User Actions (Edit / Delete) */}
                    {user && review.userId === user.user_id && (
                      <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-zinc-100'}`}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(review)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {isEn ? 'Edit' : 'Chỉnh sửa'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {isEn ? 'Delete' : 'Xóa'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
