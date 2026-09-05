'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, ChevronDown, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { BACKEND_URL } from '@/lib/config';
import CartButton from './CartButton';
import { useUI } from './UIProvider';

export default function HeaderClient({ storeName }: { storeName: string }) {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useUI();
  const pathname = usePathname();
  const backendUrl = BACKEND_URL;
  const [isMounted, setIsMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center pt-1 md:pt-2 transition-transform active:scale-95">
        <img
          src="/images/logo.png"
          alt="PizzaGenie Logo"
          className="h-8 md:h-11 w-auto object-contain"
        />
      </Link>
      {/* Navigation (Desktop only) */}
      <nav className="hidden md:flex items-center gap-10 text-base font-black uppercase">
        {[
          { label: "Menu", href: "/" },
          { label: "Tra cứu đơn", href: "/lookup" },
          { label: "Giới thiệu", href: "/about" },
          { label: "Đánh giá", href: "/reviews" }
        ].map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative py-1.5 transition-colors duration-200 ${
                active ? "text-[#f5c043]" : "text-white/80 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              <span className={`absolute bottom-0 left-0 w-full h-[3px] bg-[#f5c043] rounded-full transition-transform duration-300 origin-center ${
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`} />
            </Link>
          );
        })}
      </nav>

      {/* Right side icons */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="group cursor-pointer rounded-full bg-black/45 p-[3px] outline-none transition-all duration-300 hover:bg-black/60 focus:outline-none border border-white/[0.08] hover:border-white/15 active:scale-95 shadow-sm"
          title={theme === 'dark' ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          <span className="sr-only">
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </span>

          <span aria-hidden className="relative flex gap-[6px]">
            {/* Indicator */}
            <span
              className={cn(
                "absolute size-[28px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out",
                theme === 'dark' ? "translate-x-[34px]" : "translate-x-0"
              )}
            />

            {/* Sun Icon */}
            <span
              className={cn(
                "relative grid size-[28px] place-items-center rounded-full transition-colors duration-300",
                theme === 'light' ? "text-[#f5c043] scale-105" : "text-white/40 group-hover:text-white/75"
              )}
            >
              <Sun size={14} strokeWidth={2.5} />
            </span>

            {/* Moon Icon */}
            <span
              className={cn(
                "relative grid size-[28px] place-items-center rounded-full transition-colors duration-300",
                theme === 'dark' ? "text-[#f5c043] scale-105" : "text-white/40 group-hover:text-white/75"
              )}
            >
              <Moon size={14} strokeWidth={2.5} />
            </span>
          </span>
        </button>

        {/* Cart Icon */}
        <CartButton />

        {/* Auth: Login or User Menu */}
        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              {user.avatar ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                  <img
                    src={`${backendUrl}${user.avatar}`}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-pizza-red flex items-center justify-center text-white font-bold text-sm">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-sm font-semibold hidden md:block max-w-[100px] truncate">
                {user.username}
              </span>
              <ChevronDown size={14} className={`hidden md:block transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <User size={16} />
                  {"Tài khoản"}
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  {"Đăng xuất"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors">
            <User size={18} className="fill-current" />
            <span className="text-[10px] mt-0.5 font-semibold hidden md:block">{"Đăng nhập"}</span>
          </Link>
        )}

        {/* Hamburger Menu Button (Mobile only) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="block md:hidden p-2 text-gray-300 hover:text-white focus:outline-none transition-colors active:scale-95 cursor-pointer"
          title="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#121424]/98 border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200 z-40 md:hidden font-black uppercase text-sm tracking-wide text-white/90">
          {[
            { label: "Menu", href: "/" },
            { label: "Tra cứu đơn", href: "/lookup" },
            { label: "Giới thiệu", href: "/about" },
            { label: "Đánh giá", href: "/reviews" }
          ].map((item, idx, arr) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-2 ${
                  idx < arr.length - 1 ? "border-b border-white/5" : ""
                } ${active ? "text-[#f5c043] font-black" : "text-white/80 hover:text-[#f5c043]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
