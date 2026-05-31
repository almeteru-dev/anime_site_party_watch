'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Star, Play, Info, Check, Clock, XCircle, Film, PauseCircle, Repeat2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { addToMyCollection, getAnimePosterUrl, getLocalizedDescription, getLocalizedTitle, removeFromMyCollection, type Anime, type WatchlistStatus } from '@/lib/api'
import Link from 'next/link'
import { AnimeStatusManager, type AnimeStatus } from '@/components/anime-status-manager'
import { useLanguage } from '@/contexts/language-context'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

interface AnimeCardProps {
  anime: Anime
  userStatus?: AnimeStatus
  onStatusChange?: (animeId: string, newStatus: AnimeStatus) => Promise<void>
  showRemoveOption?: boolean
  onRemove?: (animeId: string) => Promise<void>
}

// Status color configuration for visual indicators
const statusColors = {
  completed: {
    border: "ring-2 ring-emerald-500/60",
    badge: "bg-emerald-500",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    icon: Check,
  },
  rewatching: {
    border: "ring-2 ring-purple-500/60",
    badge: "bg-purple-500",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    icon: Repeat2,
  },
  planned: {
    border: "ring-2 ring-amber-500/60",
    badge: "bg-amber-500",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    icon: Clock,
  },
  on_hold: {
    border: "ring-2 ring-slate-400/50",
    badge: "bg-slate-500",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.25)]",
    icon: PauseCircle,
  },
  dropped: {
    border: "ring-2 ring-red-500/60",
    badge: "bg-red-500",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
    icon: XCircle,
  },
  watching: {
    border: "ring-2 ring-primary/60",
    badge: "bg-primary",
    glow: "shadow-[0_0_20px_rgba(0,229,255,0.3)]",
    icon: Play,
  },
}

