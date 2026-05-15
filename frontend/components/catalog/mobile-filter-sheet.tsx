'use client'

import { X } from 'lucide-react'
import { FilterSidebar, type FilterState } from './filter-sidebar'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import type { Genre, KindOption, Source, Status, Studio, Theme } from '@/lib/api'

interface MobileFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onReset: () => void
  genreOptions: Genre[]
  themeOptions: Theme[]
  statusOptions: Status[]
  studioOptions: Studio[]
  sourceOptions: Source[]
  ratingOptions: string[]
  typeOptions: KindOption[]
  onFiltersChange: (filters: FilterState) => void
  onYearsChange: (years: { min: number; max: number }) => void
  onMinRatingChange: (minRating: number) => void
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onReset,
  genreOptions,
  themeOptions,
  statusOptions,
  studioOptions,
  sourceOptions,
  ratingOptions,
  typeOptions,
  onYearsChange,
  onMinRatingChange,
}: MobileFilterSheetProps) {
  const { t } = useLanguage()

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm transform transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col bg-background-secondary border-r border-border/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground">{t.catalog.filters.title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-foreground-subtle hover:bg-background-tertiary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="[&>aside]:w-full [&>aside>div]:rounded-none [&>aside>div]:border-0 [&>aside>div]:bg-transparent [&>aside>div]:shadow-none">
              <FilterSidebar
                filters={filters}
                genreOptions={genreOptions}
                themeOptions={themeOptions}
                statusOptions={statusOptions}
                studioOptions={studioOptions}
                sourceOptions={sourceOptions}
                ratingOptions={ratingOptions}
                typeOptions={typeOptions}
                onFiltersChange={onFiltersChange}
                onYearsChange={onYearsChange}
                onMinRatingChange={onMinRatingChange}
                onReset={onReset}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
