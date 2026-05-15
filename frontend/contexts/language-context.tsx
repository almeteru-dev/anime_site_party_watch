"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { translations, type Locale, type TranslationKeys } from "@/lib/translations"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
  isChanging: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = "lycorislib-locale"

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru")
  const [isChanging, setIsChanging] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load saved locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (savedLocale && (savedLocale === "en" || savedLocale === "ru")) {
      setLocaleState(savedLocale)
    }
    setIsHydrated(true)
  }, [])

  // Update html lang attribute when locale changes
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.lang = locale
    }
  }, [locale, isHydrated])

  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === locale) return
    
    setIsChanging(true)
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, newLocale)
    
    // Apply shimmer effect duration
    setTimeout(() => {
      setLocaleState(newLocale)
      setTimeout(() => {
        setIsChanging(false)
      }, 300)
    }, 150)
  }, [locale])

  const t = translations[locale]

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isChanging }}>
      <div className={isChanging ? "language-changing" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
