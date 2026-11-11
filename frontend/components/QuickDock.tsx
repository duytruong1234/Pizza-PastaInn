'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, ArrowUp, X, Send, MessageSquare, Paperclip, MoreVertical, Trash2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useUI } from './UIProvider';
import { BACKEND_URL } from '../lib/config';

interface MessageImage {
  image_id: number;
  message_id: number;
  image_url: string;
  uploaded_at: string;
}

interface DBMessage {
  message_id: number;
  room_id: number;
  sender_type: 'customer' | 'admin';
  sender_id: number | null;
  message_text: string;
  is_read: boolean;
  created_at: string;
  images: MessageImage[];
  sender?: {
    user_id: number;
    username: string;
    avatar?: string;
  } | null;
}

interface Message {
  id: number;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: Date;
  images?: string[];
}

const getApiErrorMessage = (err: unknown) => {
  const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || 'Unknown error';
  return status ? `${status}: ${message}` : message;
};

const getApiErrorStatus = (err: unknown) => {
  return (err as { response?: { status?: number } }).response?.status;
};

export default function QuickDock() {
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [inputText, setInputText] = useState('');

  // Live Chat with Admin states
  const { user, clearAuth } = useAuthStore();
  const cartItemsCount = useCartStore(s => s.items.length);
  const { isCartOpen, isCartPinned, theme, lang } = useUI();
  const isLight = theme === 'light';
  const isEn = lang === 'en';
  const [isMounted, setIsMounted] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [roomStatus, setRoomStatus] = useState<string>('pending');
  const [dbMessages, setDbMessages] = useState<DBMessage[]>([]);

  // Guest Register Form States
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Image Upload Preview States
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor scroll height to show/hide Scroll Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto scroll to latest chat message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dbMessages, showGuestForm]);

  // High-frequency Polling for new messages in Live Chat (every 2 seconds)
  useEffect(() => {
    if (!activeRoomId || !chatOpen) return;

    const fetchLiveMessages = async () => {
      try {
        const response = await api.get(`/chat/rooms/${activeRoomId}/messages`);
        if (response.data?.success) {
          setDbMessages(response.data.data);
        }
      } catch (err) {
        console.warn('Error updating live chat messages:', getApiErrorMessage(err));
      }
    };

    // Gọi lần đầu lập tức
    fetchLiveMessages();

    // Thiết lập vòng lặp polling 2 giây
    const interval = setInterval(fetchLiveMessages, 2000);
    return () => clearInterval(interval);
  }, [activeRoomId, chatOpen]);

  // Start Live Chat Mode
  const startLiveChat = async () => {
    setContactOpen(false);
    setChatOpen(true);

    // 1. Nếu người dùng đã đăng nhập -> Kết nối thẳng vào phòng chat
    if (user) {
      try {
        const response = await api.post('/chat/rooms/init', {
          customer_id: user.user_id
        });
        if (response.data?.success) {
          setActiveRoomId(response.data.data.room_id);
          setRoomStatus(response.data.data.room_status);
          setShowGuestForm(false);
        }
      } catch (err) {
        console.warn('Failed to initialize chat room for member:', getApiErrorMessage(err));
        if (getApiErrorStatus(err) === 404) {
          clearAuth();
          setActiveRoomId(null);
          setShowGuestForm(true);
          return;
        }
      }
      return;
    }

    // 2. Nếu là khách vãng lai -> Kiểm tra xem đã có session_id trong sessionStorage chưa
    let sessionId = sessionStorage.getItem('chat_guest_session_id');
    if (sessionId) {
      try {
        const response = await api.post('/chat/rooms/init', {
          guest_session_id: sessionId
        });
        if (response.data?.success && response.data.data) {
          // Khách đã có phòng chat hoạt động trước đó
          setActiveRoomId(response.data.data.room_id);
          setRoomStatus(response.data.data.room_status);
          setShowGuestForm(false);
          return;
        }
      } catch (err) {
        console.warn('Error loading old guest chat room:', getApiErrorMessage(err));
      }
    }

    // Chưa có phòng hoặc chưa điền thông tin -> Hiện form đăng ký khách vãng lai
    setShowGuestForm(true);
  };

  // Submit Guest Register Form
  const handleGuestFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!guestName.trim()) {
      errors.name = 'Vui lòng nhập họ tên';
    }

    const phoneTrimmed = guestPhone.trim();
    if (!phoneTrimmed) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^0\d{9}$/.test(phoneTrimmed)) {
      errors.phone = 'Số điện thoại phải có 10 chữ số bắt đầu bằng 0';
    }

    if (!guestAddress.trim()) {
      errors.address = 'Vui lòng nhập địa chỉ giao hàng';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    let sessionId = sessionStorage.getItem('chat_guest_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('chat_guest_session_id', sessionId);
    }

    try {
      const response = await api.post('/chat/rooms/init', {
        guest_session_id: sessionId,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_address: guestAddress.trim()
      });

      if (response.data?.success) {
        setActiveRoomId(response.data.data.room_id);
        setRoomStatus(response.data.data.room_status);
        setShowGuestForm(false);
      }
    } catch (err) {
      console.warn('Error registering guest chat room:', getApiErrorMessage(err));
    }
  };

  // Image Upload Handler
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
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data?.success) {
        const fullUrl = res.data.data.url.startsWith('http') 
          ? res.data.data.url 
          : `${BACKEND_URL}${res.data.data.url}`;
        
        setPreviewImages((prev) => [...prev, fullUrl]);
      }
    } catch (err) {
      console.warn('Error uploading image:', getApiErrorMessage(err));
      alert('Không thể tải ảnh lên, vui lòng thử lại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove preview image
  const removePreviewImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Send Message (Text & Images) in Live Chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();

    if (!trimmed && previewImages.length === 0) return;
    if (!activeRoomId) return;

    try {
      const payload = {
        message_text: trimmed,
        sender_id: user?.user_id || null,
        image_urls: previewImages
      };

      setInputText('');
      setPreviewImages([]);

      const response = await api.post(`/chat/rooms/${activeRoomId}/messages`, payload);
      if (response.data?.success) {
        const newMsg = response.data.data;
        setDbMessages((prev) => [...prev, newMsg]);
        setRoomStatus('pending');
      }
    } catch (err) {
      console.warn('Failed to send live chat message:', getApiErrorMessage(err));
    }
  };

  const hasMobileCartBar = isMounted && cartItemsCount > 0 && !isCartOpen;
  const isPinnedSidebarOpen = isMounted && isCartPinned && isCartOpen;

  if (
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register')
  ) {
    return null;
  }

  return (
    <>
      {/* ── Cụm nút nổi góc dưới bên phải (Xếp chồng dọc, tự nâng lên khi có thanh giỏ hàng mobile) ── */}
      <div
        className={`fixed z-[90] flex flex-col items-end gap-2.5 transition-all duration-300 select-none ${
          hasMobileCartBar ? 'bottom-20 lg:bottom-6' : 'bottom-5 lg:bottom-6'
        } ${
          isPinnedSidebarOpen
            ? 'right-4 sm:right-6 lg:right-[368px] xl:right-[393px]'
            : 'right-4 sm:right-6'
        } ${isCartOpen && !isCartPinned ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <button
          type="button"
          aria-label={isEn ? 'Open support & chat' : 'Mở hỗ trợ & trò chuyện'}
          title={isEn ? 'Online Support' : 'Hỗ trợ trực tuyến'}
          onClick={() => {
            setContactOpen(!contactOpen);
            setChatOpen(false);
          }}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ee2828] hover:bg-[#d82020] border-2 border-[#9f280a] shadow-[0_6px_24px_rgba(0,0,0,0.35)] cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.78 4.16 2.06 5.74L3 22l4.43-1.07C8.89 21.57 10.4 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-3 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          </svg>
        </button>
      </div>

      {/* ── Contact Support Modal ("Liên hệ hỗ trợ") ──────────────────────────────── */}
      {contactOpen && (
        <div
          className={`fixed z-[1000] w-[calc(100vw-2rem)] sm:w-[400px] border rounded-[28px] p-6 animate-fadeIn select-none overflow-hidden transition-colors duration-200 ${
            isLight
              ? 'bg-white border-zinc-200/90 text-zinc-900 shadow-[0_18px_50px_rgba(0,0,0,0.14)]'
              : 'bg-[#2a1f1a] border-white/[0.08] text-white shadow-[0_15px_45px_rgba(0,0,0,0.5)]'
          } ${
            hasMobileCartBar ? 'bottom-36 lg:bottom-24' : 'bottom-22 lg:bottom-24'
          } ${
            isPinnedSidebarOpen
              ? 'right-4 sm:right-6 lg:right-[380px] xl:right-[400px]'
              : 'right-4 sm:right-6'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <h4 className={`font-extrabold text-lg tracking-wide ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
              {isEn ? 'Customer Support' : 'Liên hệ hỗ trợ'}
            </h4>
            <button 
              onClick={() => setContactOpen(false)}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                isLight
                  ? 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Grid of contact options */}
          <div className="grid grid-cols-2 gap-3.5 my-5">
            {/* Zalo Card */}
            <a 
              href="https://zalo.me/0982636800" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-all ${
                isLight
                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/90 shadow-xs'
                  : 'bg-[#110a04] border-white/[0.04] hover:bg-[#1c1208]/90 shadow'
              }`}
            >
              <svg className={`w-10 h-10 shrink-0 rounded-[10px] ${isLight ? 'border border-zinc-200/80 shadow-2xs' : ''}`} viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="white" />
                <path d="M20 6C11.16 6 4 11.6 4 18.5C4 22.4 6.3 25.8 9.9 27.9L8.2 33.3C8.1 33.6 8.3 34 8.7 34C8.9 34 9.1 33.9 9.2 33.8L15.3 29.8C16.8 30.6 18.4 31 20 31C28.8 31 36 25.4 36 18.5C36 11.6 28.8 6 20 6Z" fill="#0068FF" />
                <text x="20" y="22.5" fill="white" fontSize="9" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle">Zalo</text>
              </svg>
              <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>Zalo</span>
            </a>

            {/* Phone Hotline Card */}
            <a 
              href="tel:0982636800"
              className={`border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-all ${
                isLight
                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/90 shadow-xs'
                  : 'bg-[#110a04] border-white/[0.04] hover:bg-[#1c1208]/90 shadow'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#00b952] flex items-center justify-center text-white shrink-0 shadow-md">
                <svg className="w-5 h-5 fill-white text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23-.13-2.42-.54-3.52-1.21-.36-.22-.8-.17-1.11.14l-2.33 2.33c-2.91-1.49-5.28-3.86-6.77-6.77l2.33-2.33c.31-.31.36-.75.14-1.11C8.14 5.34 7.73 4.15 7.6 2.92c-.1-.97-.91-1.69-1.89-1.69H3.19C2.1 1.23 1.2 2.14 1.26 3.24c.48 8.65 7.4 15.57 16.05 16.05 1.1.06 2.01-.84 2.01-1.93v-2.52c0-.98-.72-1.79-1.31-1.46z" />
                </svg>
              </div>
              <span className={`font-extrabold text-[13px] tracking-tight whitespace-nowrap ${isLight ? 'text-zinc-900' : 'text-white'}`}>0982 636 800</span>
            </a>

            {/* TikTok Card */}
            <a 
              href="https://tiktok.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-all ${
                isLight
                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/90 shadow-xs'
                  : 'bg-[#110a04] border-white/[0.04] hover:bg-[#1c1208]/90 shadow'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-white shadow-md shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.15-.15-.24-.22v6.23c.03 3.58-2.3 6.9-5.83 7.62-3.7 1.07-7.85-1.07-9.04-4.72-1.42-3.9 1-8.23 5.04-9.25.96-.28 1.98-.31 2.97-.13v4.01c-.8-.21-1.68-.16-2.43.23-.97.47-1.6 1.52-1.57 2.61.02 1.6 1.43 2.96 3.03 2.93 1.62-.05 2.93-1.47 2.89-3.08.01-4.73-.01-9.46.02-14.19z"/>
                </svg>
              </div>
              <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>TikTok</span>
            </a>

            {/* Facebook Card */}
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-all ${
                isLight
                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/90 shadow-xs'
                  : 'bg-[#110a04] border-white/[0.04] hover:bg-[#1c1208]/90 shadow'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#1877f2] flex items-center justify-center text-white shadow-md shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>Facebook</span>
            </a>

            {/* Live Chat with Staff Card */}
            <div 
              onClick={() => {
                setContactOpen(false);
                startLiveChat();
              }}
              className={`border p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-all col-span-2 text-left ${
                isLight
                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200/90 shadow-xs'
                  : 'bg-[#110a04] border-white/[0.04] hover:bg-[#1c1208]/90 shadow'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#ee2828]/10 flex items-center justify-center text-[#ee2828] shrink-0">
                <MessageSquare size={20} />
              </div>
              <span className={`font-extrabold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {isEn ? 'Live Chat with Support Staff' : 'Chat với nhân viên hỗ trợ'}
              </span>
            </div>
          </div>

          {/* Footer Info Lines */}
          <div className={`text-left text-xs font-semibold space-y-2 border-t pt-4 mt-1 leading-relaxed ${
            isLight ? 'text-zinc-500 border-zinc-200' : 'text-zinc-300 border-white/5'
          }`}>
            <p>{isEn ? 'Online support available daily from 09:00 to 22:00' : 'Hỗ trợ trực tuyến từ 9:00 đến 22:00 hàng ngày'}</p>
          </div>
        </div>
      )}

      {/* ── Chatbot Panel Window ────────────────────────────────────────── */}
      {chatOpen && (
        <div
          className={`fixed z-[1000] w-[calc(100vw-2rem)] sm:w-[375px] h-[500px] sm:h-[525px] flex flex-col border rounded-[28px] overflow-hidden overscroll-contain animate-fadeIn select-none ${
            isLight
              ? 'bg-white border-zinc-200/90 shadow-[0_18px_50px_rgba(0,0,0,0.14)]'
              : 'bg-[#1a1513] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
          } ${
            hasMobileCartBar ? 'bottom-36 lg:bottom-24' : 'bottom-22 lg:bottom-24'
          } ${
            isPinnedSidebarOpen
              ? 'right-4 sm:right-6 lg:right-[380px] xl:right-[400px]'
              : 'right-4 sm:right-6'
          }`}
        >
          
          {/* Header */}
          <div className="relative bg-gradient-to-b from-[#ee2828] to-[#9f280a] text-white pt-5 pb-9 px-5 rounded-t-[28px] overflow-hidden shrink-0">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                {/* Profile Avatar */}
                <div className="relative w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-white/20">
                  <User className="w-6 h-6 text-[#ee2828]" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-[15px] text-white leading-snug">
                    {isEn ? 'Support Staff' : 'Nhân viên hỗ trợ'}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] text-emerald-400/90 font-semibold">
                      {isEn ? 'Online' : 'Trực tuyến'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Wave Divider */}
            <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none translate-y-[1px] select-none pointer-events-none">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[22px]">
                <path 
                  d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V30.39C1122.56,69.57,1053.47,110.8,985.66,92.83Z" 
                  fill={
                    isLight
                      ? (showGuestForm ? "#ffffff" : "#f4f7f9")
                      : (showGuestForm ? "#1a1513" : "#161311")
                  } 
                />
              </svg>
            </div>
          </div>

          {/* ── Guest Details Form ────────────────────────────────── */}
          {showGuestForm ? (
            <div className={`flex-1 p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar ${
              isLight ? 'bg-white text-zinc-900' : 'bg-[#1a1513] text-white'
            }`}>
              <div className="text-center pt-2">
                <h3 className={`font-extrabold text-[17px] tracking-wide ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  {isEn ? 'CONNECT WITH SUPPORT STAFF' : 'KẾT NỐI VỚI NHÂN VIÊN HỖ TRỢ'}
                </h3>
                <p className={`text-xs mt-1.5 leading-relaxed max-w-[280px] mx-auto font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {isEn
                    ? 'Please provide your details so our staff can assist you quickly!'
                    : 'Vui lòng cung cấp thông tin để nhân viên hỗ trợ bạn tốt nhất!'}
                </p>
              </div>

              <form onSubmit={handleGuestFormSubmit} className="space-y-4 my-5 flex-1 flex flex-col justify-center text-left">
                {/* Full name input */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    {isEn ? 'Full Name (*)' : 'Họ và tên (*)'}
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={isEn ? 'Enter your name' : 'Nhập họ tên'}
                    className={`w-full border rounded-xl py-3 px-4 focus:outline-none transition-all text-sm font-semibold ${
                      isLight
                        ? 'bg-zinc-50 text-zinc-900 border-zinc-200 focus:bg-white focus:border-[#d4a017] placeholder-zinc-400'
                        : 'bg-[#2a221f] text-white border-white/[0.08] focus:border-amber-500 placeholder-zinc-500 shadow-inner'
                    }`}
                  />
                  {formErrors.name && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.name}</span>
                  )}
                </div>

                {/* Phone number input */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    {isEn ? 'Phone Number (*)' : 'Số điện thoại (*)'}{' '}
                    <span className={`font-semibold text-[11px] ml-1 ${isLight ? 'text-[#b45309]' : 'text-[#ffc107]'}`}>
                      {isEn ? '(10 digits starting with 0)' : '(10 chữ số bắt đầu bằng 0)'}
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder={isEn ? 'Enter phone number' : 'Nhập số điện thoại'}
                    className={`w-full border rounded-xl py-3 px-4 focus:outline-none transition-all text-sm font-semibold ${
                      isLight
                        ? 'bg-zinc-50 text-zinc-900 border-zinc-200 focus:bg-white focus:border-[#d4a017] placeholder-zinc-400'
                        : 'bg-[#2a221f] text-white border-white/[0.08] focus:border-amber-500 placeholder-zinc-500 shadow-inner'
                    }`}
                  />
                  {formErrors.phone && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.phone}</span>
                  )}
                </div>

                {/* Delivery address input */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    {isEn ? 'Delivery Address (*)' : 'Địa chỉ giao hàng (*)'}
                  </label>
                  <input
                    type="text"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    placeholder={isEn ? 'Enter delivery address' : 'Nhập địa chỉ'}
                    className={`w-full border rounded-xl py-3 px-4 focus:outline-none transition-all text-sm font-semibold ${
                      isLight
                        ? 'bg-zinc-50 text-zinc-900 border-zinc-200 focus:bg-white focus:border-[#d4a017] placeholder-zinc-400'
                        : 'bg-[#2a221f] text-white border-white/[0.08] focus:border-amber-500 placeholder-zinc-500 shadow-inner'
                    }`}
                  />
                  {formErrors.address && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.address}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ffc107] hover:bg-[#ffb300] active:scale-95 text-zinc-950 font-black text-sm uppercase py-4 rounded-2xl shadow-lg transition-all tracking-wider mt-2.5 cursor-pointer"
                >
                  {isEn ? 'Start Chat' : 'Bắt đầu chat'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages List Area */}
              <div className={`flex-1 overflow-y-auto overscroll-contain p-4.5 space-y-4 custom-scrollbar ${
                isLight ? 'bg-[#f4f7f9]' : 'bg-[#161311]'
              }`}>
                
                {roomStatus === 'closed' && (
                  <div className={`border rounded-xl p-2.5 text-xs font-semibold leading-relaxed mx-2 text-center ${
                    isLight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {isEn
                      ? 'Conversation has ended. Send a new message to reopen.'
                      : 'Cuộc trò chuyện đã kết thúc. Gửi tin nhắn mới để mở lại.'}
                  </div>
                )}

                {dbMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400 select-none">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-30 animate-pulse text-[#ee2828]" />
                    <p className={`text-xs font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {isEn ? 'No messages yet' : 'Chưa có tin nhắn'}
                    </p>
                    <p className="text-[10px] text-zinc-400/80 mt-1">
                      {isEn ? 'Say hello to start chatting with our staff!' : 'Gửi lời chào để bắt đầu trò chuyện với nhân viên!'}
                    </p>
                  </div>
                ) : (
                  dbMessages.map((msg) => {
                    const isAdmin = msg.sender_type === 'admin';
                    return (
                      <div 
                        key={msg.message_id} 
                        className={`flex gap-2.5 max-w-[85%] ${!isAdmin ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div 
                          className={`px-4 py-2.5 text-[13px] font-medium leading-relaxed shadow-sm text-left ${
                            !isAdmin 
                              ? 'bg-[#007a3f] text-white rounded-[20px] rounded-tr-none' 
                              : isLight
                                ? 'bg-white border border-zinc-200/70 text-[#202c3d] rounded-[20px] rounded-tl-none'
                                : 'bg-[#241e1a] border border-white/[0.08] text-zinc-100 rounded-[20px] rounded-tl-none'
                          }`}
                        >
                          {msg.message_text && <p className="whitespace-pre-wrap">{msg.message_text}</p>}
                          
                          {/* Attached image previews */}
                          {msg.images && msg.images.length > 0 && (
                            <div className={`grid gap-1.5 mt-1.5 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {msg.images.map((img) => (
                                <a 
                                  key={img.image_id} 
                                  href={img.image_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block rounded-lg overflow-hidden border border-black/5 hover:opacity-90 active:scale-95 transition-all shadow-inner"
                                >
                                  <img 
                                    src={img.image_url} 
                                    alt="attachment" 
                                    className="max-h-[140px] w-full object-cover" 
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                          
                          <span className={`block text-[9px] mt-1 select-none font-bold text-right ${!isAdmin ? 'text-white/60' : 'text-zinc-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Form Input Area */}
              <form 
                onSubmit={handleSendMessage}
                className={`border-t relative p-3 pb-3.5 shrink-0 ${
                  isLight ? 'bg-white border-zinc-200/80' : 'bg-[#1c1714] border-white/[0.08]'
                }`}
              >
                {/* Image Upload Attachment Previews in Input Area */}
                {previewImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 shrink-0 select-none">
                    {previewImages.map((url, idx) => (
                      <div key={idx} className={`relative w-14 h-14 rounded-lg overflow-hidden border shrink-0 shadow-sm ${
                        isLight ? 'border-zinc-200' : 'border-white/15'
                      }`}>
                        <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePreviewImage(idx)}
                          className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 transition-colors cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input field */}
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isUploading ? (isEn ? 'Uploading image...' : 'Đang tải ảnh...') : (isEn ? 'Type a message...' : 'Nhập tin nhắn...')}
                  disabled={isUploading}
                  className={`w-full bg-transparent focus:outline-none text-[13px] pl-4 pr-16 py-2.5 font-semibold ${
                    isLight ? 'text-[#202c3d] placeholder-zinc-400' : 'text-white placeholder-zinc-500'
                  }`}
                />
                
                {/* Hidden File Input for Image Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  id="chat-image-input"
                />

                {/* Bottom Row: Actions & Send Button */}
                <div className="flex items-center justify-between px-3.5 pt-1 pb-1">
                  <div className="flex items-center gap-3.5 text-zinc-400">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="hover:text-[#007a3f] transition-colors cursor-pointer" 
                      title="Đính kèm ảnh"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                  
                  {/* Send Button */}
                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="w-11 h-11 bg-[#007a3f] hover:bg-[#005a2e] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all absolute right-4 bottom-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={18} className="transform rotate-45 -translate-x-[2px] -translate-y-[1px]" />
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      )}
    </>
  );
}
