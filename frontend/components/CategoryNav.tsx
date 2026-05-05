'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useUI } from './UIProvider';
import HalfHalfModal from './HalfHalfModal';

type Category = {
  category_id: number;
  category_name: string;
};

export default function CategoryNav({ categories = [], activeCategoryId }: { categories?: Category[], activeCategoryId?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isHalfHalfModalOpen, setIsHalfHalfModalOpen] = useState(false);
  const { t, tMenu } = useUI();

  // Danh sách danh mục từ DB
  const displayCategories = categories;

  // Nếu chưa chọn danh mục, mặc định chọn danh mục đầu tiên
  const currentActive = activeCategoryId || displayCategories[0]?.category_id;

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      // Nếu ô tìm kiếm trống, quay lại danh mục đang chọn
      const categoryParam = searchParams.get('category');
      router.push(categoryParam ? `/?category=${categoryParam}` : '/');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const categoryParam = searchParams.get('category');
    router.push(categoryParam ? `/?category=${categoryParam}` : '/');
  };

  return (
    <div className="w-full flex flex-col">
      {/* Search Bar matching screenshot */}
      <div className="w-full flex flex-col">
        {/* Middle White Search Bar */}
        <div className="bg-white py-1.5 md:py-2 px-4 md:px-6 flex items-center justify-between">
          <input 
            type="text" 
            placeholder={t('search.placeholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-gray-800 outline-none font-sans text-[15px]"
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-red-500 mr-1 p-1 transition-colors"
              title={t('search.clearTitle')}
            >
              <X size={14} />
            </button>
          )}
          <button 
            onClick={() => handleSearch()}
            className="text-black ml-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Search size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Bottom Green Bar */}
        <div className="h-4 md:h-[22px] w-full bg-[#007a3f]"></div>
      </div>
      
      {/* Category Buttons Area */}
      <div className="bg-[#111111] py-3 px-4 md:px-6 border-b border-[#333] overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-4 md:gap-10 min-w-max">
          {displayCategories.map((cat) => (
            <Link
              key={cat.category_id}
              href={`/?category=${cat.category_id}`}
              onClick={() => setSearchQuery('')}
              className={`px-6 md:px-8 py-2 rounded-sm text-[13px] md:text-[15px] font-bold transition-colors shadow-md uppercase tracking-wide whitespace-nowrap text-center ${
                cat.category_id === currentActive && !searchParams.get('search') && searchParams.get('category') !== 'half-half'
                  ? 'bg-[#ee2828] text-white shadow-[0_0_10px_rgba(238,40,40,0.5)]'
                  : 'bg-[#294c29] text-gray-200 hover:bg-[#ee2828] hover:text-white'
              }`}
            >
              {tMenu(cat.category_name)}
            </Link>
          ))}
          <button
            onClick={() => setIsHalfHalfModalOpen(true)}
            className={`px-6 md:px-8 py-2 rounded-sm text-[13px] md:text-[15px] font-bold transition-colors shadow-md uppercase tracking-wide whitespace-nowrap text-center bg-[#294c29] text-gray-200 hover:bg-[#ee2828] hover:text-white`}
          >
            {tMenu('HALF-HALF')}
          </button>
        </div>
      </div>
      <HalfHalfModal isOpen={isHalfHalfModalOpen} onClose={() => setIsHalfHalfModalOpen(false)} />
    </div>
  );
}
