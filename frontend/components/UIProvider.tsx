'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ThemeType = 'light' | 'dark';

type UIContextType = {
  isCartOpen: boolean;
  toggleCart: () => void;
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [theme, setThemeState] = useState<ThemeType>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('profile_theme') as ThemeType;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <UIContext.Provider value={{ isCartOpen, toggleCart, theme, toggleTheme, setTheme }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    console.warn('Warning: useUI is being used outside of a UIProvider. Falling back to default values to prevent crash.');
    return {
      isCartOpen: false,
      toggleCart: () => {},
      theme: 'dark' as ThemeType,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}

