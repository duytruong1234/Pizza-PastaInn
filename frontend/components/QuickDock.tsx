'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, ArrowUp, X, Send, Sparkles, MessageSquare, Paperclip, MoreVertical, Trash2, ImageIcon } from 'lucide-react';
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

export default function QuickDock() {
  const [contactOpen, setContactOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // AI ChefBot Messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: "Hi! Chào mừng bạn đến với Pizza & Pasta Inn. Tôi là ChefBot, trợ lý ẩm thực AI của bạn! Tôi có thể giúp gì cho bạn hôm nay? Hãy hỏi tôi về pizza, mỳ ý hoặc tra cứu đơn hàng nhé! Để được nhân viên cửa hàng hỗ trợ trực tiếp, bạn vui lòng nhấn chọn 'Gặp nhân viên' hoặc gửi tin nhắn số '1'. Pizza & Pasta Inn xin cảm ơn!",
      timestamp: new Date(),
    },
  ]);

  // Live Chat with Admin states
  const { user } = useAuthStore();
  const [liveChatActive, setLiveChatActive] = useState(false);
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
  }, [messages, dbMessages, isTyping, liveChatActive, showGuestForm]);

  // High-frequency Polling for new messages in Live Chat (every 2 seconds)
  useEffect(() => {
    if (!liveChatActive || !activeRoomId || !chatOpen) return;

    const fetchLiveMessages = async () => {
      try {
        const response = await api.get(`/chat/rooms/${activeRoomId}/messages`);
        if (response.data?.success) {
          setDbMessages(response.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật tin nhắn live chat:', err);
      }
    };

    // Gọi lần đầu lập tức
    fetchLiveMessages();

    // Thiết lập vòng lặp polling 2 giây
    const interval = setInterval(fetchLiveMessages, 2000);
    return () => clearInterval(interval);
  }, [liveChatActive, activeRoomId, chatOpen]);

  // AI ChefBot Smart Responses
  const handleSendChefBotMessage = (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    if (trimmed === '1') {
      const userMsg: Message = {
        id: Date.now(),
        sender: 'user',
        text: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      startLiveChat();
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = '';
      const lower = trimmed.toLowerCase();

      if (lower.includes('pizza') || lower.includes('bánh')) {
        botResponse = 'Ôi, bạn nhất định phải thử Seafood Pizza đặc trưng (với tôm tươi, mực và phô mai mozzarella béo ngậy) hoặc bánh Double Cheese huyền thoại của chúng tôi! Bạn có muốn tôi dẫn bạn tới menu không?';
      } else if (lower.includes('pasta') || lower.includes('mì')) {
        botResponse = 'Mamma Mia! Món Mỳ Ý Carbonara Sốt Kem của chúng tôi cực kỳ nổi tiếng, được làm từ sốt lòng đỏ trứng béo ngậy, thịt xông khói giòn và phô mai parmesan. Chúng tôi cũng có Spaghetti Bolognese truyền thống nữa đấy!';
      } else if (lower.includes('track') || lower.includes('đơn hàng') || lower.includes('tra cứu') || lower.includes('lookup')) {
        botResponse = 'Việc tra cứu đơn hàng vô cùng đơn giản! Hãy nhấp vào mục Tra cứu đơn hàng trên thanh menu và nhập số điện thoại để kiểm tra trạng thái đơn hàng thời gian thực nhé!';
      } else if (lower.includes('hour') || lower.includes('giờ') || lower.includes('mở cửa') || lower.includes('open')) {
        botResponse = 'Chúng tôi rất hân hạnh được phục vụ bạn tất cả các ngày trong tuần từ 9:00 AM đến 10:00 PM! Đặt mua trực tuyến để thưởng thức pizza nóng hổi giao tận nơi trong vòng 45 phút!';
      } else if (lower.includes('promotion') || lower.includes('khuyến mãi') || lower.includes('giảm giá')) {
        botResponse = 'Tin vui đây! Chúng tôi đang áp dụng chương trình FREESHIP cho mọi đơn hàng trên 200.000 đ! Bạn cũng có thể tìm thấy các mã giảm giá hấp dẫn khác ngay tại trang Checkout.';
      } else if (lower.includes('nhân viên') || lower.includes('quản trị') || lower.includes('gặp admin') || lower.includes('live chat') || lower.includes('tư vấn')) {
        botResponse = 'Để gặp trực tiếp nhân viên tư vấn, vui lòng nhấp vào nút "Gặp nhân viên" ngay bên dưới hoặc trong menu Hỗ trợ nhé!';
      } else {
        botResponse = "Đó là một câu hỏi tuyệt vời! Tôi là ChefBot và tôi có thể gợi ý các món ăn ngon, chia sẻ giờ mở cửa hoặc hướng dẫn tra cứu đơn hàng. Bạn có muốn kết nối với nhân viên hỗ trợ trực tiếp không?";
      }

      const botMsg: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

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
          setLiveChatActive(true);
          setShowGuestForm(false);
        }
      } catch (err) {
        console.error('Không thể khởi tạo chat room cho thành viên:', err);
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
          setLiveChatActive(true);
          setShowGuestForm(false);
          return;
        }
      } catch (err) {
        console.error('Lỗi khi tải phòng chat khách vãng lai cũ:', err);
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
      errors.name = 'Vui lòng nhập họ và tên';
    }

    const phoneTrimmed = guestPhone.trim();
    if (!phoneTrimmed) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^0\d{9}$/.test(phoneTrimmed)) {
      errors.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0';
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
        setLiveChatActive(true);
        setShowGuestForm(false);
      }
    } catch (err) {
      console.error('Lỗi đăng ký phòng chat khách vãng lai:', err);
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
      // Gọi tới API upload dùng chung của backend
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data?.success) {
        // Địa chỉ URL đầy đủ
        const fullUrl = res.data.data.url.startsWith('http') 
          ? res.data.data.url 
          : `${BACKEND_URL}${res.data.data.url}`;
        
        setPreviewImages((prev) => [...prev, fullUrl]);
      }
    } catch (err) {
      console.error('Lỗi tải ảnh lên:', err);
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

  // Send Message (Text & Images) in Live Chat or Bot
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();

    if (!trimmed && previewImages.length === 0) return;

    if (!liveChatActive) {
      handleSendChefBotMessage();
      return;
    }

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
        setRoomStatus('pending'); // Reset room status back to pending/active when customer sends a message
      }
    } catch (err) {
      console.error('Không thể gửi tin nhắn live chat:', err);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    if (suggestionText === 'Gặp nhân viên hỗ trợ') {
      startLiveChat();
    } else {
      if (liveChatActive) {
        setInputText(suggestionText);
      } else {
        handleSendChefBotMessage(suggestionText);
      }
    }
  };

  const openChefBot = () => {
    setContactOpen(false);
    setLiveChatActive(false);
    setShowGuestForm(false);
    setChatOpen(true);
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
              Liên hệ hỗ trợ
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

            {/* ChefBot AI Assistant & Live Chat Unified Card */}
            <div 
              onClick={openChefBot}
              className="bg-[#110a04] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1c1208]/90 active:scale-[0.97] transition-all shadow col-span-2"
            >
              <svg className="w-10 h-10 shrink-0 text-[#ee2828]" viewBox="0 0 100 100" fill="currentColor">
                <path d="M 12,40 C 7,40 7,64 12,64 Z" />
                <rect x="9" y="24" width="3" height="20" rx="1.5" />
                <path d="M 88,40 C 93,40 93,64 88,64 Z" />
                <rect x="88" y="24" width="3" height="20" rx="1.5" />
                <path d="M 50,15 C 24,15 10,29 10,50 C 10,60 14,70 20,76 L 16,87 C 15.7,87.8 16.5,88.5 17.2,88.2 L 29,82 C 35,84.5 42,85 50,85 C 76,85 90,71 90,50 C 90,29 76,15 50,15 Z" />
                <rect x="22" y="32" width="56" height="36" rx="15" fill="white" />
                <path d="M 32,50 Q 38,42 44,50" stroke="#ee2828" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 55,50 Q 62,42 68,50" stroke="#ee2828" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 46,58 Q 50,64 55,58" stroke="#ee2828" strokeWidth="4" strokeLinecap="round" fill="none" />
              </svg>
              <span className="font-extrabold text-sm text-white">Trợ lý ChefBot AI & Chat Trực tuyến</span>
            </div>
          </div>

          {/* Footer Info Lines */}
          <div className="text-left text-xs font-semibold text-zinc-300 space-y-2 border-t border-white/5 pt-4 mt-1 leading-relaxed">
            <p>Hỗ trợ trực tuyến từ 9:00 AM đến 10:00 PM hàng ngày</p>
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
                  {liveChatActive ? (
                    <Bot className="w-6 h-6 text-[#ee2828]" />
                  ) : (
                    <svg className="w-8 h-8 text-[#ee2828]" viewBox="0 0 100 100" fill="currentColor">
                      <path d="M 12,40 C 7,40 7,64 12,64 Z" />
                      <rect x="9" y="24" width="3" height="20" rx="1.5" />
                      <path d="M 88,40 C 93,40 93,64 88,64 Z" />
                      <rect x="88" y="24" width="3" height="20" rx="1.5" />
                      <path d="M 50,15 C 24,15 10,29 10,50 C 10,60 14,70 20,76 L 16,87 C 15.7,87.8 16.5,88.5 17.2,88.2 L 29,82 C 35,84.5 42,85 50,85 C 76,85 90,71 90,50 C 90,29 76,15 50,15 Z" />
                      <rect x="22" y="32" width="56" height="36" rx="15" fill="white" />
                      <path d="M 32,50 Q 38,42 44,50" stroke="#ee2828" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                      <path d="M 55,50 Q 62,42 68,50" stroke="#ee2828" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                      <path d="M 46,58 Q 50,64 55,58" stroke="#ee2828" strokeWidth="4" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className="text-zinc-300 text-[10px] font-semibold tracking-wide block uppercase leading-none">
                    {liveChatActive ? 'Live Support' : 'Chat with'}
                  </span>
                  <h4 className="font-extrabold text-[15px] text-white tracking-wide leading-snug mt-0.5">
                    {liveChatActive ? 'Nhân viên hỗ trợ' : 'ChefBot AI'}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider">Trực tuyến</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => {
                    if (liveChatActive) {
                      setLiveChatActive(false);
                      setDbMessages([]);
                      setShowGuestForm(false);
                    } else {
                      startLiveChat();
                    }
                  }}
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all border ${
                    liveChatActive
                      ? "bg-white text-[#ee2828] border-white shadow"
                      : "bg-transparent text-white border-white/30 hover:border-white"
                  }`}
                  title={liveChatActive ? "Chuyển về Bot tự động" : "Kết nối với nhân viên trực tiếp"}
                >
                  {liveChatActive ? (
                    <span className="flex items-center gap-1">
                      <Bot size={13} className="shrink-0" />
                      <span>Hỏi Bot AI</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MessageSquare size={13} className="shrink-0" />
                      <span>Gặp nhân viên</span>
                    </span>
                  )}
                </button>
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

          {/* ── Guest Details Form (Mockup Exactly) ────────────────────────────────── */}
          {showGuestForm ? (
            <div className="flex-1 bg-[#1a1513] text-white p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <div className="text-center pt-2">
                <h3 className="font-extrabold text-zinc-100 text-[17px] tracking-wide">
                  KẾT NỐI VỚI NHÂN VIÊN CỦA CỬA HÀNG
                </h3>
                <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed max-w-[280px] mx-auto font-medium">
                  Vui lòng cung cấp thông tin để nhân viên chi nhánh hỗ trợ bạn tốt nhất nhé!
                </p>
              </div>

              <form onSubmit={handleGuestFormSubmit} className="space-y-4 my-5 flex-1 flex flex-col justify-center">
                {/* Full name input */}
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1.5">
                    Họ và tên (*)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full bg-[#2a221f] text-white border border-white/[0.08] rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-500 text-sm font-semibold shadow-inner"
                  />
                  {formErrors.name && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.name}</span>
                  )}
                </div>

                {/* Phone number input */}
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1.5">
                    Số điện thoại (*) <span className="text-[#ffc107] font-bold normal-case tracking-normal ml-1">ĐK: 10 SỐ BẮT ĐẦU = 0</span>
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Nhập số điện thoại của bạn"
                    className="w-full bg-[#2a221f] text-white border border-white/[0.08] rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-500 text-sm font-semibold shadow-inner"
                  />
                  {formErrors.phone && (
                    <span className="text-red-500 text-[10px] font-bold block mt-1">{formErrors.phone}</span>
                  )}
                </div>

                {/* Delivery address input */}
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1.5">
                    Địa chỉ giao hàng (*)
                  </label>
                  <input
                    type="text"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    placeholder="Nhập địa chỉ của bạn"
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
                  Bắt đầu trò chuyện
                </button>
              </form>

              <button 
                type="button"
                onClick={() => setShowGuestForm(false)}
                className="text-zinc-500 hover:text-zinc-400 text-xs font-bold text-center underline cursor-pointer"
              >
                Quay lại ChefBot AI
              </button>
            </div>
          ) : (
            <>
              {/* Messages List Area */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4.5 space-y-4 bg-[#f4f7f9] custom-scrollbar">
                
                {/* 1. Màn hình Live Chat với Admin */}
                {liveChatActive ? (
                  <>
                    <div className="text-center py-1 select-none">
                      <span className="px-3 py-1 bg-zinc-200/60 rounded-full text-zinc-500 text-[10px] font-extrabold uppercase tracking-wide">
                        Kênh hỗ trợ trực tuyến
                      </span>
                      {roomStatus === 'closed' && (
                        <div className="mt-2.5 bg-rose-50 border border-rose-100/50 rounded-xl p-2.5 text-rose-600 text-xs font-semibold leading-relaxed mx-2">
                          Hội thoại đã kết thúc. Gửi tin nhắn mới để mở lại phòng chat nhé!
                        </div>
                      )}
                    </div>

                    {dbMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-zinc-400 select-none">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-30 animate-pulse text-[#ee2828]" />
                        <p className="text-xs font-bold">Chưa có tin nhắn nào</p>
                        <p className="text-[10px] text-zinc-400/80 mt-1">Hãy gửi lời chào đầu tiên tới nhân viên nhé!</p>
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
                              className={`px-4 py-2.5 text-[13px] font-medium leading-relaxed shadow-sm ${
                                !isAdmin 
                                  ? 'bg-[#007a3f] text-white rounded-[20px] rounded-tr-none' 
                                  : 'bg-white border border-zinc-100/50 text-[#202c3d] rounded-[20px] rounded-tl-none'
                              }`}
                            >
                              {msg.message_text && <p className="whitespace-pre-wrap">{msg.message_text}</p>}
                              
                              {/* Bong bóng hiển thị hình ảnh đính kèm */}
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
                  </>
                ) : (
                  
                  // 2. Màn hình AI ChefBot mặc định
                  <>
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div 
                          className={`px-4 py-2.5 text-[13px] font-medium leading-relaxed shadow-sm ${
                            msg.sender === 'user' 
                              ? 'bg-[#007a3f] text-white rounded-[20px] rounded-tr-none' 
                              : 'bg-white border border-zinc-100/50 text-[#202c3d] rounded-[20px] rounded-tl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-2.5 max-w-[85%]">
                        <div className="bg-white border border-zinc-100/50 rounded-[20px] rounded-tl-none px-4 py-3.5 flex gap-1.5 items-center shadow-sm">
                          <span className="w-1.5 h-1.5 bg-[#007a3f] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-[#007a3f] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-[#007a3f] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion Chips */}
              <div className="px-4.5 py-2.5 bg-[#f4f7f9] border-t border-zinc-100/50 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 select-none">
                {!liveChatActive && (
                  <button 
                    onClick={() => handleSuggestionClick('Gặp nhân viên hỗ trợ')}
                    className="px-3.5 py-2 rounded-full bg-white border border-zinc-200 text-[#ee2828] border-[#ee2828]/20 text-[11px] font-black hover:bg-[#ee2828] hover:text-white transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Gặp nhân viên</span>
                    <MessageSquare size={12} className="shrink-0" />
                  </button>
                )}
                <button 
                  onClick={() => handleSuggestionClick('Recommend a Pizza')}
                  className="px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-600 text-[11px] font-bold hover:border-[#ee2828] hover:text-[#ee2828] transition-all shadow-sm cursor-pointer"
                >
                  Recommend Pizza
                </button>
                <button 
                  onClick={() => handleSuggestionClick('Recommend a Pasta')}
                  className="px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-600 text-[11px] font-bold hover:border-[#ee2828] hover:text-[#ee2828] transition-all shadow-sm cursor-pointer"
                >
                  Recommend Pasta
                </button>
                <button 
                  onClick={() => handleSuggestionClick('Tra cứu đơn hàng')}
                  className="px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-600 text-[11px] font-bold hover:border-[#ee2828] hover:text-[#ee2828] transition-all shadow-sm cursor-pointer"
                >
                  Tra cứu đơn
                </button>
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
                  placeholder={isUploading ? "Đang tải ảnh lên..." : "Nhập tin nhắn..."}
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
                    {liveChatActive && (
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:text-[#007a3f] transition-colors cursor-pointer" 
                        title="Đính kèm hình ảnh"
                      >
                        <Paperclip size={20} />
                      </button>
                    )}
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
