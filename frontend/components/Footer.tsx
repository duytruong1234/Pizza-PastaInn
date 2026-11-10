'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useUI } from '@/components/UIProvider';

const FacebookIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h3V2h-3c-2.5 0-5 1.5-5 4v2z" />
  </svg>
);

const InstagramIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.94-1.78-.22-.22-.43-.47-.62-.73v7.02c0 3.59-1.81 6.78-4.93 7.82-3.13 1.04-6.84-.24-8.49-3.03-1.65-2.79-1.25-6.62 1.01-8.97 2.26-2.35 6.01-2.6 8.57-.6v4.13c-1.58-1.07-3.8-.75-5.01.76-.87 1.08-.94 2.68-.17 3.84.77 1.16 2.29 1.74 3.65 1.34 1.36-.4 2.37-1.68 2.37-3.13V.02z" />
  </svg>
);

function formatPolicyLabel(slug: string, rawTitle: string, lang: 'vi' | 'en'): string {
  if (slug === 'terms') return lang === 'en' ? 'Terms of Service' : 'Điều khoản sử dụng';
  if (slug === 'privacy') return lang === 'en' ? 'Privacy Policy' : 'Chính sách bảo mật thông tin';
  if (slug === 'delivery') return lang === 'en' ? 'Delivery & Refund Policy' : 'Chính sách giao hàng & hoàn tiền';

  if (!rawTitle) return lang === 'en' ? 'Policies & Terms' : 'Chính sách & Điều khoản';

  let cleaned = rawTitle
    .replace(/^[IVXLCDM]+\.\s*/i, '')
    .replace(/(?:\s*[-–—]\s*)?(?:WEBSITE\s+)?PIZZA\s*&\s*PASTA\s*INN$/i, '')
    .trim();

  if (!cleaned) return rawTitle;

  if (cleaned === cleaned.toUpperCase()) {
    const lower = cleaned.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  return cleaned;
}

export default function Footer() {
  const { theme, lang } = useUI();
  const isDark = theme === 'dark';
  const isEn = lang === 'en';
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

  const defaultPolicies = [
    { slug: 'terms', title: 'Điều khoản sử dụng' },
    { slug: 'privacy', title: 'Chính sách bảo mật thông tin' },
    { slug: 'delivery', title: 'Chính sách giao hàng & hoàn tiền' },
  ];

  const policyList = policies.length > 0 ? policies : defaultPolicies;

  return (
    <footer
      className={`relative z-10 w-full mt-16 border-t transition-colors duration-300 ${
        isDark
          ? 'bg-[#0d0b09] text-white border-white/[0.08]'
          : 'bg-white text-zinc-800 border-zinc-200/90'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-9 lg:gap-8 items-start">
          {/* Cột 1: Giới thiệu PIZZA & PASTA INN */}
          <div className="lg:col-span-4 flex flex-col space-y-3.5">
            <h2 className="text-lg font-black tracking-wider font-sans uppercase leading-none">
              <span className={isDark ? 'text-white' : 'text-zinc-900'}>PIZZA & PASTA </span>
              <span className={isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'}>INN</span>
            </h2>
            <p
              className={`text-[13.5px] leading-relaxed pr-2 ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {isEn
                ? 'Visit Pizza & Pasta Inn to enjoy hot oven-baked pizzas, flavorful Italian spaghetti, creamy risotto/gratin, and fresh salads in a cozy setting.'
                : 'Đến với Pizza & Pasta Inn để thưởng thức những chiếc pizza nướng lò nóng hổi, mì Ý đậm đà và các món ăn chuẩn vị Ý trong không gian ấm cúng, thân thiện.'}
            </p>

            {/* Mạng xã hội */}
            <div className="flex items-center gap-2.5 pt-1">
              {[
                { label: 'Facebook', icon: <FacebookIcon size={17} />, href: '#' },
                { label: 'Instagram', icon: <InstagramIcon size={17} />, href: '#' },
                { label: 'TikTok', icon: <TikTokIcon size={15} />, href: '#' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                    isDark
                      ? 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-[#f5c043] hover:bg-white/[0.09] hover:border-[#f5c043]/40'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-[#007a3f] hover:bg-emerald-50/60 hover:border-[#007a3f]/30'
                  }`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Cột 2: Chi nhánh Quận 5 */}
          <div className="lg:col-span-3 flex flex-col space-y-3.5">
            <h3
              className={`text-sm font-black tracking-wider uppercase leading-none ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {isEn ? 'DISTRICT 5 BRANCH' : 'CHI NHÁNH QUẬN 5'}
            </h3>

            <div className="space-y-2.5 text-[13.5px]">
              <div className="flex items-start gap-2.5">
                <MapPin
                  size={16}
                  className={`mt-0.5 flex-shrink-0 ${
                    isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                  }`}
                />
                <span className={`leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isEn
                    ? '21 Dao Tan, An Dong Ward, District 5, Ho Chi Minh City'
                    : '21 Đào Tấn, Phường An Đông, Quận 5, TP. Hồ Chí Minh'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone
                  size={16}
                  className={`flex-shrink-0 ${
                    isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                  }`}
                />
                <a
                  href="tel:02839240343"
                  className={`font-bold transition-colors ${
                    isDark
                      ? 'text-zinc-200 hover:text-[#f5c043]'
                      : 'text-zinc-800 hover:text-[#007a3f]'
                  }`}
                >
                  028 3924 0343
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock
                  size={16}
                  className={`flex-shrink-0 ${
                    isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                  }`}
                />
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
                  {isEn ? 'Open:' : 'Mở cửa:'}{' '}
                  <strong className={isDark ? 'text-zinc-200 font-bold' : 'text-zinc-800 font-bold'}>
                    10:00 – 22:00
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Cột 3: Chi nhánh Quận 7 */}
          <div className="lg:col-span-3 flex flex-col space-y-3.5">
            <h3
              className={`text-sm font-black tracking-wider uppercase leading-none ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {isEn ? 'DISTRICT 7 BRANCH' : 'CHI NHÁNH QUẬN 7'}
            </h3>

            <div className="space-y-2.5 text-[13.5px]">
              <div className="flex items-start gap-2.5">
                <MapPin
                  size={16}
                  className={`mt-0.5 flex-shrink-0 ${
                    isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                  }`}
                />
                <span className={`leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isEn
                    ? 'C001 Pham Thai Buong, Tan Hung Ward, District 7, Ho Chi Minh City'
                    : 'C001 Phạm Thái Bường, Phường Tân Hưng, Quận 7, TP. HCM'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone
                  size={16}
                  className={`flex-shrink-0 ${
                    isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                  }`}
                />
                <a
                  href="tel:02854121197"
                  className={`font-bold transition-colors ${
                    isDark
                      ? 'text-zinc-200 hover:text-[#f5c043]'
                      : 'text-zinc-800 hover:text-[#007a3f]'
                  }`}
                >
                  028 5412 1197 – 028 5412 1196
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock
                  size={16}
                  className={`flex-shrink-0 ${
                    isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'
                  }`}
                />
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
                  {isEn ? 'Open:' : 'Mở cửa:'}{' '}
                  <strong className={isDark ? 'text-zinc-200 font-bold' : 'text-zinc-800 font-bold'}>
                    09:00 – 21:00
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Cột 4: Chính sách & Điều khoản */}
          <div className="lg:col-span-2 flex flex-col space-y-3.5">
            <h3
              className={`text-sm font-black tracking-wider uppercase leading-none ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {isEn ? 'POLICIES' : 'CHÍNH SÁCH'}
            </h3>
            <ul className="space-y-2.5 text-[13.5px]">
              {policyList.map((policy) => {
                const isStandard = ['terms', 'privacy', 'delivery'].includes(policy.slug);
                const href = isStandard ? `/${policy.slug}` : `/policies/${policy.slug}`;
                const label = formatPolicyLabel(policy.slug, policy.title, lang);
                return (
                  <li key={policy.slug}>
                    <Link
                      href={href}
                      className={`group inline-flex items-center gap-1.5 font-medium transition-colors duration-200 ${
                        isDark
                          ? 'text-zinc-400 hover:text-[#f5c043]'
                          : 'text-zinc-600 hover:text-[#007a3f]'
                      }`}
                    >
                      <ChevronRight
                        size={14}
                        className={`flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                          isDark ? 'text-zinc-600 group-hover:text-[#f5c043]' : 'text-zinc-400 group-hover:text-[#007a3f]'
                        }`}
                      />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div
          className={`border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs ${
            isDark ? 'border-white/[0.08] text-zinc-500' : 'border-zinc-200/80 text-zinc-500'
          }`}
        >
          <p>
            © {new Date().getFullYear()} Pizza & Pasta Inn.{' '}
            {isEn ? 'All rights reserved.' : 'Đã đăng ký bản quyền.'}
          </p>
          <p className="font-medium">
            {isEn
              ? 'Traditional Italian flavors in Ho Chi Minh City'
              : 'Hương vị ẩm thực Ý đích thực tại TP. Hồ Chí Minh'}
          </p>
        </div>
      </div>
    </footer>
  );
}
