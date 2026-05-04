'use client';

import React from 'react';
import { useUI } from './UIProvider';

export default function LanguageSelector() {
  const { language, setLanguage } = useUI();

  const flags = [
    { code: 'vi', src: 'https://flagcdn.com/w40/vn.png', alt: 'VN' },
    { code: 'en', src: 'https://flagcdn.com/w40/gb.png', alt: 'EN' },
    { code: 'kr', src: 'https://flagcdn.com/w40/kr.png', alt: 'KR' },
  ];

  return (
    <div className="hidden sm:flex items-center gap-2">
      {flags.map((flag) => (
        <img
          key={flag.code}
          src={flag.src}
          alt={flag.alt}
          onClick={() => setLanguage(flag.code as any)}
          className={`w-8 h-5 cursor-pointer shadow-sm transition-opacity duration-200 ${
            language === flag.code ? 'opacity-100 scale-110 border-2 border-white' : 'opacity-40 hover:opacity-80 grayscale-[50%]'
          }`}
        />
      ))}
    </div>
  );
}
