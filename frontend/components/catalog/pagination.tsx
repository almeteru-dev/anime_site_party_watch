'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showPages = 5
    
    if (totalPages <= showPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    // Calculate start and end of visible pages
    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)

    // Adjust if at the beginning
    if (currentPage <= 2) {
      end = Math.min(4, totalPages - 1)
    }

    // Adjust if at the end
    if (currentPage >= totalPages - 1) {
      start = Math.max(2, totalPages - 3)
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('ellipsis')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push('ellipsis')
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
      {/* First Page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={cn(
          "flex items-center justify-center rounded-lg p-2 text-sm transition-all",
          currentPage === 1
            ? "text-foreground-subtle/50 cursor-not-allowed"
            : "text-foreground-subtle hover:bg-background-secondary hover:text-foreground"
        )}
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      {/* Previous Page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "flex items-center justify-center rounded-lg p-2 text-sm transition-all",
          currentPage === 1
            ? "text-foreground-subtle/50 cursor-not-allowed"
            : "text-foreground-subtle hover:bg-background-secondary hover:text-foreground"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 mx-2">
        {pageNumbers.map((page, index) => 
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex items-center justify-center w-10 h-10 text-foreground-subtle"
            >
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200",
                currentPage === page
                  ? "bg-accent-primary text-primary-foreground glow-cyan-sm"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              )}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next Page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "flex items-center justify-center rounded-lg p-2 text-sm transition-all",
          currentPage === totalPages
            ? "text-foreground-subtle/50 cursor-not-allowed"
            : "text-foreground-subtle hover:bg-background-secondary hover:text-foreground"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Last Page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={cn(
          "flex items-center justify-center rounded-lg p-2 text-sm transition-all",
          currentPage === totalPages
            ? "text-foreground-subtle/50 cursor-not-allowed"
            : "text-foreground-subtle hover:bg-background-secondary hover:text-foreground"
        )}
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
