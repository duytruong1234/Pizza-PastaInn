'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import CartButton from './CartButton';

export default function HeaderClient({ storeName }: { storeName: string }) {
  const { user, clearAuth } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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
      <Link href="/" className="flex flex-col items-center md:items-start justify-center pt-2 md:mx-0 mx-auto">
        <span className="text-[24px] md:text-[32px] font-extrabold font-serif tracking-tight text-white leading-none text-center md:text-left">{storeName}</span>
        <span className="block w-full h-1 md:h-1.5 bg-white mt-1"></span>
      </Link>

      {/* Navigation (Desktop only) */}
      <nav className="hidden md:flex items-center gap-10 text-sm font-bold text-white/90">
        <Link href="/" className="hover:text-white transition-colors">{"Menu"}</Link>
        <Link href="/about" className="hover:text-white transition-colors">{"About"}</Link>
      </nav>

      {/* Right side icons */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Cart Icon */}
        <CartButton />

        {/* Auth: Login or User Menu */}
        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-pizza-red flex items-center justify-center text-white font-bold text-sm">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
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
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  {"Log out"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors">
            <User size={18} className="fill-current" />
            <span className="text-[10px] mt-0.5 font-semibold hidden md:block">{"Sign in"}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
