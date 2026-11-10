'use client';

import React, { useEffect, useState } from 'react';
import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import { useUI } from '@/components/UIProvider';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { API_BASE } from '@/lib/config';

interface StoreBranch {
  store_id: number;
  store_name: string;
  address: string;
  hotline?: string;
  opening_hours?: string;
  latitude?: number | null;
  longitude?: number | null;
}

const FALLBACK_STORES: StoreBranch[] = [
  {
    store_id: 1,
    store_name: 'Chi nhánh Quận 5',
    address: '21 Đào Tấn, Phường An Đông, Quận 5, TP. Hồ Chí Minh',
    hotline: '028 3924 0343',
    opening_hours: '10:00 — 22:00',
  },
  {
    store_id: 2,
    store_name: 'Chi nhánh Quận 7',
    address: 'C001 Phạm Thái Bường, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    hotline: '028 5412 1197 - 028 5412 1196',
    opening_hours: '09:00 — 21:00',
  },
];

export default function BranchesPage() {
  const { theme } = useUI();
  const isDark = theme === 'dark';
  const [stores, setStores] = useState<StoreBranch[]>(FALLBACK_STORES);

  useEffect(() => {
    fetch(`${API_BASE}/stores`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStores(json.data);
        }
      })
      .catch(() => {
        // Giữ danh sách chi nhánh mặc định nếu không kết nối được API
      });
  }, []);

  return (
    <div
      className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f5f0] text-[#1c1208]'
      }`}
    >
      <HeaderClient storeName="Pizza & Pasta Inn" />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1">
        <div className="text-center mb-10">
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight ${
              isDark ? 'text-white' : 'text-[#1c1208]'
            }`}
          >
            Hệ thống chi nhánh
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-white/60' : 'text-[#6e6254]'}`}>
            Ghé thăm không gian ấm cúng của Pizza &amp; Pasta Inn tại TP. Hồ Chí Minh
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.map((store, idx) => {
            const openHours =
              store.opening_hours || (idx === 0 ? '10:00 — 22:00' : '09:00 — 21:00');
            const mapQuery = encodeURIComponent(`${store.store_name} ${store.address}`);

            return (
              <div
                key={store.store_id || idx}
                className={`rounded-2xl p-6 sm:p-7 border transition-all flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#121212] border-white/[0.08] hover:border-[#f5c043]/40 shadow-xl shadow-black/40'
                    : 'bg-white border-black/[0.08] hover:border-[#cd3645]/35 shadow-[0_12px_32px_rgba(28,18,8,0.05)]'
                }`}
              >
                <div>
                  <h2
                    className={`text-lg sm:text-xl font-black uppercase tracking-wide mb-4 pb-3 border-b ${
                      isDark
                        ? 'text-[#f5c043] border-white/10'
                        : 'text-[#cd3645] border-black/10'
                    }`}
                  >
                    {store.store_name}
                  </h2>

                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={17}
                        className={`shrink-0 mt-0.5 ${isDark ? 'text-[#f5c043]' : 'text-[#cd3645]'}`}
                      />
                      <div>
                        <span
                          className={`block text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                            isDark ? 'text-white/40' : 'text-[#8c7d6b]'
                          }`}
                        >
                          Địa chỉ
                        </span>
                        <p className={isDark ? 'text-white/85 leading-relaxed' : 'text-[#2c2219] leading-relaxed'}>
                          {store.address}
                        </p>
                      </div>
                    </div>

                    {store.hotline && (
                      <div className="flex items-start gap-3">
                        <Phone
                          size={17}
                          className={`shrink-0 mt-0.5 ${isDark ? 'text-[#f5c043]' : 'text-[#cd3645]'}`}
                        />
                        <div>
                          <span
                            className={`block text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                              isDark ? 'text-white/40' : 'text-[#8c7d6b]'
                            }`}
                          >
                            Hotline đặt bàn &amp; giao hàng
                          </span>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-[#1c1208]'}`}>
                            {store.hotline}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Clock
                        size={17}
                        className={`shrink-0 mt-0.5 ${isDark ? 'text-[#f5c043]' : 'text-[#cd3645]'}`}
                      />
                      <div>
                        <span
                          className={`block text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                            isDark ? 'text-white/40' : 'text-[#8c7d6b]'
                          }`}
                        >
                          Giờ mở cửa
                        </span>
                        <p className={isDark ? 'text-white/85 font-semibold' : 'text-[#2c2219] font-semibold'}>
                          {openHours} (Mỗi ngày)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-6 pt-4 border-t flex items-center gap-3 ${
                    isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                  }`}
                >
                  {store.hotline && (
                    <a
                      href={`tel:${store.hotline.split('-')[0].replace(/\s+/g, '')}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#cd3645] hover:bg-[#b52a38] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      <Phone size={14} />
                      <span>Gọi ngay</span>
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${
                      isDark
                        ? 'bg-white/[0.04] border-white/12 text-white hover:bg-white/[0.08]'
                        : 'bg-[#fcfaf6] border-black/12 text-[#1c1208] hover:bg-stone-100'
                    }`}
                  >
                    <ExternalLink size={14} />
                    <span>Chỉ đường</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
