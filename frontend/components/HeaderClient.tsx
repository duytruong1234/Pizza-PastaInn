'use client';

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import CartButton from './CartButton';
import LanguageSelector from './LanguageSelector';
import { useUI } from './UIProvider';

export default function HeaderClient({ storeName }: { storeName: string }) {
  const { t } = useUI();

  return (
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex flex-col items-center md:items-start justify-center pt-2 md:mx-0 mx-auto">
        <span className="text-[24px] md:text-[32px] font-extrabold font-serif tracking-tight text-white leading-none text-center md:text-left">{storeName}</span>
        <span className="block w-full h-1 md:h-1.5 bg-white mt-1"></span>
      </Link>

      {/* Navigation (Desktop only) */}
      <nav className="hidden md:flex items-center gap-10 text-sm font-bold text-white/90">
        <Link href="/" className="hover:text-white transition-colors">{t('nav.menu')}</Link>
        <Link href="/about" className="hover:text-white transition-colors">{t('nav.about')}</Link>
      </nav>

      {/* Right side icons */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Language Flags (Hidden on very small mobile) */}
        <LanguageSelector />

        {/* Cart Icon */}
        <CartButton />

        {/* Login Icon */}
        <Link href="/login" className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors">
          <User size={18} className="fill-current" />
          <span className="text-[10px] mt-0.5 font-semibold hidden md:block">{t('nav.login')}</span>
        </Link>
      </div>
    </div>
  );
}
