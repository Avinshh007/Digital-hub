// src/context/LanguageContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language;
    if (saved === 'en' || saved === 'te') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
  };

  // We fallback to english keys if a key is not present in telugu,
  // but translations object contains all complete keys for both languages.
  const t = translations[language] || translations['en'];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
