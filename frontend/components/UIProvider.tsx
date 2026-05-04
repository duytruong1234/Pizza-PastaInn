'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { t as translate, type Language } from '@/lib/translations';

type UIContextType = {
  isCartOpen: boolean;
  toggleCart: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('vi'); // default is Vietnamese

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const t = useCallback((key: string) => translate(language, key), [language]);

  return (
    <UIContext.Provider value={{ isCartOpen, toggleCart, language, setLanguage: setLanguage as (lang: Language) => void, t }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
