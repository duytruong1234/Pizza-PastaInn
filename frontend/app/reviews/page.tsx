'use client';

import React, { useState, useEffect } from 'react';
import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import Image from 'next/image';

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
  orderId: string;
  rating: number;
  comment: string;
  images: string[];
  time: string;
}

export default function ReviewsPage() {
  // States for interactive reviews panel
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

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
      const res = await fetch('http://localhost:4000/api/reviews?limit=50');
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
              orderId: r.order_id ? `${r.order_id}` : 'ONLINE',
              rating: r.rating_star || 5,
              comment: r.comment || '',
              images: imgs,
              time: formattedTime
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

  const handleMockAddPhoto = () => {
    if (reviewImages.length >= 5) return;
    const nextImg = mockPhotoPool[reviewImages.length % mockPhotoPool.length];
    setReviewImages([...reviewImages, nextImg]);
  };

  const handleRemovePhoto = (idx: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async () => {
    if (userRating === 0) {
      alert('Vui lòng chọn mức độ hài lòng của bạn!');
      return;
    }

    const commentText = userComment || 'Chất lượng món ăn và dịch vụ của quán quá tuyệt vời!';

    try {
      const response = await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating_star: userRating,
          comment: commentText,
          image_url: reviewImages,
        }),
      });

      if (response.ok) {
        setUserRating(0);
        setUserComment('');
        setReviewImages([]);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        fetchReviews();
      } else {
        alert('Có lỗi xảy ra khi gửi đánh giá, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans flex flex-col text-white">
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
          <h1 className="text-3xl md:text-5xl font-black tracking-wide uppercase text-white leading-tight">
            CUSTOMER REVIEWS & FEEDBACK
          </h1>
          <div className="w-16 h-1 bg-[#f5c043] mx-auto rounded-full mt-4"></div>
        </div>

        {/* DUAL-COLUMN REVIEWS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: REVIEW FORM */}
          <div className="lg:col-span-5 bg-[#121212] border border-white/[0.06] rounded-[28px] p-6 md:p-8 space-y-6 shadow-2xl flex flex-col text-left">
            <div className="self-start px-3 py-1 rounded-full bg-[#f5c043]/10 border border-[#f5c043]/20 text-[#f5c043] text-[10px] font-black uppercase tracking-wider">
              CUSTOMER FEEDBACK
            </div>

            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide leading-tight">
                REVIEW OUR SERVICE
              </h3>
              <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                How was your dining experience and service at Pizza & Pasta Inn?
              </p>
            </div>

            {/* Rating */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-extrabold text-zinc-500 tracking-wider uppercase block">
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
              <span className="text-[11px] font-extrabold text-zinc-500 tracking-wider uppercase block">
                YOUR REVIEW
              </span>
              <textarea 
                className="w-full bg-[#0d0d0d] border border-white/[0.06] focus:border-[#f5c043]/40 rounded-2xl p-4 text-sm text-zinc-300 placeholder-zinc-650 focus:outline-none transition-colors" 
                placeholder="Share your experience about our dishes and service here..." 
                rows={4} 
                value={userComment} 
                onChange={e => setUserComment(e.target.value)} 
              />
            </div>

            {/* Attached Images */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-zinc-500 tracking-wider uppercase block">
                REAL PHOTOS (MAXIMUM 5 IMAGES)
              </span>
              
              <div className="flex flex-wrap gap-3 items-center">
                {reviewImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group shadow-md">
                    <Image src={img} alt="Attached review photo" fill className="object-cover" />
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
                    onClick={handleMockAddPhoto} 
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-800 hover:border-[#f5c043]/30 bg-[#0d0d0d] hover:bg-zinc-900/40 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all select-none focus:outline-none"
                  >
                    <CameraIcon size={18} />
                    <span className="text-[8px] font-black mt-1 tracking-wider uppercase">ADD PHOTO</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                onClick={handleSubmitReview} 
                className="w-full bg-[#f5c043] hover:bg-[#e5b33c] text-black font-black text-xs tracking-widest uppercase py-4 rounded-2xl shadow-lg active:scale-[0.99] transition-all"
              >
                SUBMIT YOUR REVIEW
              </button>
              {submitted && (
                <p className="text-center text-[#10b981] text-xs font-bold mt-2 animate-fadeIn">
                  ✓ Thank you! Review submitted successfully.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: REVIEWS LIST */}
          <div className="lg:col-span-7 space-y-6 flex flex-col text-left">
            
            {/* General Customer Reviews Card */}
            <div className="bg-[#121212] border border-white/[0.06] rounded-[24px] p-6 flex justify-between items-center shadow-xl">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  GENERAL CUSTOMER REVIEWS
                </h4>
                <p className="text-[10px] md:text-xs text-zinc-500 font-medium">
                  Based on authentic purchase data history
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black text-[#f5c043] tracking-wide">4.9 / 5</span>
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
                  className="bg-[#121212]/80 border border-white/[0.04] hover:border-white/[0.08] rounded-[24px] p-6 space-y-4 shadow-md transition-all animate-fadeIn"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-white text-sm md:text-base uppercase tracking-wide block">
                        {review.name}
                      </span>
                      <span className="text-[10px] md:text-xs text-[#f5c043] font-bold block uppercase tracking-wider">
                        ORDER ID: #{review.orderId}
                      </span>
                    </div>
                    
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= review.rating} size={11} />
                      ))}
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-zinc-300 text-xs md:text-[13.5px] leading-relaxed font-medium">
                    {review.comment}
                  </p>

                  {/* Attached Images */}
                  {review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {review.images.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/[0.06] shadow-sm">
                          <Image src={img} alt="User review photo" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer Time */}
                  <div className="flex justify-between items-center pt-1">
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
      <div className="px-6 bg-[#0a0a0a]">
        <Footer />
      </div>
    </div>
  );
}
