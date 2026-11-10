'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DialogProvider } from '@/components/ui/dialog-provider';
import { useCartStore } from '@/store/cartStore';
import {
  Language,
  translations,
  translateDynamic,
  translateIngredients,
  translateComboDescription,
} from '@/lib/i18n';

type ThemeType = 'light' | 'dark';

type UIContextType = {
  isCartOpen: boolean;
  isCartPinned: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  togglePinCart: () => void;
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  td: (text?: string | null) => string;
  ti: (text?: string | null) => string;
  tc: (text?: string | null) => string;
};

const CART_PINNED_STORAGE_KEY = 'pizzagenie_cart_pinned';
const LANG_STORAGE_KEY = 'pizza_inn_lang';

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartPinned, setIsCartPinned] = useState(false);
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [lang, setLangState] = useState<Language>('vi');

  const itemsCount = useCartStore((state) => state.items.length);
  const lastAddedAt = useCartStore((state) => state.lastAddedAt);
  const prevItemsCountRef = useRef<number | null>(null);
  const isHydratedRef = useRef(false);

  // Khởi tạo theme và trạng thái ghim giỏ hàng từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('profile_theme') as ThemeType | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(savedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add('dark');
    }

    const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
    if (savedLang === 'vi' || savedLang === 'en') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      document.documentElement.lang = 'vi';
    }

    const savedPinned = localStorage.getItem(CART_PINNED_STORAGE_KEY) === 'true';
    setIsCartPinned(savedPinned);

    const initialItems = useCartStore.getState().items.length;
    prevItemsCountRef.current = initialItems;
    isHydratedRef.current = true;

    // Nếu người dùng đã ghim giỏ hàng trước đó và giỏ có món trên desktop, mở sẵn sidebar đã ghim
    if (savedPinned && initialItems > 0 && window.innerWidth >= 1024) {
      setIsCartOpen(true);
    }
  }, []);

  // Tự động mở drawer khi thêm món đầu tiên (desktop >= 1024px) và tự đóng khi xoá hết món
  useEffect(() => {
    if (!isHydratedRef.current) return;

    const prevCount = prevItemsCountRef.current ?? 0;

    if (prevCount === 0 && itemsCount > 0 && lastAddedAt > 0) {
      // Khi khách bấm thêm món lần đầu trên desktop: giỏ hàng tự trượt ra
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCartOpen(true);
      }
    } else if (prevCount > 0 && itemsCount === 0) {
      // Khi xoá hết món trong giỏ: tự đóng drawer
      setIsCartOpen(false);
    }

    prevItemsCountRef.current = itemsCount;
  }, [itemsCount, lastAddedAt]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('profile_theme', newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
    document.documentElement.lang = newLang;
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'vi' ? 'en' : 'vi');
  }, [lang, setLang]);

  const t = useCallback(
    (key: string) => {
      return translations[lang]?.[key] ?? translations.vi[key] ?? key;
    },
    [lang]
  );

  const td = useCallback(
    (text?: string | null) => {
      return translateDynamic(text, lang);
    },
    [lang]
  );

  const ti = useCallback(
    (text?: string | null) => {
      return translateIngredients(text, lang);
    },
    [lang]
  );

  const tc = useCallback(
    (text?: string | null) => {
      return translateComboDescription(text, lang);
    },
    [lang]
  );

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const togglePinCart = useCallback(() => {
    setIsCartPinned((prev) => {
      const next = !prev;
      localStorage.setItem(CART_PINNED_STORAGE_KEY, String(next));
      if (next) {
        setIsCartOpen(true);
      }
      return next;
    });
  }, []);

  return (
    <UIContext.Provider
      value={{
        isCartOpen,
        isCartPinned,
        openCart,
        closeCart,
        toggleCart,
        togglePinCart,
        theme,
        toggleTheme,
        setTheme,
        lang,
        setLang,
        toggleLang,
        t,
        td,
        ti,
        tc,
      }}
    >
      <DialogProvider>{children}</DialogProvider>
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    console.warn('Warning: useUI is being used outside of a UIProvider. Falling back to default values to prevent crash.');
    return {
      isCartOpen: false,
      isCartPinned: false,
      openCart: () => {},
      closeCart: () => {},
      toggleCart: () => {},
      togglePinCart: () => {},
      theme: 'dark' as ThemeType,
      toggleTheme: () => {},
      setTheme: () => {},
      lang: 'vi' as Language,
      setLang: () => {},
      toggleLang: () => {},
      t: (key: string) => translations.vi[key] ?? key,
      td: (text?: string | null) => translateDynamic(text, 'vi'),
      ti: (text?: string | null) => translateIngredients(text, 'vi'),
      tc: (text?: string | null) => translateComboDescription(text, 'vi'),
    };
  }
  return context;
}
