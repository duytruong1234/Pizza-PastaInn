'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, ArrowUp, X, Send, MessageSquare, Paperclip, MoreVertical, Trash2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
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
  const [contactOpen, setContactOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [inputText, setInputText] = useState('');

  // Live Chat with Admin states
  const { user, clearAuth } = useAuthStore();
  const [showGuestForm, setShowGuestForm] = useState(false);
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
      errors.name = 'Please enter your full name';
    }

    const phoneTrimmed = guestPhone.trim();
    if (!phoneTrimmed) {
      errors.phone = 'Please enter your phone number';
    } else if (!/^0\d{9}$/.test(phoneTrimmed)) {
      errors.phone = 'Phone number must be 10 digits starting with 0';
    }

    if (!guestAddress.trim()) {
      errors.address = 'Please enter delivery address';
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
      alert('Only image files are accepted (jpg, png, gif, webp)');
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
      alert('Unable to upload image, please try again');
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

  return (
    <>
      {/* ── "Chat ngay" Floating Circular Button at Bottom-Left ──────────────────────── */}
      <div
        onClick={() => {
          setContactOpen(!contactOpen);
          setChatOpen(false);
        }}
        className="fixed left-6 bottom-6 z-[999] flex items-center justify-center w-14 h-14 rounded-full bg-[#ee2828] border-2 border-[#9f280a] shadow-[0_5px_25px_rgba(0,0,0,0.25)] cursor-pointer hover:scale-105 active:scale-95 transition-all select-none"
      >
        <svg className="w-7 h-7 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.78 4.16 2.06 5.74L3 22l4.43-1.07C8.89 21.57 10.4 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-3 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      </div>

      {/* ── Contact Support Modal ("Liên hệ hỗ trợ") ──────────────────────────────── */}
      {contactOpen && (
        <div className="fixed left-6 bottom-24 z-[1000] w-[420px] bg-[#2a1f1a] border border-white/[0.08] rounded-[28px] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.5)] text-white animate-fadeIn select-none overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <h4 className="font-extrabold text-lg tracking-wide text-zinc-100">
              Contact Support
            </h4>
            <button 
              onClick={() => setContactOpen(false)}
              className="text-zinc-400 hover:text-white rounded-lg p-1.5 hover:bg-white/5 transition-colors cursor-pointer"
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
              className="bg-[#110a04] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1c1208]/90 active:scale-[0.97] transition-all shadow"
            >
              <svg className="w-10 h-10 shrink-0" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="white" />
                <path d="M20 6C11.16 6 4 11.6 4 18.5C4 22.4 6.3 25.8 9.9 27.9L8.2 33.3C8.1 33.6 8.3 34 8.7 34C8.9 34 9.1 33.9 9.2 33.8L15.3 29.8C16.8 30.6 18.4 31 20 31C28.8 31 36 25.4 36 18.5C36 11.6 28.8 6 20 6Z" fill="#0068FF" />
                <text x="20" y="22.5" fill="white" fontSize="9" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle">Zalo</text>
              </svg>
              <span className="font-extrabold text-sm text-white">Zalo</span>
            </a>

            {/* Phone Hotline Card */}
            <a 
              href="tel:0982636800"
              className="bg-[#110a04] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1c1208]/90 active:scale-[0.97] transition-all shadow"
            >
              <div className="w-10 h-10 rounded-full bg-[#00b952] flex items-center justify-center text-white shrink-0 shadow-md">
                <svg className="w-5 h-5 fill-white text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23-.13-2.42-.54-3.52-1.21-.36-.22-.8-.17-1.11.14l-2.33 2.33c-2.91-1.49-5.28-3.86-6.77-6.77l2.33-2.33c.31-.31.36-.75.14-1.11C8.14 5.34 7.73 4.15 7.6 2.92c-.1-.97-.91-1.69-1.89-1.69H3.19C2.1 1.23 1.2 2.14 1.26 3.24c.48 8.65 7.4 15.57 16.05 16.05 1.1.06 2.01-.84 2.01-1.93v-2.52c0-.98-.72-1.79-1.31-1.46z" />
                </svg>
              </div>
              <span className="font-extrabold text-[13px] text-white tracking-tight whitespace-nowrap">0982 636 800</span>
            </a>

            {/* TikTok Card */}
            <a 
              href="https://tiktok.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#110a04] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1c1208]/90 active:scale-[0.97] transition-all shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-white shadow-md shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.15-.15-.24-.22v6.23c.03 3.58-2.3 6.9-5.83 7.62-3.7 1.07-7.85-1.07-9.04-4.72-1.42-3.9 1-8.23 5.04-9.25.96-.28 1.98-.31 2.97-.13v4.01c-.8-.21-1.68-.16-2.43.23-.97.47-1.6 1.52-1.57 2.61.02 1.6 1.43 2.96 3.03 2.93 1.62-.05 2.93-1.47 2.89-3.08.01-4.73-.01-9.46.02-14.19z"/>
                </svg>
              </div>
              <span className="font-extrabold text-sm text-white">TikTok</span>
            </a>

            {/* Facebook Card */}
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#110a04] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1c1208]/90 active:scale-[0.97] transition-all shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1877f2] flex items-center justify-center text-white shadow-md shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="font-extrabold text-sm text-white">Facebook</span>
            </a>

            {/* Live Chat with Staff Card */}
            <div 
              onClick={() => {
                setContactOpen(false);
                startLiveChat();
              }}
              className="bg-[#110a04] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1c1208]/90 active:scale-[0.97] transition-all shadow col-span-2 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#ee2828]/10 flex items-center justify-center text-[#ee2828] shrink-0">
                <MessageSquare size={20} />
              </div>
              <span className="font-extrabold text-sm text-white">Chat với nhân viên hỗ trợ</span>
            </div>
          </div>

          {/* Footer Info Lines */}
          <div className="text-left text-xs font-semibold text-zinc-300 space-y-2 border-t border-white/5 pt-4 mt-1 leading-relaxed">
            <p>Live support from 9:00 AM to 10:00 PM daily</p>
          </div>
        </div>
      )}

      {/* ── Chatbot Panel Window ────────────────────────────────────────── */}
      {chatOpen && (
        <div className="fixed left-6 bottom-24 z-[1000] w-[375px] h-[525px] flex flex-col bg-white border border-zinc-200/80 rounded-[28px] shadow-[0_15px_45px_rgba(0,0,0,0.12)] overflow-hidden overscroll-contain animate-fadeIn select-none">
          
          {/* Header */}
          <div className="relative bg-gradient-to-b from-[#ee2828] to-[#9f280a] text-white pt-5 pb-9 px-5 rounded-t-[28px] overflow-hidden shrink-0">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                {/* Profile Avatar */}
                <div className="relative w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-white/20">
                  <User className="w-6 h-6 text-[#ee2828]" />
                </div>
                <div className="text-left">
                  <span className="text-zinc-300 text-[10px] font-semibold tracking-wide block uppercase leading-none">
                    Live Support
                  </span>
                  <h4 className="font-extrabold text-[15px] text-white tracking-wide leading-snug mt-0.5">
                    Support Staff
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider">Online</span>
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
                  fill={showGuestForm ? "#1a1513" : "#f4f7f9"} 
                />
              </svg>
            </div>
          </div>

          {/* ── Guest Details Form ────────────────────────────────── */}
          {showGuestForm ? (
            <div className="flex-1 bg-[#1a1513] text-white p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <div className="text-center pt-2">
                <h3 className="font-extrabold text-zinc-100 text-[17px] tracking-wide">
                  CONNECT WITH OUR SUPPORT STAFF
                </h3>
                <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed max-w-[280px] mx-auto font-medium">
                  Please provide your information so our staff can assist you best!
                </p>
              </div>

              <form onSubmit={handleGuestFormSubmit} className="space-y-4 my-5 flex-1 flex flex-col justify-center text-left">
                {/* Full name input */}
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1.5">
                    Full Name (*)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#2a221f] text-white border border-white/[0.08] rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-500 text-sm font-semibold shadow-inner"
                  />
                  {formErrors.name && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.name}</span>
                  )}
                </div>

                {/* Phone number input */}
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1.5">
                    Phone Number (*) <span className="text-[#ffc107] font-bold normal-case tracking-normal ml-1">Format: 10 digits starting with 0</span>
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full bg-[#2a221f] text-white border border-white/[0.08] rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-500 text-sm font-semibold shadow-inner"
                  />
                  {formErrors.phone && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.phone}</span>
                  )}
                </div>

                {/* Delivery address input */}
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1.5">
                    Delivery Address (*)
                  </label>
                  <input
                    type="text"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    placeholder="Enter your address"
                    className="w-full bg-[#2a221f] text-white border border-white/[0.08] rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-500 text-sm font-semibold shadow-inner"
                  />
                  {formErrors.address && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.address}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ffc107] hover:bg-[#ffb300] active:scale-95 text-zinc-950 font-black text-sm uppercase py-4 rounded-2xl shadow-lg transition-all tracking-wider mt-2.5 cursor-pointer"
                >
                  Start Chatting
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages List Area */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4.5 space-y-4 bg-[#f4f7f9] custom-scrollbar">
                
                <div className="text-center py-1 select-none">
                  <span className="px-3 py-1 bg-zinc-200/60 rounded-full text-zinc-500 text-[10px] font-extrabold uppercase tracking-wide">
                    Live Support Channel
                  </span>
                  {roomStatus === 'closed' && (
                    <div className="mt-2.5 bg-rose-50 border border-rose-100/50 rounded-xl p-2.5 text-rose-600 text-xs font-semibold leading-relaxed mx-2">
                      Conversation has ended. Send a new message to reopen the chat.
                    </div>
                  )}
                </div>

                {dbMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400 select-none">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-30 animate-pulse text-[#ee2828]" />
                    <p className="text-xs font-bold">No messages yet</p>
                    <p className="text-[10px] text-zinc-400/80 mt-1">Say hello to start chatting with our staff!</p>
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
                              : 'bg-white border border-zinc-100/50 text-[#202c3d] rounded-[20px] rounded-tl-none'
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
                className="bg-white border-t border-zinc-100/80 relative p-3 pb-3.5 shrink-0"
              >
                {/* Image Upload Attachment Previews in Input Area */}
                {previewImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 shrink-0 select-none">
                    {previewImages.map((url, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 shrink-0 shadow-sm">
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
                  placeholder={isUploading ? "Uploading image..." : "Type a message..."}
                  disabled={isUploading}
                  className="w-full bg-transparent text-[#202c3d] focus:outline-none placeholder-zinc-400 text-[13px] pl-4 pr-16 py-2.5 font-semibold"
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
                      title="Attach image"
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
