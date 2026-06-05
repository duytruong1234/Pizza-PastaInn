'use client';

import React, { useState, useEffect } from 'react';
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
    fill={filled ? "#f5c043" : "none"}
    stroke={filled ? "#f5c043" : "#3f3f46"}
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
}

export default function ReviewsPage() {
  const { theme } = useUI();
  const { user } = useAuthStore();
  const [orderId, setOrderId] = useState<string | null>(null);

  // States for interactive reviews panel
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderIdParam = params.get('order_id');
      if (orderIdParam) {
        setOrderId(orderIdParam);
      }
    }
  }, []);

  const mockPhotoPool = [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579751626657-72bc17010498?q=80&w=300&auto=format&fit=crop'
  ];

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([
    {
      id: 1,
      name: 'TRẦN MỸ QUYÊN',
      orderId: 'INN-9921',
      rating: 5,
      comment: 'Đế pizza nướng lò rất thơm và có độ giòn xốp hoàn hảo. Điểm nhấn là đĩa salad kèm xốt giấm tây dầu ô-liu và xốt mayo đặc trưng của quán ăn kèm siêu bắt vị, không bị ngấy mỡ chút nào!',
      images: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=300&auto=format&fit=crop'
      ],
      time: 'Just now'
    },
    {
      id: 2,
      name: 'LÊ HOÀNG NAM',
      orderId: 'INN-8712',
      rating: 5,
      comment: 'Mì Spaghetti truyền thống ở đây luộc chuẩn, số lượng đầy đặn. Phần cơm Ý bùi ngậy béo mềm ăn lúc còn nóng hổi giao tận nơi cực kỳ ngon. Đóng gói hộp giấy rất lịch sự và bảo vệ môi trường.',
      images: [],
      time: '1 hour ago'
    }
  ]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/reviews?limit=50`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.reviews) {
          const mapped = json.data.reviews.map((r: any) => {
            let imgs: string[] = [];
            if (r.image_url) {
              try {
                if (r.image_url.startsWith('[')) {
                  imgs = JSON.parse(r.image_url);
                } else {
                  imgs = [r.image_url];
                }
              } catch (e) {
                imgs = [r.image_url];
              }
            }

            let formattedTime = 'Recently';
            if (r.created_at) {
              const date = new Date(r.created_at);
              formattedTime = date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
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
              shopReply: r.shop_reply || null
            };
          });

          if (mapped.length > 0) {
            setReviewsList(mapped);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleTriggerFileInput = () => {
    if (reviewImages.length >= 5) return;
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)');
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
        alert('Không thể tải ảnh lên, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Lỗi kết nối máy chủ khi tải ảnh.');
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
    setUserRating(review.rating);
    setUserComment(review.comment);
    setReviewImages(review.images);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setUserRating(0);
    setUserComment('');
    setReviewImages([]);
  };

  const handleDeleteReview = async (reviewId: number | string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;

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
        alert('Có lỗi xảy ra khi xóa đánh giá.');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để gửi đánh giá của bạn!');
      window.location.href = '/login?redirect=/reviews';
      return;
    }

    if (userRating === 0) {
      alert('Vui lòng chọn mức độ hài lòng của bạn!');
      return;
    }

    const commentText = userComment || 'Chất lượng món ăn và dịch vụ của quán quá tuyệt vời!';

    try {
      let response;
      if (editingReviewId) {
        response = await fetch(`${API_BASE}/reviews/${editingReviewId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating_star: userRating,
            comment: commentText,
            image_url: reviewImages,
            user_id: user ? user.user_id : undefined,
          }),
        });
      } else {
        response = await fetch(`${API_BASE}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating_star: userRating,
            comment: commentText,
            image_url: reviewImages,
            order_id: orderId ? parseInt(orderId) : undefined,
            user_id: user ? user.user_id : undefined,
          }),
        });
      }

      if (response.ok) {
        setUserRating(0);
        setUserComment('');
        setReviewImages([]);
        setEditingReviewId(null);
        setOrderId(null); // Mất hình 2 khi gửi/hoàn thành đánh giá đơn hàng
        setSubmitted(true);

        // Tự động làm mới trang sạch sẽ sau 1.2 giây để xóa ?order_id trên URL và cập nhật feed mới
        setTimeout(() => {
          setSubmitted(false);
          window.location.href = '/reviews';
        }, 1200);
      } else {
        alert('Có lỗi xảy ra khi gửi đánh giá, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header static wrap since reviews is client component */}
      <header className="bg-[#121424]/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
        <HeaderClient storeName="Pizza&PastaInn" />
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full text-center select-none">

        {/* Page Header */}
        <div className="space-y-3 mb-12">
          <span className="text-[#f5c043] text-xs font-black tracking-[0.2em] uppercase block">
            FEEDBACK HUB
          </span>
          <h1 className={`text-3xl md:text-5xl font-black tracking-wide uppercase leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            CUSTOMER REVIEWS & FEEDBACK
          </h1>
          <div className="w-16 h-1 bg-[#f5c043] mx-auto rounded-full mt-4"></div>
        </div>

        {/* DUAL-COLUMN REVIEWS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: REVIEW FORM */}
          <div className={`lg:col-span-5 border rounded-[28px] p-6 md:p-8 space-y-6 shadow-2xl flex flex-col text-left transition-all duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
            <div className="self-start px-3 py-1 rounded-full bg-[#f5c043]/10 border border-[#f5c043]/20 text-[#f5c043] text-[10px] font-black uppercase tracking-wider">
              CUSTOMER FEEDBACK
            </div>

            {orderId && (
              <div className="self-start px-3 py-1 rounded-full bg-[#007a3f]/15 border border-[#007a3f]/30 text-[#007a3f] dark:text-[#3cd070] text-[10px] font-black uppercase tracking-wider animate-pulse">
                Reviewing Order #PIZZA-{orderId}
              </div>
            )}

            <div className="space-y-1">
              <h3 className={`text-xl md:text-2xl font-black uppercase tracking-wide leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {editingReviewId ? 'EDIT YOUR REVIEW' : 'REVIEW OUR SERVICE'}
              </h3>
              <p className={`text-xs font-medium leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                {editingReviewId
                  ? 'Update your previously shared experience at Pizza & Pasta Inn.'
                  : 'How was your dining experience and service at Pizza & Pasta Inn?'}
              </p>
            </div>

            {!user ? (
              <div className="rounded-2xl border border-[#f5c043]/20 bg-[#f5c043]/5 p-6 text-center space-y-4 shadow-inner">
                <div className="w-12 h-12 rounded-full bg-[#f5c043]/15 flex items-center justify-center mx-auto text-[#f5c043]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h4 className={`text-base font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    BẠN CẦN ĐĂNG NHẬP
                  </h4>
                  <p className={`text-xs font-medium leading-relaxed max-w-xs mx-auto ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Khách vãng lai không được phép bình luận. Vui lòng đăng nhập tài khoản của bạn để gửi đánh giá món ăn và dịch vụ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.href = '/login?redirect=/reviews'}
                  className={`w-full font-black text-xs tracking-widest uppercase py-3.5 rounded-2xl shadow-md active:scale-[0.99] transition-all cursor-pointer ${theme === 'dark'
                      ? 'bg-[#f5c043] hover:bg-[#e5b33c] text-black'
                      : 'bg-[#007a3f] hover:bg-[#006030] text-white'
                    }`}
                >
                  ĐĂNG NHẬP NGAY
                </button>
              </div>
            ) : (
              <>
                {/* Rating */}
                <div className="space-y-2 pt-2">
                  <span className={`text-[11px] font-extrabold tracking-wider uppercase block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    SATISFACTION LEVEL (*)
                  </span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        filled={star <= userRating}
                        size={28}
                        onClick={() => setUserRating(star)}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <span className={`text-[11px] font-extrabold tracking-wider uppercase block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    YOUR REVIEW
                  </span>
                  <textarea
                    className={`w-full border rounded-2xl p-4 text-sm focus:outline-none transition-colors ${theme === 'dark'
                        ? 'bg-[#0d0d0d] border-white/[0.06] focus:border-[#f5c043]/40 text-zinc-300 placeholder-zinc-650'
                        : 'bg-gray-50 border-gray-200 focus:border-[#007a3f]/40 text-gray-800 placeholder-gray-400'
                      }`}
                    placeholder="Share your experience about our dishes and service here..."
                    rows={4}
                    value={userComment}
                    onChange={e => setUserComment(e.target.value)}
                  />
                </div>

                {/* Attached Images */}
                <div className="space-y-2">
                  <span className={`text-[11px] font-extrabold tracking-wider uppercase block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    REAL PHOTOS (MAXIMUM 5 IMAGES)
                  </span>

                  <div className="flex flex-wrap gap-3 items-center">
                    {reviewImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group shadow-md shrink-0 select-none">
                        <img src={img} alt="Attached review photo" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-bold text-xs font-sans"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {reviewImages.length < 5 && (
                      <button
                        type="button"
                        onClick={handleTriggerFileInput}
                        disabled={isUploading}
                        className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all select-none focus:outline-none cursor-pointer ${theme === 'dark'
                            ? 'border-zinc-800 hover:border-[#f5c043]/30 bg-[#0d0d0d] hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                            : 'border-gray-300 hover:border-[#007a3f]/30 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <CameraIcon size={18} />
                        <span className="text-[8px] font-black mt-1 tracking-wider uppercase">
                          {isUploading ? 'LOADING...' : 'ADD PHOTO'}
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
                    onClick={handleSubmitReview}
                    className={`w-full font-black text-xs tracking-widest uppercase py-4 rounded-2xl shadow-lg active:scale-[0.99] transition-all cursor-pointer ${theme === 'dark'
                        ? 'bg-[#f5c043] hover:bg-[#e5b33c] text-black'
                        : 'bg-[#007a3f] hover:bg-[#006030] text-white'
                      }`}
                  >
                    {editingReviewId ? 'UPDATE YOUR REVIEW' : 'SUBMIT YOUR REVIEW'}
                  </button>
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className={`w-full font-black text-xs tracking-widest uppercase py-3.5 rounded-2xl border transition-all cursor-pointer ${theme === 'dark'
                          ? 'border-zinc-800 hover:border-zinc-700 bg-transparent text-zinc-400 hover:text-zinc-300'
                          : 'border-gray-200 hover:border-gray-300 bg-transparent text-gray-500 hover:text-gray-600'
                        }`}
                    >
                      CANCEL EDIT
                    </button>
                  )}
                  {submitted && (
                    <p className="text-center text-[#10b981] text-xs font-bold mt-2 animate-fadeIn">
                      ✓ Thank you! Review submitted successfully.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: REVIEWS LIST */}
          <div className="lg:col-span-7 space-y-6 flex flex-col text-left">

            {/* General Customer Reviews Card */}
            <div className={`border rounded-[24px] p-6 flex justify-between items-center shadow-xl transition-all duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06]' : 'bg-white border-gray-200'
              }`}>
              <div className="space-y-1">
                <h4 className={`text-sm font-extrabold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  GENERAL CUSTOMER REVIEWS
                </h4>
                <p className={`text-[10px] md:text-xs font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Based on authentic purchase data history
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-3xl font-black tracking-wide ${theme === 'dark' ? 'text-[#f5c043]' : 'text-[#007a3f]'}`}>4.9 / 5</span>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={true} size={11} />
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews List Container */}
            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {reviewsList.map((review) => (
                <div
                  key={review.id}
                  className={`border rounded-[24px] p-6 space-y-4 shadow-md transition-all animate-fadeIn ${theme === 'dark'
                      ? 'bg-[#121212]/80 border-white/[0.04] hover:border-white/[0.08]'
                      : 'bg-white border-gray-150 hover:border-gray-250'
                    }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className={`font-extrabold text-sm md:text-base uppercase tracking-wide block ${theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                        {review.name}
                      </span>
                    </div>

                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= review.rating} size={11} />
                      ))}
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className={`text-xs md:text-[13.5px] leading-relaxed font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                    }`}>
                    {review.comment}
                  </p>

                  {/* Attached Images */}
                  {review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {review.images.map((img, idx) => (
                        <div key={idx} className={`relative w-16 h-16 rounded-xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'border-white/[0.06]' : 'border-gray-200'
                          }`}>
                          <img src={img} alt="User review photo" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Shop Reply Container */}
                  {review.shopReply && (
                    <div className="mt-3.5 rounded-2xl bg-[#007a3f]/5 border border-[#007a3f]/15 p-4 relative text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#007a3f] dark:text-[#3cd070]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline">
                            <polyline points="9 17 4 12 9 7" />
                            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                          </svg>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#007a3f] dark:text-[#3cd070]">
                          Phản hồi từ cửa hàng
                        </span>
                      </div>
                      <p className={`text-xs md:text-[13px] leading-relaxed font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-650'
                        }`}>
                        {review.shopReply}
                      </p>
                    </div>
                  )}

                  {/* Footer Time & User Actions */}
                  <div className="flex justify-between items-center pt-1">
                    {user && review.userId === user.user_id && (
                      <div className="flex gap-3 text-[11px] font-black uppercase tracking-wider select-none">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(review)}
                          className="text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] md:text-xs text-zinc-500 font-medium italic block ml-auto">
                      {review.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </main>

      {/* Footer wrapped nicely */}
      <div className={`px-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-100 border-t border-gray-200'}`}>
        <Footer />
      </div>
    </div>
  );
}
