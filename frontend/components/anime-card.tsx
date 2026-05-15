"use client"

import { useState, useCallback } from "react"
import { Star, Play, Check, XCircle, Clock } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AnimeStatusManager, type AnimeStatus } from "@/components/anime-status-manager"
import { useLanguage } from "@/contexts/language-context"
import { type Anime as BackendAnime, getLocalizedTitle } from "@/lib/api"

// Status color configuration for visual indicators
const statusColors = {
  watched: {
    border: "ring-2 ring-emerald-500/60",
    badge: "bg-emerald-500",
    icon: Check,
  },
  planned: {
    border: "ring-2 ring-amber-500/60",
    badge: "bg-amber-500",
    icon: Clock,
  },
  dropped: {
    border: "ring-2 ring-red-500/60",
    badge: "bg-red-500",
    icon: XCircle,
  },
  inProgress: {
    border: "ring-2 ring-primary/60",
    badge: "bg-primary",
    icon: Play,
  },
}

/**
 * Placeholder function for backend integration
 * Connect to Go backend: PATCH /api/user/anime/{animeId}/status
 */
export async function handleStatusChange(animeId: string, status: AnimeStatus): Promise<void> {
  console.log(`[API Placeholder] Changing status for anime ${animeId} to: ${status}`)
  await new Promise(resolve => setTimeout(resolve, 500))
}

interface BaseAnimeCardProps {
  id: string
  title: string
  image: string
  rating?: number
  userStatus?: AnimeStatus
  onStatusChange?: (animeId: string, newStatus: AnimeStatus) => Promise<void>
  data?: BackendAnime
}

interface LatestEpisodeCardProps extends BaseAnimeCardProps {
  variant: "latest"
  episode: string
  totalEpisodes: number
  updatedTime: string
}

interface TrendingCardProps extends BaseAnimeCardProps {
  variant: "trending"
  rank: number
  views: string
}

interface TopRatedCardProps extends BaseAnimeCardProps {
  variant: "top-rated"
  genres: string[]
}

interface FeaturedCardProps extends BaseAnimeCardProps {
  variant: "featured"
  status: string
}

type AnimeCardProps =
  | LatestEpisodeCardProps
  | TrendingCardProps
  | TopRatedCardProps
  | FeaturedCardProps

export function AnimeCard(props: AnimeCardProps) {
  const { title: propTitle, image, rating, variant, userStatus, onStatusChange, data } = props
  const { locale, t } = useLanguage()
  const [localStatus, setLocalStatus] = useState<AnimeStatus>(userStatus ?? null)
  
  const title = data ? getLocalizedTitle(data, locale) : propTitle

  const href = (() => {
    const slug = data?.url
    if (slug) return `/anime/${slug}`
    if (typeof props.id === "string" && /\D/.test(props.id)) return `/anime/${props.id}`
    return "/catalog"
  })()

  const currentStatusStyle = localStatus ? statusColors[localStatus as keyof typeof statusColors] : null
  const StatusIcon = currentStatusStyle?.icon

  const handleLocalStatusChange = useCallback(async (animeId: string, newStatus: AnimeStatus) => {
    setLocalStatus(newStatus)
    if (onStatusChange) {
      await onStatusChange(animeId, newStatus)
    } else {
      await handleStatusChange(animeId, newStatus)
    }
  }, [onStatusChange])

  if (variant === "latest") {
    const { id, episode, totalEpisodes, updatedTime } = props as LatestEpisodeCardProps
    return (
      <div className="group relative w-[180px] sm:w-[200px] flex-shrink-0">
        <Link href={href} className="cursor-pointer block">
          <div className={cn(
            "relative aspect-[3/4] rounded-xl overflow-hidden shadow-[var(--card-shadow)] transition-all duration-300 group-hover:shadow-[var(--glow-primary)] group-hover:scale-[1.02]",
            localStatus && currentStatusStyle?.border
          )}>
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            
            {/* Episode Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold rounded-md">
              {t.common.epShort}. {episode} / {totalEpisodes}
            </div>

            {/* User Status Badge */}
            {localStatus && StatusIcon && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg backdrop-blur-sm px-2 py-1 bg-background/80">
                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", currentStatusStyle?.badge)}>
                  <StatusIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm animate-glow-pulse">
                <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
              </div>
            </div>
          </div>
        </Link>
        
        {/* Info */}
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors flex-1">
              {title}
            </h3>
            {/* Status Manager Button */}
            <div onClick={(e) => e.stopPropagation()} className="ml-2 flex-shrink-0">
              <AnimeStatusManager
                animeId={id}
                currentStatus={localStatus}
                onStatusChange={handleLocalStatusChange}
                variant="icon"
                className="opacity-70 hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "trending") {
    const { id } = props as TrendingCardProps
    return (
      <div className="group relative w-[180px] sm:w-[200px] flex-shrink-0">
        <Link href={href} className="cursor-pointer block">
          <div className={cn(
            "relative aspect-[3/4] rounded-xl overflow-hidden shadow-[var(--card-shadow)] transition-all duration-300 group-hover:shadow-[var(--glow-primary)] group-hover:scale-[1.02]",
            localStatus && currentStatusStyle?.border
          )}>
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />

            {/* User Status Badge */}
            {localStatus && StatusIcon && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg backdrop-blur-sm px-2 py-1 bg-background/80">
                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", currentStatusStyle?.badge)}>
                  <StatusIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
              </div>
            </div>
          </div>
        </Link>
        
        {/* Info */}
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors flex-1">
              {title}
            </h3>
            {/* Status Manager Button */}
            <div onClick={(e) => e.stopPropagation()} className="ml-2 flex-shrink-0">
              <AnimeStatusManager
                animeId={id}
                currentStatus={localStatus}
                onStatusChange={handleLocalStatusChange}
                variant="icon"
                className="opacity-70 hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "top-rated") {
    const { id, genres } = props as TopRatedCardProps
    return (
      <div className="group relative w-[180px] sm:w-[200px] flex-shrink-0">
        <Link href={href} className="cursor-pointer block">
          <div className={cn(
            "relative aspect-[3/4] rounded-xl overflow-hidden shadow-[var(--card-shadow)] transition-all duration-300 group-hover:shadow-[var(--glow-primary)] group-hover:scale-[1.02]",
            localStatus && currentStatusStyle?.border
          )}>
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            
            {/* Rating Badge */}
            {rating && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-background/70 backdrop-blur-sm rounded-md">
                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                <span className="text-xs font-semibold text-primary">{rating}</span>
              </div>
            )}

            {/* User Status Badge */}
            {localStatus && StatusIcon && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg backdrop-blur-sm px-2 py-1 bg-background/80">
                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", currentStatusStyle?.badge)}>
                  <StatusIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
              </div>
            </div>
          </div>
        </Link>
        
        {/* Info */}
        <div className="mt-3 px-1">
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-wrap gap-1.5">
              {genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 text-[10px] font-medium bg-secondary/10 text-secondary border border-secondary/30 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
            {/* Status Manager Button */}
            <div onClick={(e) => e.stopPropagation()}>
              <AnimeStatusManager
                animeId={id}
                currentStatus={localStatus}
                onStatusChange={handleLocalStatusChange}
                variant="icon"
                className="opacity-70 hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "featured") {
    const { id, status } = props as FeaturedCardProps
    return (
      <Link href={href} className="group flex gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-[var(--card-shadow)]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h4 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1.5">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-medium text-primary">{rating}</span>
              </div>
            )}
            <span className="text-xs text-foreground-muted">{status}</span>
          </div>
        </div>
      </Link>
    )
  }

  return null
}
