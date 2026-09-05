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
  const { theme } = useUI();
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
  const [orderCheckLoading, setOrderCheckLoading] = useState(false);
  const [orderCheckReason, setOrderCheckReason] = useState<string | null>(null);

  // Reviews list
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Show form only when we have a valid order to review OR editing
  const showForm = (canReview && orderId && user) || editingReviewId;

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
              // Initialize all item ratings to 0
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
              } catch (e) {
                imgs = [r.image_url];
              }
            }

            let formattedTime = 'Recently';
            if (r.created_at) {
              const date = new Date(r.created_at);
              formattedTime = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }

            return {
              id: r.review_id,
              name: r.user?.username?.toUpperCase() || 'LOYAL CUSTOMER',
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
      alert('Only image files are accepted (jpg, png, gif, webp)');
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
        alert('Failed to upload image, please try again.');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Server connection error while uploading image.');
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
    // Populate item ratings from the review
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
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setUserComment('');
    setReviewImages([]);
    setOrderItems([]);
    setItemRatings({});
  };

  const handleDeleteReview = async (reviewId: number | string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

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
        alert('An error occurred while deleting the review.');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Could not connect to the server.');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please log in to submit your review!');
      window.location.href = '/login?redirect=/reviews';
      return;
    }

    // Validate all items have been rated
    const ratedItems = Object.entries(itemRatings).filter(([, rating]) => rating > 0);
    if (ratedItems.length === 0) {
      alert('Please rate at least one dish!');
      return;
    }

    const unratedItems = Object.entries(itemRatings).filter(([, rating]) => rating === 0);
    if (unratedItems.length > 0) {
      alert(`Please rate all dishes! Missing: ${unratedItems.map(([name]) => name).join(', ')}`);
      return;
    }

    const commentText = userComment || 'The quality of food and service here is absolutely wonderful!';

    // Build item_ratings payload
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
        alert(errorJson?.message || 'An error occurred while submitting review, please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Could not connect to the server. Please try again later.');
    }
  };

  // Calculate average rating from reviews
  const avgRating = reviewsList.length > 0
    ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length).toFixed(1)
    : '0.0';

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header static wrap since reviews is client component */}
      <header className="bg-[#121424]/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
        <HeaderClient storeName="Pizza&PastaInn" />
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full text-center select-none">

        {/* Page Header */}
        <div className="space-y-3 mb-12">
          <h1 className={`text-3xl md:text-5xl font-black tracking-wide uppercase leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            CUSTOMER REVIEWS & FEEDBACK
          </h1>
        </div>

        {/* LAYOUT: Conditional grid */}
        <div className={`grid grid-cols-1 ${showForm ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>

          {/* LEFT COLUMN: REVIEW FORM (only when showForm is true) */}
          {showForm && (
            <div className={`lg:col-span-5 border rounded-[28px] p-6 md:p-8 space-y-6 shadow-2xl flex flex-col text-left transition-all duration-300 ${theme === 'dark' ? 'bg-[#121212] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
              <div className="self-start px-3 py-1 rounded-full bg-[#f5c043]/10 border border-[#f5c043]/20 text-[#f5c043] text-[10px] font-black uppercase tracking-wider">
                CUSTOMER FEEDBACK
              </div>

              {orderId && !editingReviewId && (
                <div className="self-start px-3 py-1 rounded-full bg-[#007a3f]/15 border border-[#007a3f]/30 text-[#007a3f] dark:text-[#3cd070] text-[10px] font-black uppercase tracking-wider animate-pulse">
                  Reviewing Order #PIZZA-{orderId}
                </div>
              )}

              <div className="space-y-1">
                <h3 className={`text-xl md:text-2xl font-black uppercase tracking-wide leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {editingReviewId ? 'EDIT YOUR REVIEW' : 'RATE YOUR DISHES'}
                </h3>
                <p className={`text-xs font-medium leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {editingReviewId
                    ? 'Update your previously shared experience at Pizza & Pasta Inn.'
                    : 'Rate each dish you ordered and share your experience.'}
                </p>
              </div>

              {/* Per-Item Ratings */}
              {orderItems.length > 0 && (
                <div className="space-y-3">
                  <span className={`text-[11px] font-extrabold tracking-wider uppercase block ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                    RATE EACH DISH (*)
                  </span>
                  <div className="space-y-3">
                    {orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${theme === 'dark'
                          ? 'bg-[#0d0d0d] border-white/[0.06]'
                          : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {/* Dish Image */}
                        {item.image && (
                          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm">
                            <img
                              src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {!item.image && (
                          <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-800 text-zinc-600' : 'bg-gray-200 text-gray-400'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2l1.578 4.657A2 2 0 0 0 6.484 8H21" /><path d="M6 8v13" /><path d="M13 8v13" /><path d="M6 15h7" /><path d="M6 11h7" /></svg>
                          </div>
                        )}

                        {/* Dish Name */}
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-bold uppercase tracking-wide block truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                            {item.name}
                          </span>
                          {item.quantity > 1 && (
                            <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                              x{item.quantity}
                            </span>
                          )}
                        </div>

                        {/* Star Rating */}
                        <div className="flex gap-0.5 shrink-0">
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
                    Thank you! Review submitted successfully.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: REVIEWS LIST (full width when no form) */}
          <div className={`${showForm ? 'lg:col-span-7' : ''} space-y-6 flex flex-col text-left`}>

            {/* Loading State */}
            {reviewsLoading && (
              <div className={`border rounded-[24px] p-12 text-center shadow-md ${theme === 'dark' ? 'bg-[#121212]/80 border-white/[0.04]' : 'bg-white border-gray-150'}`}>
                <div className="animate-spin w-8 h-8 border-2 border-[#f5c043] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Loading reviews...
                </p>
              </div>
            )}

            {/* Empty State */}
            {!reviewsLoading && reviewsList.length === 0 && (
              <div className={`border rounded-[24px] p-12 text-center shadow-md space-y-4 ${theme === 'dark' ? 'bg-[#121212]/80 border-white/[0.04]' : 'bg-white border-gray-150'}`}>
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-800/50 text-zinc-600' : 'bg-gray-100 text-gray-400'}`}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div className="space-y-1.5">
                  <h4 className={`text-base font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    NO REVIEWS YET
                  </h4>
                  <p className={`text-xs font-medium leading-relaxed max-w-sm mx-auto ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    Be the first to share your dining experience! Complete an order and leave your honest feedback.
                  </p>
                </div>
              </div>
            )}

            {/* Reviews List Container */}
            {!reviewsLoading && reviewsList.length > 0 && (
              <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
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

                    {/* Per-Item Ratings */}
                    {review.itemRatings && review.itemRatings.length > 0 && (
                      <div className={`rounded-2xl border p-3 space-y-2 ${theme === 'dark' ? 'bg-[#0d0d0d]/60 border-white/[0.04]' : 'bg-gray-50/80 border-gray-100'}`}>
                        <span className={`text-[9px] font-black tracking-widest uppercase block ${theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'}`}>
                          DISH RATINGS
                        </span>
                        <div className="space-y-1.5">
                          {review.itemRatings.map((ir, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {/* Mini dish image */}
                              {ir.dish_image ? (
                                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-sm">
                                  <img
                                    src={ir.dish_image.startsWith('http') ? ir.dish_image : `${BACKEND_URL}${ir.dish_image}`}
                                    alt={ir.dish_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-800 text-zinc-600' : 'bg-gray-200 text-gray-400'}`}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2l1.578 4.657A2 2 0 0 0 6.484 8H21" /><path d="M6 8v13" /><path d="M13 8v13" /><path d="M6 15h7" /><path d="M6 11h7" /></svg>
                                </div>
                              )}
                              {/* Name */}
                              <span className={`text-[11px] font-bold flex-1 truncate ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}`}>
                                {ir.dish_name}
                              </span>
                              {/* Stars */}
                              <div className="flex gap-px shrink-0">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon key={star} filled={star <= ir.rating_star} size={9} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                            Response from Store
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
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            Delete
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
            )}

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
