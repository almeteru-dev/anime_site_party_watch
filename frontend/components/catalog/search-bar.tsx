'use client'

import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
  onMobileFilterToggle?: () => void
}

export function SearchBar({ value, onChange, resultCount, onMobileFilterToggle }: SearchBarProps) {
  const { locale, t } = useLanguage()

  const resultText = locale === "ru" ? `${resultCount} ${t.catalog.resultsFound}` : t.catalog.resultsFound

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
        <input
          type="text"
          placeholder={t.catalog.searchPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-border/50 bg-background-secondary/50 backdrop-blur-sm",
            "py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-foreground-subtle",
            "transition-all duration-200",
            "focus:outline-none focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20",
            "hover:border-accent-muted/50"
          )}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-foreground-subtle hover:text-foreground hover:bg-background-tertiary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <button
        onClick={onMobileFilterToggle}
        className="lg:hidden flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-background-secondary/50 px-4 py-3 text-sm font-medium text-foreground-muted hover:border-accent-primary/50 hover:text-foreground transition-all"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t.catalog.filters.title}
      </button>

      {/* Result Count */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-foreground-subtle shrink-0">
        <span className="text-accent-primary font-semibold">{resultCount}</span>
        <span>{locale === "ru" ? t.catalog.resultsFound : resultText}</span>
      </div>
    </div>
  )
}
