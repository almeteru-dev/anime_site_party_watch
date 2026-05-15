'use client'

import { AnimeCard } from './anime-card'
import { SearchBar } from './search-bar'
import { Pagination } from './pagination'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Film } from 'lucide-react'
import type { Anime } from '@/lib/api'
import type { AnimeStatus } from '@/components/anime-status-manager'

interface AnimeGridProps {
  anime: Anime[]
  searchQuery: string
  onSearchChange: (query: string) => void
  resultCount: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onMobileFilterToggle?: () => void
  // Optional: pass user's anime statuses from a parent component/context
  userStatuses?: Record<string, AnimeStatus>
  onStatusChange?: (animeId: string, newStatus: AnimeStatus) => Promise<void>
}

export function AnimeGrid({
  anime,
  searchQuery,
  onSearchChange,
  resultCount,
  currentPage,
  totalPages,
  onPageChange,
  onMobileFilterToggle,
  userStatuses,
  onStatusChange,
}: AnimeGridProps) {
  return (
    <div className="flex-1 min-w-0">
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        resultCount={resultCount}
        onMobileFilterToggle={onMobileFilterToggle}
      />

      {/* Grid or Empty State */}
      {anime.length === 0 ? (
        <Empty className="py-20 border-border/50">
          <EmptyHeader>
            <EmptyMedia>
              <Film className="h-12 w-12 text-foreground-subtle" />
            </EmptyMedia>
            <EmptyTitle className="text-foreground">No anime found</EmptyTitle>
            <EmptyDescription className="text-foreground-muted">
              Try adjusting your filters or search query to find what you&apos;re looking for.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {/* Anime Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {anime.map((item) => (
              <AnimeCard 
                key={item.id} 
                anime={item}
                userStatus={userStatuses?.[item.id]}
                onStatusChange={onStatusChange}
                showRemoveOption={false} // In catalog, don't show remove option
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}
