'use client'

import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilterSidebar, type FilterState } from './filter-sidebar'
import { AnimeGrid } from './anime-grid'
import { MobileFilterSheet } from './mobile-filter-sheet'
import { addToMyCollection, getMyCollection, type Anime, type CatalogMeta, type WatchlistStatus } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import type { AnimeStatus } from '@/components/anime-status-manager'
import { getCollectionMap, setCollectionStatus, subscribeCollection } from '@/lib/collection-cache'

const ITEMS_PER_PAGE = 12

function getFirst(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function buildQuery(filters: FilterState, search: string, page: number, extra?: Record<string, string | undefined>): string {
  const sp = new URLSearchParams()

  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) sp.set(k, v)
    }
  }

  if (search.trim()) sp.set('q', search.trim())
  if (filters.genres.length) sp.set('genres', filters.genres.join(','))
  if (filters.themes.length) sp.set('themes', filters.themes.join(','))
  if (filters.producers.length) sp.set('producers', filters.producers.join(','))
  if (filters.types.length) sp.set('types', filters.types.join(','))
  if (filters.statuses.length) sp.set('statuses', filters.statuses.join(','))
  if (filters.studio) sp.set('studios', filters.studio)
  if (filters.source) sp.set('sources', filters.source)
  if (filters.rating) sp.set('ratings', filters.rating)

  if (filters.sortBy !== 'score') sp.set('sort_by', filters.sortBy)
  if (filters.sortDir !== 'desc') sp.set('sort_dir', filters.sortDir)

  if (!filters.releaseUnknown) {
    if (filters.years.min !== filters.yearBounds.min) sp.set('year_from', String(filters.years.min))
    if (filters.years.max !== filters.yearBounds.max) sp.set('year_to', String(filters.years.max))
  }
  if (filters.minRating > 0) sp.set('min_rating', String(filters.minRating))
  if (filters.releaseUnknown) sp.set('release_unknown', '1')

  if (page > 1) sp.set('page', String(page))

  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

function deriveFiltersFromParams(params: Record<string, string | string[] | undefined>, yearMin: number, yearMax: number): {
  filters: FilterState
  search: string
  page: number
} {
  const q = getFirst(params.q) || ''
  const page = Math.max(1, Math.floor(parseNumber(getFirst(params.page)) || 1))
  const genres = parseCsv(getFirst(params.genres))
  const themes = parseCsv(getFirst(params.themes))
  const producers = parseCsv(getFirst(params.producers))
  const types = parseCsv(getFirst(params.types))
  const statuses = parseCsv(getFirst(params.statuses))
  const studio = getFirst(params.studios) || ''
  const source = getFirst(params.sources) || ''
  const rating = getFirst(params.ratings) || ''
  const sortByRaw = (getFirst(params.sort_by) || '').toLowerCase()
  const sortDirRaw = (getFirst(params.sort_dir) || '').toLowerCase()
  const sortBy = (sortByRaw === 'studio' || sortByRaw === 'source' || sortByRaw === 'rating' || sortByRaw === 'score'
    ? (sortByRaw as FilterState['sortBy'])
    : 'score')
  const sortDir = (sortDirRaw === 'asc' ? 'asc' : 'desc') as FilterState['sortDir']
  const yearFrom = parseNumber(getFirst(params.year_from))
  const yearTo = parseNumber(getFirst(params.year_to))
  const minRating = Math.max(0, parseNumber(getFirst(params.min_rating)) || 0)
  const releaseUnknown = (() => {
    const v = (getFirst(params.release_unknown) || '').toLowerCase()
    return v === '1' || v === 'true'
  })()

  const min = yearFrom !== undefined ? Math.max(yearMin, Math.floor(yearFrom)) : yearMin
  const max = yearTo !== undefined ? Math.min(yearMax, Math.floor(yearTo)) : yearMax
  const years = { min: Math.min(min, max), max: Math.max(min, max) }

  return {
    search: q,
    page,
    filters: {
      genres,
      themes,
      producers,
      types,
      statuses,
      studio,
      source,
      rating,
      sortBy,
      sortDir,
      years,
      yearBounds: { min: yearMin, max: yearMax },
      minRating,
      releaseUnknown,
    },
  }
}

interface CatalogClientProps {
  initialAnimes: Anime[]
  meta: CatalogMeta
  initialSearchParams: Record<string, string | string[] | undefined>
	basePath?: string
	extraQuery?: Record<string, string | undefined>
}

