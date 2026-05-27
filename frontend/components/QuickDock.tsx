'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, ArrowUp, X, Send, Sparkles, MessageSquare, Smile, Paperclip, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function QuickDock() {
  const [contactOpen, setContactOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi! Welcome to Pizza & Pasta Inn. I am ChefBot, your AI culinary assistant! How can I help you today? Ask me about pizzas, pastas, or tracking your order!',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

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

    // Simulate smart bot response
    setTimeout(() => {
      let botResponse = '';
      const lower = trimmed.toLowerCase();

      if (lower.includes('pizza') || lower.includes('bánh')) {
        botResponse = 'Oh, you must try our signature Seafood Pizza (packed with fresh shrimp, calamari, and creamy mozzarella) or the legendary Double Cheese Pizza! Would you like me to guide you to the menu?';
      } else if (lower.includes('pasta') || lower.includes('mì')) {
        botResponse = 'Mamma Mia! Our Creamy Carbonara is extremely popular, made with rich egg yolk sauce, crispy bacon, and parmesan. We also have Classic Spaghetti Bolognese. Which one sounds mouth-watering?';
      } else if (lower.includes('track') || lower.includes('đơn hàng') || lower.includes('tra cứu') || lower.includes('lookup')) {
        botResponse = 'Tracking your order is extremely easy! Simply head to our Order Lookup page by entering your phone number. You can check order processing stages in real-time!';
      } else if (lower.includes('hour') || lower.includes('giờ') || lower.includes('mở cửa') || lower.includes('open')) {
        botResponse = 'We are delighted to serve you every day from 9:00 AM to 10:00 PM! Come visit us or order online for hot, fresh delivery in under 45 minutes!';
      } else if (lower.includes('promotion') || lower.includes('khuyến mãi') || lower.includes('giảm giá')) {
        botResponse = 'Great news! We currently offer FREE SHIPPING on orders over 200.000 đ! You can also look out for seasonal discounts at the checkout page!';
      } else {
        botResponse = "That's a wonderful question! I am ChefBot, and I can suggest the best pizzas, Italian pasta dishes, share our open hours, or help you track orders. What would you like to explore?";
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

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  const openChefBot = () => {
    setContactOpen(false);
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
        className="fixed left-6 bottom-6 z-[999] flex items-center justify-center w-14 h-14 rounded-full bg-[#54a2f2] border-2 border-[#1e3b5e] shadow-[0_5px_25px_rgba(0,0,0,0.25)] cursor-pointer hover:scale-105 active:scale-95 transition-all select-none"
      >
        {/* Glowing Circular Chat Bubble Icon with dots */}
        <svg className="w-7 h-7 text-[#1e3b5e] drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.78 4.16 2.06 5.74L3 22l4.43-1.07C8.89 21.57 10.4 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-3 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      </div>

      {/* ── Contact Support Modal ("Liên hệ hỗ trợ") ──────────────────────────────── */}
      {contactOpen && (
        <div className="fixed left-6 bottom-24 z-[1000] w-[420px] bg-[#1e2338] border border-white/[0.08] rounded-[28px] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.5)] text-white animate-fadeIn select-none">
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
              className="bg-[#131528] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1a1d33] active:scale-[0.97] transition-all shadow"
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
              className="bg-[#131528] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1a1d33] active:scale-[0.97] transition-all shadow"
            >
              <div className="w-10 h-10 rounded-full bg-[#00b952] flex items-center justify-center text-white shrink-0 shadow-md">
                <svg className="w-5 h-5 fill-white text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23-.13-2.42-.54-3.52-1.21-.36-.22-.8-.17-1.11.14l-2.33 2.33c-2.91-1.49-5.28-3.86-6.77-6.77l2.33-2.33c.31-.31.36-.75.14-1.11C8.14 5.34 7.73 4.15 7.6 2.92c-.1-.97-.91-1.69-1.89-1.69H3.19C2.1 1.23 1.2 2.14 1.26 3.24c.48 8.65 7.4 15.57 16.05 16.05 1.1.06 2.01-.84 2.01-1.93v-2.52c0-.98-.72-1.79-1.31-1.46z" />
                </svg>
              </div>
              <span className="font-extrabold text-[13px] text-white tracking-tight whitespace-nowrap">0982 636 800</span>
            </a>

            {/* ChefBot AI Assistant Card */}
            <div 
              onClick={openChefBot}
              className="bg-[#131528] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1a1d33] active:scale-[0.97] transition-all shadow"
            >
              <svg className="w-10 h-10 shrink-0 text-[#2b5efb]" viewBox="0 0 100 100" fill="currentColor">
                <path d="M 12,40 C 7,40 7,64 12,64 Z" />
                <rect x="9" y="24" width="3" height="20" rx="1.5" />
                <path d="M 88,40 C 93,40 93,64 88,64 Z" />
                <rect x="88" y="24" width="3" height="20" rx="1.5" />
                <path d="M 50,15 C 24,15 10,29 10,50 C 10,60 14,70 20,76 L 16,87 C 15.7,87.8 16.5,88.5 17.2,88.2 L 29,82 C 35,84.5 42,85 50,85 C 76,85 90,71 90,50 C 90,29 76,15 50,15 Z" />
                <rect x="22" y="32" width="56" height="36" rx="15" fill="white" />
                <path d="M 32,50 Q 38,42 44,50" stroke="#2b5efb" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 55,50 Q 62,42 68,50" stroke="#2b5efb" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 46,58 Q 50,64 55,58" stroke="#2b5efb" strokeWidth="4" strokeLinecap="round" fill="none" />
              </svg>
              <span className="font-extrabold text-sm text-white">ChefBot AI</span>
            </div>

            {/* Facebook Card */}
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#131528] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1a1d33] active:scale-[0.97] transition-all shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1877f2] flex items-center justify-center text-white shadow-md shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="font-extrabold text-sm text-white">Facebook</span>
            </a>

            {/* TikTok Card */}
            <a 
              href="https://tiktok.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#131528] border border-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-[#1a1d33] active:scale-[0.97] transition-all shadow col-span-2"
            >
              <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-white shadow-md shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.15-.15-.24-.22v6.23c.03 3.58-2.3 6.9-5.83 7.62-3.7 1.07-7.85-1.07-9.04-4.72-1.42-3.9 1-8.23 5.04-9.25.96-.28 1.98-.31 2.97-.13v4.01c-.8-.21-1.68-.16-2.43.23-.97.47-1.6 1.52-1.57 2.61.02 1.6 1.43 2.96 3.03 2.93 1.62-.05 2.93-1.47 2.89-3.08.01-4.73-.01-9.46.02-14.19z"/>
                </svg>
              </div>
              <span className="font-extrabold text-sm text-white">TikTok</span>
            </a>

          </div>

          {/* Footer Info Lines */}
          <div className="text-left text-xs font-semibold text-zinc-300 space-y-2 border-t border-white/5 pt-4 mt-1 leading-relaxed">
            <p>Hỗ trợ các ngày trong tuần từ 8h đến 24h</p>
            <p className="flex items-center gap-1.5 text-zinc-300">
              <span>Liên hệ hợp tác:</span> 
              <a href="mailto:muakeys@gmail.com" className="text-[#54a2f2] hover:underline font-bold">muakeys@gmail.com</a>
            </p>
          </div>
        </div>
      )}

      {/* ── Chatbot Panel Window (ChefBot) ────────────────────────────────────────── */}
      {chatOpen && (
        <div className="fixed left-6 bottom-24 z-[1000] w-[375px] h-[525px] flex flex-col bg-white border border-zinc-200/80 rounded-[28px] shadow-[0_15px_45px_rgba(0,0,0,0.12)] overflow-hidden animate-fadeIn select-none">
          
          {/* Header */}
          <div className="relative bg-gradient-to-b from-[#0a356c] to-[#0d3f7a] text-white pt-5 pb-9 px-5 rounded-t-[28px] overflow-hidden shrink-0">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                {/* Circular Profile Avatar - Custom Cute Robot matching mockup */}
                <div className="relative w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-white/20">
                  <svg className="w-8 h-8 text-[#2b5efb]" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 12,40 C 7,40 7,64 12,64 Z" />
                    <rect x="9" y="24" width="3" height="20" rx="1.5" />
                    <path d="M 88,40 C 93,40 93,64 88,64 Z" />
                    <rect x="88" y="24" width="3" height="20" rx="1.5" />
                    <path d="M 50,15 C 24,15 10,29 10,50 C 10,60 14,70 20,76 L 16,87 C 15.7,87.8 16.5,88.5 17.2,88.2 L 29,82 C 35,84.5 42,85 50,85 C 76,85 90,71 90,50 C 90,29 76,15 50,15 Z" />
                    <rect x="22" y="32" width="56" height="36" rx="15" fill="white" />
                    <path d="M 32,50 Q 38,42 44,50" stroke="#2b5efb" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                    <path d="M 55,50 Q 62,42 68,50" stroke="#2b5efb" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                    <path d="M 46,58 Q 50,64 55,58" stroke="#2b5efb" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
                <div>
                  <span className="text-zinc-300 text-[10px] font-semibold tracking-wide block uppercase leading-none">Chat with</span>
                  <h4 className="font-extrabold text-[15px] text-white tracking-wide leading-snug mt-0.5">
                    ChefBot AI
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider">We're online</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button className="text-white/80 hover:text-white transition-colors cursor-pointer">
                  <MoreVertical size={18} />
                </button>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Premium Wave Shape Divider */}
            <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none translate-y-[1px] select-none pointer-events-none">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[22px]">
                <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V30.39C1122.56,69.57,1053.47,110.8,985.66,92.83Z" fill="#f4f7f9" />
              </svg>
            </div>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-4.5 space-y-4 bg-[#f4f7f9] scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div 
                  className={`px-4 py-2.5 text-[13px] font-medium leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#0a2f64] text-white rounded-[20px] rounded-tr-none' 
                      : 'bg-white border border-zinc-100/50 text-[#202c3d] rounded-[20px] rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Mock horizontal ellipsis typing indicator exactly matching the mockup */}
            <div className="flex justify-end pr-1.5 mt-2.5 select-none pointer-events-none">
              <div className="bg-[#0a2f64] text-white rounded-full w-14 h-8 flex items-center justify-center shadow-md animate-pulse">
                <span className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full opacity-60"></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
              </div>
            </div>

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="bg-white border border-zinc-100/50 rounded-[20px] rounded-tl-none px-4 py-3.5 flex gap-1.5 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-[#0a2f64] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#0a2f64] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#0a2f64] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4.5 py-2.5 bg-[#f4f7f9] border-t border-zinc-100/50 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 select-none">
            <button 
              onClick={() => handleSuggestionClick('Recommend a Pizza')}
              className="px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-600 text-[11px] font-bold hover:border-[#0a2f64] hover:text-[#0a2f64] transition-all shadow-sm cursor-pointer"
            >
              Recommend Pizza
            </button>
            <button 
              onClick={() => handleSuggestionClick('Recommend a Pasta')}
              className="px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-600 text-[11px] font-bold hover:border-[#0a2f64] hover:text-[#0a2f64] transition-all shadow-sm cursor-pointer"
            >
              Recommend Pasta
            </button>
            <button 
              onClick={() => handleSuggestionClick('Track my order')}
              className="px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-600 text-[11px] font-bold hover:border-[#0a2f64] hover:text-[#0a2f64] transition-all shadow-sm cursor-pointer"
            >
              Track Order
            </button>
            <button 
              onClick={() => handleSuggestionClick('What are your opening hours?')}
              className="px-3.5 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-600 text-[11px] font-bold hover:border-[#0a2f64] hover:text-[#0a2f64] transition-all shadow-sm cursor-pointer"
            >
              Opening Hours
            </button>
          </div>

          {/* Form Input Area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="bg-white border-t border-zinc-100/80 relative p-3 pb-3.5 shrink-0"
          >
            {/* Input field */}
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your message..."
              className="w-full bg-transparent text-[#202c3d] focus:outline-none placeholder-zinc-400 text-[13px] pl-4 pr-16 py-2.5 font-semibold"
            />
            
            {/* Bottom Row: Actions & Send Button */}
            <div className="flex items-center justify-between px-3.5 pt-1 pb-1">
              <div className="flex items-center gap-3.5 text-zinc-400">
                <button type="button" className="hover:text-zinc-600 transition-colors cursor-pointer">
                  <Smile size={20} />
                </button>
                <button type="button" className="hover:text-zinc-600 transition-colors cursor-pointer">
                  <Paperclip size={20} />
                </button>
              </div>
              
              {/* Elevated Send Button */}
              <button 
                type="submit"
                className="w-11 h-11 bg-[#0a2f64] hover:bg-[#0c3b7a] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all absolute right-4 bottom-2.5 cursor-pointer"
              >
                <Send size={18} className="transform rotate-45 -translate-x-[2px] -translate-y-[1px]" />
              </button>
            </div>
          </form>

        </div>
      )}
    </>
  );
}
