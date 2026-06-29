'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, Store } from 'lucide-react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';

// Custom SVG Icons for Social Media to match premium styles
const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h3V2h-3c-2.5 0-5 1.5-5 4v2z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.94-1.78-.22-.22-.43-.47-.62-.73v7.02c0 3.59-1.81 6.78-4.93 7.82-3.13 1.04-6.84-.24-8.49-3.03-1.65-2.79-1.25-6.62 1.01-8.97 2.26-2.35 6.01-2.6 8.57-.6v4.13c-1.58-1.07-3.8-.75-5.01.76-.87 1.08-.94 2.68-.17 3.84.77 1.16 2.29 1.74 3.65 1.34 1.36-.4 2.37-1.68 2.37-3.13V.02z" />
  </svg>
);

export default function Footer() {
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const res = await api.get('/policies');
        if (res.data?.success) {
          setPolicies(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load policies in footer:', getApiErrorMessage(err));
      }
    }
    fetchPolicies();
  }, []);

  return (
    <footer className="relative z-10 bg-black text-white border-t border-zinc-900/60 -mx-6 -mb-6 mt-14 pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Cột 1: Giới thiệu PIZZA & PASTA INN */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-extrabold tracking-wider font-sans uppercase">
              <span className="text-white">PIZZA & PASTA </span>
              <span className="text-[#f5c043]">INN</span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Come to Pizza & Pasta Inn, where you can enjoy hot, delicious, and flavorful dishes in a warm and friendly atmosphere.
            </p>
            
            {/* Mạng xã hội */}
            <div className="flex gap-3 pt-2">
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-200 shadow-sm"
              >
                <FacebookIcon size={18} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-200 shadow-sm"
              >
                <InstagramIcon size={18} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-200 shadow-sm"
              >
                <TikTokIcon size={16} />
              </a>
            </div>
          </div>

          {/* Cột 2: Chi nhánh Quận 5 */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E5A93C] flex items-center justify-center text-black flex-shrink-0 shadow-md">
                <Store size={18} className="stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">
                DISTRICT 5 BRANCH
              </h3>
            </div>
            
            <div className="space-y-3.5 pt-1">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#64748B] mt-0.5 flex-shrink-0" />
                <span className="text-zinc-400 text-sm leading-relaxed max-w-[280px]">
                  21 Dao Tan Street, An Dong Ward, Ho Chi Minh City, Vietnam
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-[#64748B] flex-shrink-0" />
                <span className="text-zinc-400 text-sm font-semibold">
                  028 3924 0343
                </span>
              </div>
              
              <div className="pt-1.5">
                <div className="inline-flex items-start gap-2.5 bg-[#121212] border border-zinc-800/85 px-4 py-2.5 rounded-xl shadow-inner">
                  <Clock size={15} className="text-[#f5c043] mt-0.5" />
                  <div className="text-[12.5px] text-zinc-400 font-medium flex flex-col gap-0.5">
                    <span>Opening Hours:</span>
                    <strong className="text-white font-bold">10:00 AM — 10:00 PM</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 3: Chi nhánh Quận 7 */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E5A93C] flex items-center justify-center text-black flex-shrink-0 shadow-md">
                <Store size={18} className="stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">
                DISTRICT 7 BRANCH
              </h3>
            </div>
            
            <div className="space-y-3.5 pt-1">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#64748B] mt-0.5 flex-shrink-0" />
                <span className="text-zinc-400 text-sm leading-relaxed max-w-[280px]">
                  C001 Pham Thai Buong Street, Tan Hung Ward, Ho Chi Minh City, Vietnam
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-[#64748B] flex-shrink-0" />
                <span className="text-zinc-400 text-sm font-semibold">
                  028 5412 1197 - 028 5412 1196
                </span>
              </div>
              
              <div className="pt-1.5">
                <div className="inline-flex items-start gap-2.5 bg-[#121212] border border-zinc-800/85 px-4 py-2.5 rounded-xl shadow-inner">
                  <Clock size={15} className="text-[#f5c043] mt-0.5" />
                  <div className="text-[12.5px] text-zinc-400 font-medium flex flex-col gap-0.5">
                    <span>Opening Hours:</span>
                    <strong className="text-white font-bold">09:00 AM — 09:00 PM</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 4: Chính sách & Điều khoản */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">
              Chính sách & Điều khoản
            </h3>
            <ul className="space-y-3 pt-1">
              {policies.length > 0 ? (
                policies.map((policy) => {
                  const isStandard = ['terms', 'privacy', 'delivery'].includes(policy.slug);
                  const href = isStandard ? `/${policy.slug}` : `/policies/${policy.slug}`;
                  return (
                    <li key={policy.slug}>
                      <Link 
                        href={href} 
                        className="text-zinc-400 hover:text-[#f5c043] text-sm font-medium transition-colors duration-200"
                      >
                        {policy.title}
                      </Link>
                    </li>
                  );
                })
              ) : (
                <>
                  <li>
                    <Link 
                      href="/terms" 
                      className="text-zinc-400 hover:text-[#f5c043] text-sm font-medium transition-colors duration-200"
                    >
                      Điều khoản sử dụng
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/privacy" 
                      className="text-zinc-400 hover:text-[#f5c043] text-sm font-medium transition-colors duration-200"
                    >
                      Chính sách bảo mật
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/delivery" 
                      className="text-zinc-400 hover:text-[#f5c043] text-sm font-medium transition-colors duration-200"
                    >
                      Chính sách giao nhận và hủy đơn
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

        </div>
        
        {/* Copyright */}
        <div className="border-t border-zinc-900/60 mt-12 pt-6 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Pizza & Pasta Inn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