export function CatalogClient({ initialAnimes, meta, initialSearchParams, basePath = "/catalog", extraQuery }: CatalogClientProps) {
  const { user } = useAuth()
  const router = useRouter()

  const initial = useMemo(() => {
    return deriveFiltersFromParams(initialSearchParams, meta.year_min, meta.year_max)
  }, [initialSearchParams, meta.year_min, meta.year_max])

  const [filters, setFilters] = useState<FilterState>(initial.filters)
  const [searchQuery, setSearchQuery] = useState(initial.search)
  const [currentPage, setCurrentPage] = useState(initial.page)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [userStatuses, setUserStatuses] = useState<Record<string, AnimeStatus>>({})

  const searchDebounceRef = useRef<number | null>(null)
  const yearDebounceRef = useRef<number | null>(null)

  useEffect(() => {
    setFilters(initial.filters)
    setSearchQuery(initial.search)
    setCurrentPage(initial.page)
  }, [initial])

  useEffect(() => {
    if (!user) {
      setUserStatuses({})
      return
    }

    setUserStatuses(getCollectionMap(user.id))
    const unsub = subscribeCollection(user.id, () => {
      setUserStatuses(getCollectionMap(user.id))
    })
    return unsub
  }, [user])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) return
      try {
        const data = await getMyCollection()
        if (!mounted) return
        const next: Record<string, AnimeStatus> = {}
        for (const entry of data) {
          const s = (entry.collection_type?.name || '').toLowerCase() as AnimeStatus
          if (s) next[String(entry.anime_id)] = s
        }
        setUserStatuses(next)
        for (const [animeId, status] of Object.entries(next)) {
          setCollectionStatus(user.id, animeId, status as WatchlistStatus)
        }
      } catch {
        if (!mounted) return
      }
    })()
    return () => {
      mounted = false
    }
  }, [user])

  // Paginate results
  const totalPages = Math.ceil(initialAnimes.length / ITEMS_PER_PAGE)
  const paginatedAnime = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return initialAnimes.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [initialAnimes, currentPage])

  const navigate = useCallback(
    (nextFilters: FilterState, nextSearch: string, nextPage: number) => {
      const qs = buildQuery(nextFilters, nextSearch, nextPage, extraQuery)
      router.replace(`${basePath}${qs}`)
    },
    [basePath, extraQuery, router]
  )

  const handleResetFilters = useCallback(() => {
    const reset: FilterState = {
      genres: [],
      themes: [],
      producers: [],
      types: [],
      statuses: [],
      studio: '',
      source: '',
      rating: '',
      sortBy: 'score',
      sortDir: 'desc',
      years: { min: meta.year_min, max: meta.year_max },
      yearBounds: { min: meta.year_min, max: meta.year_max },
      minRating: 0,
      releaseUnknown: false,
    }
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }
    if (yearDebounceRef.current) {
      window.clearTimeout(yearDebounceRef.current)
      yearDebounceRef.current = null
    }
    setFilters(reset)
    setSearchQuery('')
    setCurrentPage(1)
    navigate(reset, '', 1)
  }, [meta.year_min, meta.year_max, navigate])

  const handleFiltersChange = useCallback(
    (next: FilterState) => {
      setFilters(next)
      setCurrentPage(1)
      navigate(next, searchQuery, 1)
    },
    [navigate, searchQuery]
  )

  const handleYearsChange = useCallback(
    (nextYears: { min: number; max: number }) => {
      const next: FilterState = { ...filters, years: nextYears }
      setFilters(next)
      setCurrentPage(1)
      if (yearDebounceRef.current) window.clearTimeout(yearDebounceRef.current)
      yearDebounceRef.current = window.setTimeout(() => {
        navigate(next, searchQuery, 1)
      }, 250)
    },
    [filters, navigate, searchQuery]
  )

  const handleMinRatingChange = useCallback(
    (minRating: number) => {
      const next: FilterState = { ...filters, minRating }
      setFilters(next)
      setCurrentPage(1)
      navigate(next, searchQuery, 1)
    },
    [filters, navigate, searchQuery]
  )

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = window.setTimeout(() => {
      navigate(filters, query, 1)
    }, 250)
  }, [filters, navigate])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    navigate(filters, searchQuery, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, navigate, searchQuery])

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            genreOptions={meta.genres}
            themeOptions={meta.themes}
            producerOptions={meta.producers}
            statusOptions={meta.statuses}
            studioOptions={meta.studios}
            sourceOptions={meta.sources}
            ratingOptions={meta.ratings.map((r) => r.name)}
            typeOptions={meta.kinds}
            onReset={handleResetFilters}
            onFiltersChange={handleFiltersChange}
            onYearsChange={handleYearsChange}
            onMinRatingChange={handleMinRatingChange}
          />
        </div>

        {/* Anime Grid */}
        <AnimeGrid
          anime={paginatedAnime}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          resultCount={initialAnimes.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onMobileFilterToggle={() => setMobileFiltersOpen(true)}
          userStatuses={userStatuses}
          onStatusChange={async (animeId, newStatus) => {
            if (!user) return
            if (!newStatus) return

            setUserStatuses((prev) => ({ ...prev, [String(animeId)]: newStatus }))
            setCollectionStatus(user.id, String(animeId), newStatus as WatchlistStatus)
            await addToMyCollection({ animeId: String(animeId), status: newStatus as WatchlistStatus })
          }}
        />
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onReset={handleResetFilters}
        genreOptions={meta.genres}
        themeOptions={meta.themes}
        producerOptions={meta.producers}
        statusOptions={meta.statuses}
        studioOptions={meta.studios}
        sourceOptions={meta.sources}
        ratingOptions={meta.ratings.map((r) => r.name)}
        typeOptions={meta.kinds}
        onFiltersChange={handleFiltersChange}
        onYearsChange={handleYearsChange}
        onMinRatingChange={handleMinRatingChange}
      />
    </>
  )
}
