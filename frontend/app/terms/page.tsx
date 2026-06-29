'use client';

import React, { useEffect, useState } from 'react';
import HeaderClient from '@/components/HeaderClient';
import Footer from '@/components/Footer';
import { useUI } from '@/components/UIProvider';
import Link from 'next/link';
import api from '@/lib/api';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';
import { ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';

interface Section {
  id: string;
  title: string;
  icon: string;
  body: string;
}

export default function TermsPage() {
  const { theme } = useUI();
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('Điều khoản sử dụng');
  const [sections, setSections] = useState<Section[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await api.get('/policies/terms');
        if (res.data?.success) {
          setTitle(res.data.data.title);
          setSections(res.data.data.content || []);
          if (res.data.data.updated_at) {
            setUpdatedAt(new Date(res.data.data.updated_at).toLocaleDateString('vi-VN'));
          }
        }
      } catch (err) {
        console.warn('Failed to load terms policy:', getApiErrorMessage(err));
        if (getApiErrorStatus(err) === 404) {
          setIsNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, []);

  if (isNotFound) {
    notFound();
  }



  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-zinc-300' : 'bg-gray-50 text-gray-700'}`}>
      <style>{`
        .policy-body-content ul {
          list-style-type: none;
          padding-left: 0.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .policy-body-content li {
          margin-bottom: 0.5rem;
          line-height: 1.625;
        }
        .policy-body-content p {
          margin-bottom: 0.75rem;
        }
        .policy-body-content strong {
          font-weight: 700;
          color: inherit;
        }
      `}</style>

      {/* HEADER */}
      <header className="bg-[#121424]/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/[0.1] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <HeaderClient storeName="Pizza&PastaInn" />
      </header>

      {/* HERO HERO TITLE */}
      <section className={`relative py-6 md:py-8 overflow-hidden border-b transition-colors duration-300 ${isDark ? 'bg-[#0f0f0f] border-zinc-900' : 'bg-white border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4">
            <Link href="/" className={`hover:text-[#f5c043] transition-colors ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Trang chủ</Link>
            <ChevronRight size={12} className={isDark ? 'text-zinc-700' : 'text-gray-300'} />
            <span className={isDark ? 'text-[#f5c043]' : 'text-[#007a3f]'}>Chính sách & Điều khoản</span>
          </nav>

          <div className="flex flex-col items-start gap-4">
            <div className="space-y-2">
              <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h1>
            </div>

            {updatedAt && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-[#18181b] text-zinc-400 border border-zinc-800' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                <span>Cập nhật lần cuối: {updatedAt}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="text-sm text-gray-500">Đang tải nội dung...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

            {/* SIDEBAR TABLE OF CONTENTS */}
            <aside className="lg:col-span-1">
              <div className="sticky top-28 space-y-4">
                <h3 className={`text-base font-black uppercase tracking-[0.15em] mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <span>Mục lục nhanh</span>
                </h3>

                <nav className="flex flex-col gap-1 border-l border-zinc-800 pl-3">
                  {sections.map((sec) => {
                    return (
                      <a
                        key={sec.id}
                        href={`#sec-${sec.id.replace('.', '-')}`}
                        className={`group flex items-center gap-2.5 py-2 text-[13.5px] font-medium leading-relaxed transition-all duration-200 -ml-[13px] border-l-2 pl-3 border-transparent hover:border-[#f5c043] ${isDark
                            ? 'text-zinc-500 hover:text-white hover:pl-4'
                            : 'text-gray-400 hover:text-gray-950 hover:pl-4 hover:border-[#007a3f]'
                          }`}
                      >
                        <span>{sec.title}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* MAIN ARTICLES */}
            <article className="lg:col-span-3 space-y-12">
              <div className={`p-8 md:p-10 rounded-3xl border transition-colors duration-300 ${isDark ? 'bg-[#0d0d0d] border-zinc-900' : 'bg-white border-gray-200/80 shadow-sm'
                }`}>
                <div className="prose max-w-none space-y-10">
                  {sections.map((sec) => (
                    <section key={sec.id} id={`sec-${sec.id.replace('.', '-')}`} className="scroll-mt-24 space-y-4">
                      <h2 className={`text-xl font-extrabold tracking-wide flex items-center gap-3 border-b pb-3 uppercase ${isDark ? 'text-white border-zinc-900' : 'text-gray-900 border-gray-100'
                        }`}>
                        {sec.title}
                      </h2>
                      <div
                        className="space-y-3.5 leading-relaxed text-sm md:text-[14.5px] policy-body-content"
                        dangerouslySetInnerHTML={{ __html: sec.body }}
                      />
                    </section>
                  ))}
                </div>
              </div>
            </article>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <div className={`px-6 transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100 border-t border-gray-200'}`}>
        <Footer />
      </div>
    </div>
  );
}