export function AnimeCard({ 
  anime, 
  userStatus, 
  onStatusChange,
  showRemoveOption = false,
  onRemove,
}: AnimeCardProps) {
  const { locale, t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [localStatus, setLocalStatus] = useState<AnimeStatus>(userStatus ?? null)

  useEffect(() => {
    setLocalStatus(userStatus ?? null)
  }, [userStatus])

  const title = getLocalizedTitle(anime, locale)
  const posterUrl = getAnimePosterUrl(anime)
  const displayGenres = anime.genres?.slice(0, 2) || []
  const displayThemes = anime.themes?.slice(0, 1) || []

  const statusLabel = anime.status
    ? locale === "ru"
      ? anime.status.ru_name || (t.catalog.filters.statusValues as Record<string, string>)[anime.status.name] || anime.status.name
      : anime.status.name
    : null

  const kindLabel =
    locale === "ru"
      ? anime.kind_ru_name || (t.catalog.filters.typeValues as Record<string, string>)[anime.kind] || anime.kind
      : anime.kind
  
  // Get current status styling
  const currentStatusStyle = localStatus ? statusColors[localStatus as keyof typeof statusColors] : null
  const StatusIcon = currentStatusStyle?.icon

  // Handle status change with local state update
  const handleLocalStatusChange = useCallback(async (animeId: string, newStatus: AnimeStatus) => {
    // Update local state immediately for responsiveness
    setLocalStatus(newStatus)
    
    // Call the provided handler or the placeholder
    if (onStatusChange) {
      await onStatusChange(animeId, newStatus)
    } else {
      if (!user) {
        router.push('/login')
        return
      }

      if (!newStatus) return
      await addToMyCollection({ animeId, status: newStatus as WatchlistStatus })
    }
  }, [onStatusChange, router, user])

  const handleLocalRemove = useCallback(async (animeId: string) => {
    setLocalStatus(null)

    if (onRemove) {
      await onRemove(animeId)
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    await removeFromMyCollection({ animeId })
  }, [onRemove, router, user])

  return (
    <div
      className="group relative rounded-xl transition-all duration-300 block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container with Status Indicator */}
      <Link href={`/anime/${anime.url}`}>
        <div className={cn(
          "relative aspect-[2/3] rounded-xl overflow-hidden card-shadow transition-all duration-300",
          isHovered && "glow-cyan",
          // Visual indicator: colored ring when status is set
          localStatus && currentStatusStyle?.border,
          localStatus && currentStatusStyle?.glow
        )}>
          {/* Poster */}
          {posterUrl && !imageError ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background-secondary to-background">
              <div className="w-12 h-12 rounded-2xl bg-background/40 border border-border/50 flex items-center justify-center">
                <Film className="w-6 h-6 text-foreground-muted" />
              </div>
              <div className="mt-3 text-xs font-semibold text-foreground-muted">{t.common.noImage}</div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Rating Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg bg-background/80 backdrop-blur-sm px-2 py-1">
            <Star className="h-3.5 w-3.5 fill-accent-primary text-accent-primary" />
			<span className="text-xs font-semibold text-foreground">
				{typeof anime.rating_avg === "number" ? anime.rating_avg.toFixed(1) : anime.score.toFixed(1)}
				{typeof anime.rating_count === "number" && anime.rating_count > 0 ? (
					<span className="ml-1 text-[10px] text-foreground-muted">({anime.rating_count})</span>
				) : null}
			</span>
          </div>

          {/* User List Status Badge - Shows when status is set */}
          {localStatus && StatusIcon && (
            <div className={cn(
              "absolute top-3 right-3 flex items-center gap-1.5 rounded-lg backdrop-blur-sm px-2 py-1",
              "bg-background/80"
            )}>
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                currentStatusStyle?.badge
              )}>
                <StatusIcon className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          )}

          {/* Anime Status Badge (Ongoing/Completed) - Show only when no user status */}
          {!localStatus && anime.status && (
            <div className="absolute top-3 right-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold border-0 backdrop-blur-sm",
                  anime.status.name === 'ongoing'
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-accent-muted/20 text-accent-muted"
                )}
              >
                {statusLabel}
              </Badge>
            </div>
          )}

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Title */}
            <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-2 text-balance">
              {title}
            </h3>

            {/* Genre & Theme Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {displayGenres.map(genre => (
                <span
                  key={`genre-${genre.id}`}
                  className="rounded-md bg-background-secondary/80 px-2 py-0.5 text-[10px] font-medium text-foreground-muted backdrop-blur-sm"
                >
                  {locale === "ru" ? genre.ru_name || genre.name : genre.name}
                </span>
              ))}
              {displayThemes.map(theme => (
                <span
                  key={`theme-${theme.id}`}
                  className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary backdrop-blur-sm"
                >
                  {locale === "ru" ? theme.ru_name || theme.name : theme.name}
                </span>
              ))}
            </div>

            {/* Episodes & Info */}
            <div className="flex items-center gap-2 text-[11px] text-foreground-subtle">
              <span>
                {anime.episodes} {t.common.epShort}
              </span>
              <span className="w-1 h-1 rounded-full bg-foreground-subtle" />
              <span className="truncate max-w-[80px]">
				{kindLabel}
              </span>
              <span className="w-1 h-1 rounded-full bg-foreground-subtle" />
              <span>{anime.aired_on ? new Date(anime.aired_on).getFullYear() : t.common.na}</span>
            </div>
          </div>

          {/* Hover Overlay */}
          <div className={cn(
            "absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col justify-between p-4 transition-all duration-300",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            {/* Synopsis */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-2">
                {title}
              </h3>
              <p className="text-xs text-foreground-muted line-clamp-5 leading-relaxed">
                {getLocalizedDescription(anime, locale)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button className="flex items-center justify-center gap-2 w-full rounded-lg bg-accent-primary py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-accent-secondary">
                <Play className="h-4 w-4 fill-current" />
                {t.hero.watchNow}
              </button>
              <button className="flex items-center justify-center gap-2 w-full rounded-lg border border-accent-muted/50 bg-transparent py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-background-secondary hover:border-accent-primary">
                <Info className="h-4 w-4" />
                {t.hero.moreInfo}
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Status Manager Button - Always visible at bottom right */}
      <div 
        className="absolute bottom-[88px] right-2 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimeStatusManager
          animeId={String(anime.id)}
          currentStatus={localStatus}
          onStatusChange={handleLocalStatusChange}
          onRemove={handleLocalRemove}
          showDelete={showRemoveOption}
          isReleased={(anime.status?.name || "").toLowerCase() === "released"}
          variant="icon"
          className="opacity-80 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  )
}
