'use client'

import { useState } from 'react'
import { Filter, RotateCcw, ChevronDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import type { Genre, KindOption, Producer, Source, Status, Studio, Theme } from '@/lib/api'

export interface FilterState {
  genres: string[]
  themes: string[]
  producers: string[]
  types: string[]
  statuses: string[]
  studio: string
  source: string
  rating: string
  sortBy: "score" | "studio" | "source" | "rating"
  sortDir: "asc" | "desc"
  years: { min: number; max: number }
  yearBounds: { min: number; max: number }
  minRating: number
  releaseUnknown: boolean
}

interface FilterSidebarProps {
  filters: FilterState
  onReset: () => void
  genreOptions: Genre[]
  themeOptions: Theme[]
  producerOptions: Producer[]
  statusOptions: Status[]
  studioOptions: Studio[]
  sourceOptions: Source[]
  ratingOptions: string[]
  typeOptions: KindOption[]
  onFiltersChange: (filters: FilterState) => void
  onYearsChange: (years: { min: number; max: number }) => void
  onMinRatingChange: (minRating: number) => void
}

interface FilterSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border/50 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {title}
        <ChevronDown className={cn(
          "h-4 w-4 text-foreground-subtle transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "grid transition-all duration-200",
        isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  onYearsChange,
  onMinRatingChange,
  onReset,
  genreOptions,
  themeOptions,
  statusOptions,
  studioOptions,
	producerOptions,
  sourceOptions,
  ratingOptions,
  typeOptions,
}: FilterSidebarProps) {
  const { locale, t } = useLanguage()
	const producersTitle = locale === "ru" ? "Продюсеры" : "Producers"

  const getItemLabel = (item: { name: string; ru_name?: string | null }, fallbackRu?: string) => {
    if (locale !== "ru") return item.name
    return item.ru_name?.trim() || fallbackRu || item.name
  }

  const toggleGenre = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre]
    onFiltersChange({ ...filters, genres: newGenres })
  }

  const toggleTheme = (theme: string) => {
    const newThemes = filters.themes.includes(theme)
      ? filters.themes.filter(t => t !== theme)
      : [...filters.themes, theme]
    onFiltersChange({ ...filters, themes: newThemes })
  }

	const toggleProducer = (producer: string) => {
		const newProducers = filters.producers.includes(producer)
			? filters.producers.filter((p) => p !== producer)
			: [...filters.producers, producer]
		onFiltersChange({ ...filters, producers: newProducers })
	}

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    onFiltersChange({ ...filters, statuses: newStatuses })
  }

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onFiltersChange({ ...filters, types: newTypes })
  }

  const setStudio = (studio: string) => {
    onFiltersChange({ ...filters, studio })
  }

  const setSource = (source: string) => {
    onFiltersChange({ ...filters, source })
  }

  const setRating = (rating: string) => {
    onFiltersChange({ ...filters, rating })
  }

  const setSortBy = (sortBy: FilterState["sortBy"]) => {
    onFiltersChange({ ...filters, sortBy })
  }

  const setSortDir = (sortDir: FilterState["sortDir"]) => {
    onFiltersChange({ ...filters, sortDir })
  }

  const toggleReleaseUnknown = () => {
    onFiltersChange({ ...filters, releaseUnknown: !filters.releaseUnknown })
  }

  const getStatusLabel = (status: Status) => {
    const map = t.catalog.filters.statusValues as Record<string, string>
    return getItemLabel(status, map[status.name])
  }

  const getTypeLabel = (kind: KindOption) => {
    const map = t.catalog.filters.typeValues as Record<string, string>
    return getItemLabel(kind, map[kind.name])
  }

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="sticky top-20 rounded-xl border border-border/50 bg-background-secondary/50 backdrop-blur-sm card-shadow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t.catalog.filters.title}</span>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium text-foreground-subtle hover:text-primary transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t.catalog.filters.reset}
          </button>
        </div>

        <div className="px-5 pt-3 text-xs text-foreground-subtle">
          {t.catalog.filters.tip}
        </div>

        <div className="px-5">
          {/* Genres */}
          <FilterSection title={t.catalog.filters.genres}>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.name)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    filters.genres.includes(genre.name)
                      ? "bg-primary text-primary-foreground border border-primary shadow-[var(--glow-primary)]"
                      : "bg-muted/40 text-foreground-muted hover:bg-muted/60 hover:text-foreground border border-border/50 hover:border-primary/40"
                  )}
                >
                  {getItemLabel(genre)}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Status */}
          <FilterSection title={t.catalog.filters.status}>
            <div className="flex flex-col gap-2">
              {statusOptions.map((status) => (
                <div
                  key={status.id}
                  onClick={() => toggleStatus(status.name)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={filters.statuses.includes(status.name)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-sm text-foreground-muted group-hover:text-foreground transition-colors">
                    {getStatusLabel(status)}
                  </span>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Year Range */}
          <FilterSection title={t.catalog.filters.year}>
            <div className="space-y-4">
              <Slider
                value={[filters.years.min, filters.years.max]}
                min={filters.yearBounds.min}
                max={filters.yearBounds.max}
                step={1}
                onValueChange={(value) => onYearsChange({ min: value[0], max: value[1] })}
                className="[&_[data-slot=slider-track]]:bg-muted/40 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:bg-background"
              />
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span className="px-2 py-1 rounded bg-background-tertiary">{filters.years.min}</span>
                <span className="text-foreground-subtle">{t.catalog.filters.to}</span>
                <span className="px-2 py-1 rounded bg-background-tertiary">{filters.years.max}</span>
              </div>

				<div
					onClick={toggleReleaseUnknown}
					className="flex items-center gap-3 cursor-pointer group"
				>
					<Checkbox
						checked={filters.releaseUnknown}
						className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
					/>
					<span className="text-sm text-foreground-muted group-hover:text-foreground transition-colors">
						{t.catalog.filters.releaseDateUnknown}
					</span>
				</div>
            </div>
          </FilterSection>

          {/* Themes */}
          <FilterSection title={t.catalog.filters.themes || "Themes"}>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => toggleTheme(theme.name)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    filters.themes.includes(theme.name)
                      ? "bg-primary text-primary-foreground border border-primary shadow-[var(--glow-primary)]"
                      : "bg-muted/40 text-foreground-muted hover:bg-muted/60 hover:text-foreground border border-border/50 hover:border-primary/40"
                  )}
                >
                  {getItemLabel(theme)}
                </button>
              ))}
            </div>
          </FilterSection>

			{/* Producers */}
			<FilterSection title={producersTitle}>
				<div className="flex flex-wrap gap-2">
					{producerOptions.map((p) => (
						<button
							key={p.id}
							onClick={() => toggleProducer(p.name)}
							className={cn(
								"rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
								filters.producers.includes(p.name)
									? "bg-primary text-primary-foreground border border-primary shadow-[var(--glow-primary)]"
									: "bg-muted/40 text-foreground-muted hover:bg-muted/60 hover:text-foreground border border-border/50 hover:border-primary/40"
							)}
						>
							{getItemLabel(p)}
						</button>
					))}
				</div>
			</FilterSection>

          {/* Type */}
          <FilterSection title={t.catalog.filters.type}>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.name)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    filters.types.includes(type.name)
                      ? "bg-primary text-primary-foreground border border-primary shadow-[var(--glow-primary)]"
                      : "bg-muted/40 text-foreground-muted hover:bg-muted/60 hover:text-foreground border border-border/50 hover:border-primary/40"
                  )}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Sort */}
          <FilterSection title={t.catalog.filters.sort}>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">{t.catalog.filters.sortBy}</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setSortBy(e.target.value as FilterState["sortBy"])}
                  className="w-full h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
                >
                  <option value="score">{t.catalog.filters.sortValues.score}</option>
                  <option value="studio">{t.catalog.filters.sortValues.studio}</option>
                  <option value="source">{t.catalog.filters.sortValues.source}</option>
                  <option value="rating">{t.catalog.filters.sortValues.rating}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">{t.catalog.filters.direction}</label>
                <select
                  value={filters.sortDir}
                  onChange={(e) => setSortDir(e.target.value as FilterState["sortDir"])}
                  className="w-full h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
                >
                  <option value="desc">{t.catalog.filters.descending}</option>
                  <option value="asc">{t.catalog.filters.ascending}</option>
                </select>
              </div>
            </div>
          </FilterSection>

          {/* Studio */}
          <FilterSection title={t.catalog.filters.studio}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">{t.catalog.filters.studio}</label>
              <select
                value={filters.studio}
                onChange={(e) => setStudio(e.target.value)}
                className="w-full h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
              >
                <option value="">{t.catalog.filters.all}</option>
                {studioOptions.map((s) => (
                  <option key={s.id} value={s.name}>
                    {getItemLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </FilterSection>

          {/* Source */}
          <FilterSection title={t.catalog.filters.source}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">{t.catalog.filters.source}</label>
              <select
                value={filters.source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
              >
                <option value="">{t.catalog.filters.all}</option>
                {sourceOptions.map((s) => (
                  <option key={s.id} value={s.name}>
                    {getItemLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </FilterSection>

          {/* Rating (content rating) */}
          <FilterSection title={t.catalog.filters.rating}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">{t.catalog.filters.rating}</label>
              <select
                value={filters.rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
              >
                <option value="">{t.catalog.filters.all}</option>
                {ratingOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </FilterSection>

          {/* Rating */}
          <FilterSection title={t.catalog.filters.minRating}>
            <div className="space-y-4">
              <Slider
                value={[filters.minRating]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={(value) => onMinRatingChange(value[0])}
                className="[&_[data-slot=slider-track]]:bg-muted/40 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:bg-background"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-subtle">0</span>
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold">
                  {filters.minRating}+
                </span>
                <span className="text-foreground-subtle">10</span>
              </div>
            </div>
          </FilterSection>
        </div>

      </div>
    </aside>
  )
}
