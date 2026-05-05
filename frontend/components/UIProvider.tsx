'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { t as translate, type Language } from '@/lib/translations';
import { translateMenu, translateIngredients } from '@/lib/menuTranslations';

type UIContextType = {
  isCartOpen: boolean;
  toggleCart: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tMenu: (text: string) => string;
  tIngredient: (text: string) => string;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('vi'); // mặc định tiếng Việt

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const t = useCallback((key: string) => translate(language, key), [language]);
  const tMenu = useCallback((text: string) => translateMenu(text, language), [language]);
  const tIngredient = useCallback((text: string) => translateIngredients(text, language), [language]);

  return (
    <UIContext.Provider value={{ isCartOpen, toggleCart, language, setLanguage: setLanguage as (lang: Language) => void, t, tMenu, tIngredient }}>
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
