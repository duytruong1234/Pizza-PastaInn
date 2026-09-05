'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE, BACKEND_URL } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { useAddToCart } from '@/hooks/useAddToCart';
import { MessageCircle, X, Send, Bot, User, ShoppingCart, Loader2, Sparkles, Plus } from 'lucide-react';
import ProductModal from './ProductModal';
import ComboModal from './ComboModal';
import HalfHalfModal from './HalfHalfModal';
import { useAuthStore } from '@/store/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  dishes?: any[];
  combos?: any[];
  follow_up?: string | null;
  timestamp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getImageUrl = (url: string | null) => {
  if (!url) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChatbotWidget() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [guestId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const stored = localStorage.getItem('chatbot_guest_id');
    if (stored) return stored;
    const newId = 'guest_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('chatbot_guest_id', newId);
    return newId;
  });

  // Modal states khi bấm vào món ăn trong chatbot
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [isHalfHalfOpen, setIsHalfHalfOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: 'Xin chào! Tôi là trợ lý tư vấn món ăn của PizzaGenie. Bạn muốn ăn gì hôm nay?',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleAddToCart } = useAddToCart();

  // Cá nhân hóa lời chào khi có user đăng nhập
  useEffect(() => {
    if (user?.username) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'bot') {
          return [{
            role: 'bot',
            content: `Xin chào ${user.username}! Tôi là trợ lý AI của PizzaGenie. Hôm nay bạn muốn ăn món gì nào?`,
            timestamp: Date.now(),
          }];
        }
        return prev;
      });
    }
  }, [user?.username]);

  // Listen for open-ai-chat custom event
  useEffect(() => {
    const handleOpenAiChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenAiChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenAiChat);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Load lịch sử chat khi mở widget
  useEffect(() => {
    if (!isOpen) return;
    
    const loadHistory = async () => {
      try {
        const params = user?.user_id 
          ? `user_id=${user.user_id}` 
          : `guest_id=${guestId}`;
        const res = await fetch(`${API_BASE}/chatbot/sessions?${params}&page=1&limit=1`);
        const json = await res.json();
        
        if (json.success && json.data?.sessions?.length > 0) {
          const lastSession = json.data.sessions[0];
          // Chỉ load session active và trong vòng 30 phút
          const sessionAge = Date.now() - new Date(lastSession.started_at).getTime();
          if (lastSession.is_active && sessionAge < 30 * 60 * 1000) {
            setSessionId(lastSession.session_id);
            
            // Load messages
            const msgRes = await fetch(`${API_BASE}/chatbot/sessions/${lastSession.session_id}/messages`);
            const msgJson = await msgRes.json();
            
            if (msgJson.success && msgJson.data?.length > 0) {
              const loadedMessages: ChatMessage[] = msgJson.data.map((m: any) => ({
                role: m.role as 'user' | 'bot',
                content: m.content,
                timestamp: new Date(m.created_at).getTime(),
              }));
              setMessages(loadedMessages);
            }
          }
        }
      } catch (err) {
        // Silently fail — fallback to stateless
      }
    };
    
    // Only load if we don't already have messages beyond the greeting
    if (messages.length <= 1) {
      loadHistory();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Thêm tin nhắn user
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'bot')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/chatbot/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation_history: history,
          user_id: user?.user_id || null,
          guest_id: !user?.user_id ? guestId : null,
          session_id: sessionId,
          customer_name: user?.username || null
        })
      });

      const json = await res.json();

      if (json.success && json.data) {
        // Lưu session_id từ response
        if (json.data.session_id && !sessionId) {
          setSessionId(json.data.session_id);
        }

        const botMessage: ChatMessage = {
          role: 'bot',
          content: json.data.reply,
          dishes: json.data.dishes || [],
          combos: json.data.combos || [],
          follow_up: json.data.follow_up,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: json.message || 'Xin lỗi, đã có lỗi xảy ra. Bạn thử lại nhé!',
          timestamp: Date.now()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFollowUp = (text: string) => {
    setInput(text);
    setTimeout(() => sendMessage(), 100);
  };

  const handleDishClick = (dish: any) => {
    const isHalfHalf = dish.dish_name?.toLowerCase().includes('half') || dish.is_half_half;
    if (isHalfHalf) {
      setIsHalfHalfOpen(true);
    } else if (dish.type === 'combo' || dish.combo_id) {
      setSelectedDish({
        combo_id: dish.combo_id || dish.dish_id,
        combo_name: dish.combo_name || dish.dish_name,
        combo_price: dish.combo_price || dish.prices?.[0]?.dish_price || 0,
        description: dish.description || dish.ingredient || '',
        image: dish.image || dish.image_combo || null
      });
      setIsComboOpen(true);
    } else {
      setSelectedDish({
        id: dish.dish_id,
        name: dish.dish_name,
        ingredients: dish.ingredient || '',
        basePrice: dish.prices?.[0]?.dish_price || 0,
        prices: dish.prices || [],
        imageUrl: getImageUrl(dish.image)
      });
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-6 bottom-[92px] z-[998] w-14 h-14 bg-gradient-to-tr from-[#1f4e2b] via-[#007a3f] to-[#00a854] border-2 border-[#005a2e] text-white rounded-full shadow-[0_5px_25px_rgba(0,122,63,0.35)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Mở trợ lý tư vấn món ăn bằng AI"
          title="Chat với Trợ lý AI"
        >
          <Bot size={26} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed left-6 bottom-6 z-[1001] w-[375px] max-w-[calc(100vw-32px)] h-[525px] max-h-[calc(100vh-32px)] bg-[#141414] border border-white/15 rounded-[28px] shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-fadeIn select-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#007a3f] to-[#1f4e2b] px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center border border-white/20">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white font-extrabold text-sm tracking-wide">Trợ lý Pizza & Pasta</h3>
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">AI</span>
                </div>
                <p className="text-white/80 text-[11px]">Tư vấn món ăn thông minh</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSessionId(null);
                  setMessages([{
                    role: 'bot',
                    content: user?.username 
                      ? `Xin chào ${user.username}! Tôi là trợ lý AI của PizzaGenie. Hôm nay bạn muốn ăn món gì nào?`
                      : 'Xin chào! Tôi là trợ lý tư vấn món ăn của PizzaGenie. Bạn muốn ăn gì hôm nay?',
                    timestamp: Date.now(),
                  }]);
                }}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
                title="Phiên chat mới"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-[#007a3f]' : 'bg-[#ee2828]'
                }`}>
                  {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                </div>

                {/* Content */}
                <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#007a3f] text-white rounded-br-sm'
                      : 'bg-[#1e1e1e] text-gray-200 rounded-bl-sm border border-white/5'
                  }`}>
                    {msg.content}
                  </div>

                  {/* Dish recommendations */}
                  {msg.dishes && msg.dishes.length > 0 && (
                    <div className="w-full space-y-2">
                      {msg.dishes.map((dish: any) => (
                        <div
                          key={dish.dish_id}
                          onClick={() => handleDishClick(dish)}
                          className="bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 hover:border-emerald-500/50 rounded-lg p-2.5 flex items-center gap-2.5 cursor-pointer transition-all group"
                          title="Bấm để tùy chọn size, đế và topping"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                            <Image
                              src={getImageUrl(dish.image)}
                              alt={dish.dish_name}
                              fill
                              sizes="48px"
                              className="object-cover group-hover:scale-105 transition-transform"
                              unoptimized={shouldBypassNextImageOptimization(getImageUrl(dish.image))}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate group-hover:text-emerald-400 transition-colors">
                              {dish.dish_name}
                            </p>
                            <p className="text-gray-400 text-[10px] truncate">{dish.ingredient}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[#ee2828] text-xs font-bold">
                                {dish.prices?.[0]?.dish_price ? formatPrice(dish.prices[0].dish_price) : ''}
                              </p>
                              {dish.similarity_score && (
                                <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded font-medium">
                                  {Math.round(dish.similarity_score * 100)}% khớp
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDishClick(dish);
                            }}
                            className="shrink-0 bg-[#007a3f] hover:bg-green-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Plus size={11} />
                            Chọn
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Combo recommendations */}
                  {msg.combos && msg.combos.length > 0 && (
                    <div className="w-full space-y-2">
                      {msg.combos.map((combo: any) => (
                        <div
                          key={combo.combo_id}
                          onClick={() => handleDishClick({ ...combo, type: 'combo' })}
                          className="bg-[#1a1a1a] hover:bg-[#252525] border border-[#ee2828]/20 hover:border-[#ee2828]/60 rounded-lg p-2.5 cursor-pointer transition-all"
                          title="Bấm để tùy chọn món trong combo"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-white text-xs font-bold">{combo.combo_name}</p>
                            <p className="text-[#ee2828] text-xs font-bold">{formatPrice(combo.combo_price)}</p>
                          </div>
                          {combo.description && (
                            <p className="text-gray-400 text-[10px] mt-1">{combo.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow Up */}
                  {msg.follow_up && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.follow_up.split('|').map((suggestion: string, idx: number) => {
                        const cleanText = suggestion.trim();
                        if (!cleanText) return null;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleFollowUp(cleanText)}
                            className="bg-[#1e1e1e] hover:bg-[#ee2828]/20 border border-white/10 hover:border-[#ee2828]/50 text-emerald-400 hover:text-emerald-300 text-[11px] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 group cursor-pointer"
                          >
                            <Sparkles size={10} className="text-emerald-500 group-hover:text-emerald-400" />
                            {cleanText}
                          </button>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ee2828] flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-[#1e1e1e] px-4 py-2.5 rounded-xl rounded-bl-sm border border-white/5 flex items-center gap-2">
                  <Loader2 size={14} className="text-gray-400 animate-spin" />
                  <span className="text-gray-400 text-sm">Đang suy nghĩ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-[#0a0a0a] shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi tôi về menu nhà hàng..."
                disabled={isLoading}
                className="flex-1 bg-[#1a1a1a] text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 focus:border-[#ee2828]/50 focus:outline-none placeholder-gray-500 disabled:opacity-50"
                maxLength={500}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-[#ee2828] hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Option Modals khi bấm vào món ăn trong Chatbot */}
      {isModalOpen && selectedDish && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDish(null);
          }}
          product={selectedDish}
          categoryName={selectedDish.category || ''}
        />
      )}

      {isComboOpen && selectedDish && (
        <ComboModal
          isOpen={isComboOpen}
          onClose={() => {
            setIsComboOpen(false);
            setSelectedDish(null);
          }}
          comboId={selectedDish.combo_id || selectedDish.dish_id || 0}
          comboName={selectedDish.dish_name || selectedDish.combo_name || ''}
          comboPrice={selectedDish.prices?.[0]?.dish_price || selectedDish.combo_price || 0}
          comboDescription={selectedDish.description || selectedDish.ingredient || ''}
          imageUrl={getImageUrl(selectedDish.image)}
        />
      )}

      {isHalfHalfOpen && (
        <HalfHalfModal
          isOpen={isHalfHalfOpen}
          onClose={() => setIsHalfHalfOpen(false)}
        />
      )}
    </>
  );
}
