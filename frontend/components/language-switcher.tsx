"use client"

import { useState, useRef, useEffect } from "react"
import { Globe, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import type { Locale } from "@/lib/translations"

const languages: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "Romaji", nativeLabel: "EN" },
  { code: "ru", label: "Русский", nativeLabel: "RU" },
]

interface LanguageSwitcherProps {
  variant?: "default" | "mobile"
}

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  const currentLanguage = languages.find((lang) => lang.code === locale)

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-2 py-2">
        <span className="text-sm font-medium text-foreground-muted px-2">
          {t.language.selectLanguage}
        </span>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code)
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300",
                locale === lang.code
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border hover:border-primary/50 hover:bg-primary/5 text-foreground-muted"
              )}
            >
              <span className="font-medium">{lang.nativeLabel}</span>
              {locale === lang.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300",
          "border hover:bg-primary/5 bg-background/70 backdrop-blur-xl",
          isOpen
            ? "border-primary bg-primary/10"
            : "border-border/60 hover:border-primary/50"
        )}
        aria-label={t.language.selectLanguage}
        aria-expanded={isOpen}
      >
        <Globe
          className={cn(
            "w-4 h-4 transition-colors duration-300",
            isOpen ? "text-primary" : "text-foreground-muted"
          )}
        />
        <span
          className={cn(
            "text-sm font-medium transition-colors duration-300",
            isOpen ? "text-primary" : "text-foreground-muted"
          )}
        >
          {currentLanguage?.nativeLabel}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-all duration-300",
            isOpen ? "text-primary rotate-180" : "text-foreground-muted"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          "absolute right-0 top-full mt-2 min-w-[160px] rounded-xl overflow-hidden transition-all duration-300 origin-top-right z-50 bg-background-secondary/95 backdrop-blur-xl border border-border shadow-lg",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code)
                setIsOpen(false)
              }}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-4 py-2.5 transition-all duration-200",
                locale === lang.code
                  ? "text-primary bg-primary/10"
                  : "text-foreground-muted hover:text-foreground hover:bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{lang.nativeLabel}</span>
                <span className="text-sm opacity-70">{lang.label}</span>
              </div>
              {locale === lang.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
