'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { BACKEND_URL } from '@/lib/config';
import CartButton from './CartButton';
import { useUI } from './UIProvider';

export default function HeaderClient({ storeName }: { storeName: string }) {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme, lang, setLang, t } = useUI();
  const isLight = theme === 'light';
  const pathname = usePathname();
  const backendUrl = BACKEND_URL;
  const [isMounted, setIsMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setShowDropdown(false);
    window.location.href = '/';
  };

  const isLoggedIn = isMounted && user;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-md transition-colors duration-300',
        isLight
          ? 'bg-white/95 text-zinc-900 shadow-[0_4px_18px_rgba(0,0,0,0.08)]'
          : 'bg-[#14110f] text-white shadow-[0_4px_24px_rgba(0,0,0,0.45)]'
      )}
    >
      <div className="relative w-full max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-14 py-3.5 md:py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          title={storeName}
          className="flex items-center shrink-0 transition-transform active:scale-95 rounded-lg overflow-hidden"
        >
          <img
            src="/images/logo.png"
            alt="PizzaGenie Logo"
            className="h-9 md:h-11 w-auto object-contain"
          />
        </Link>

        {/* Navigation (Desktop only) */}
        <nav
          className={cn(
            'hidden lg:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2 items-center gap-1.5 xl:gap-2.5 border rounded-full px-2.5 py-1.5 text-sm xl:text-[15px] font-extrabold uppercase tracking-wide transition-colors duration-250 whitespace-nowrap',
            isLight
              ? 'bg-zinc-100 border-zinc-200'
              : 'bg-white/[0.04] border-white/[0.08]'
          )}
        >
          {[
            { label: t('nav.menu'), href: '/' },
            { label: t('nav.lookup'), href: '/lookup' },
            { label: t('nav.about'), href: '/about' },
            { label: t('nav.reviews'), href: '/reviews' },
          ].map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 lg:px-5 py-2 rounded-full transition-all duration-200',
                  active
                    ? 'bg-[#f5c043] text-zinc-950 shadow-[0_2px_10px_rgba(245,192,67,0.35)]'
                    : isLight
                      ? 'text-zinc-700 hover:text-zinc-950 hover:bg-black/[0.05]'
                      : 'text-white/80 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher (Rectangular VI / EN Flags) */}
          <div className="flex items-center gap-2 mr-0.5" role="group" aria-label={t('nav.lang_switch')}>
            {/* Vietnam Flag */}
            <button
              type="button"
              onClick={() => setLang('vi')}
              title="Tiếng Việt"
              aria-label="Tiếng Việt"
              aria-pressed={lang === 'vi'}
              className={cn(
                'cursor-pointer w-[32px] h-[21px] md:w-[34px] md:h-[22px] overflow-hidden transition-all duration-200 active:scale-95 outline-none',
                lang === 'vi'
                  ? 'opacity-100 scale-105 ring-1 ring-[#f5c043] shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <svg viewBox="0 0 30 20" className="w-full h-full block" aria-hidden="true">
                <rect width="30" height="20" fill="#DA251D" />
                <polygon
                  fill="#FFFF00"
                  points="15,4 16.47,8.52 21.22,8.52 17.38,11.31 18.85,15.83 15,13.04 11.15,15.83 12.62,11.31 8.78,8.52 13.53,8.52"
                />
              </svg>
            </button>

            {/* UK Flag */}
            <button
              type="button"
              onClick={() => setLang('en')}
              title="English"
              aria-label="English"
              aria-pressed={lang === 'en'}
              className={cn(
                'cursor-pointer w-[32px] h-[21px] md:w-[34px] md:h-[22px] overflow-hidden transition-all duration-200 active:scale-95 outline-none',
                lang === 'en'
                  ? 'opacity-100 scale-105 ring-1 ring-[#f5c043] shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <svg viewBox="0 0 60 40" className="w-full h-full block" aria-hidden="true">
                <rect width="60" height="40" fill="#012169" />
                <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
                <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
                <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="12" />
                <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
              </svg>
            </button>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'group cursor-pointer h-10 md:h-11 rounded-full p-1.5 outline-none transition-all duration-300 border active:scale-95 shadow-sm flex items-center',
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/12 hover:border-white/25'
            )}
            title={theme === 'dark' ? t('nav.theme_light') : t('nav.theme_dark')}
          >
            <span className="sr-only">
              Switch to {theme === 'dark' ? 'light' : 'dark'} mode
            </span>

            <span aria-hidden className="relative flex items-center gap-1.5">
              {/* Indicator */}
              <span
                className={cn(
                  'absolute size-[30px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all duration-300 ease-in-out',
                  isLight ? 'bg-[#f5c043]' : 'bg-white',
                  theme === 'dark' ? 'translate-x-[36px]' : 'translate-x-0'
                )}
              />

              {/* Sun Icon */}
              <span
                className={cn(
                  'relative grid size-[30px] place-items-center rounded-full transition-colors duration-300',
                  theme === 'light' ? 'text-zinc-950 scale-105' : 'text-white/45 group-hover:text-white/80'
                )}
              >
                <Sun size={15} strokeWidth={2.5} />
              </span>

              {/* Moon Icon */}
              <span
                className={cn(
                  'relative grid size-[30px] place-items-center rounded-full transition-colors duration-300',
                  theme === 'dark' ? 'text-zinc-900 scale-105' : 'text-zinc-500 group-hover:text-zinc-900'
                )}
              >
                <Moon size={15} strokeWidth={2.5} />
              </span>
            </span>
          </button>

          {/* Cart Button */}
          <CartButton />

          {/* Auth: Login or User Menu (Icon only) */}
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                title={user.username || 'Tài khoản'}
                aria-label={user.username || 'Tài khoản'}
                className={cn(
                  'w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full border transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-sm',
                  showDropdown
                    ? isLight
                      ? 'bg-zinc-200 border-[#d4a017] ring-2 ring-[#f5c043]/40'
                      : 'bg-white/[0.14] border-[#f5c043] ring-2 ring-[#f5c043]/35'
                    : isLight
                      ? 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/12 hover:border-white/25'
                )}
              >
                {user.avatar ? (
                  <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden ring-1 ring-[#f5c043]/60 shrink-0">
                    <img
                      src={`${backendUrl}${user.avatar}`}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-pizza-red flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20 shrink-0">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div
                  className={cn(
                    'absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-2xl border py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden',
                    isLight
                      ? 'bg-white text-zinc-900 border-[#dfd3bf]'
                      : 'bg-[#1a1c2e] text-white border-white/12'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-2.5 border-b',
                      isLight ? 'border-zinc-100 bg-[#faf6ef]' : 'border-white/10 bg-white/[0.03]'
                    )}
                  >
                    <p className={cn('text-sm font-bold truncate', isLight ? 'text-zinc-900' : 'text-white')}>
                      {user.username}
                    </p>
                    <p className={cn('text-xs truncate mt-0.5', isLight ? 'text-zinc-500' : 'text-gray-400')}>
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b',
                      isLight
                        ? 'text-zinc-700 hover:bg-[#faf6ef] hover:text-[#ee2828] border-zinc-100'
                        : 'text-gray-200 hover:bg-white/[0.08] hover:text-[#f5c043] border-white/5'
                    )}
                  >
                    <User size={15} />
                    <span>{t('nav.profile')}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              title={t('nav.login')}
              aria-label={t('nav.login')}
              className={cn(
                'w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full border transition-all active:scale-95 shadow-sm',
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-900'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/12 hover:border-[#f5c043]/50 text-white'
              )}
            >
              <User size={18} className={isLight ? 'text-[#ee2828]' : 'text-[#f5c043]'} />
            </Link>
          )}

          {/* Hamburger Menu Button (Mobile & Tablet) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              'flex lg:hidden items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full border focus:outline-none transition-colors active:scale-95 cursor-pointer',
              isLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-900'
                : 'bg-white/[0.06] border-white/12 text-gray-200 hover:text-white'
            )}
            title="Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile & Tablet Navigation Dropdown */}
        {mobileMenuOpen && (
          <div
            className={cn(
              'absolute top-full left-0 right-0 border-b shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 z-40 lg:hidden font-black uppercase text-sm tracking-wide',
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900'
                : 'bg-[#14110f]/98 border-white/[0.08] text-white/90'
            )}
          >
            {[
              { label: t('nav.menu'), href: '/' },
              { label: t('nav.lookup'), href: '/lookup' },
              { label: t('nav.about'), href: '/about' },
              { label: t('nav.reviews'), href: '/reviews' },
            ].map((item, idx, arr) => {
              const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'transition-colors py-2',
                    idx < arr.length - 1 && (isLight ? 'border-b border-black/5' : 'border-b border-white/5'),
                    active
                      ? 'text-[#ee2828] font-black'
                      : isLight
                        ? 'text-[#3d2e1e] hover:text-[#ee2828]'
                        : 'text-white/80 hover:text-[#f5c043]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Dải cờ Ý sát mép dưới Header: xanh #009246, giữa (trắng ở dark / bạc viền rõ ở light), đỏ #CE2B37 */}
      <div
        aria-hidden="true"
        className={cn(
          'h-[5px] w-full flex',
          isLight
            ? 'border-y border-zinc-300'
            : 'border-y border-black/30'
        )}
      >
        <div className="flex-1 bg-[#009246]" />
        <div className={cn('flex-1', isLight ? 'bg-zinc-200' : 'bg-[#ffffff]')} />
        <div className="flex-1 bg-[#CE2B37]" />
      </div>
    </header>
  );
}
