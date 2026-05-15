"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, Play } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import { AnimeStatusManager, type AnimeStatus } from "./anime-status-manager"

interface UserCollectionCardProps {
  animeId: string
  slug: string
  title: string
  image: string
  rating: number
  episodes: number
  currentEpisode?: number
  status: AnimeStatus
  showDelete?: boolean
  onStatusChange: (animeId: string, newStatus: AnimeStatus) => Promise<void>
  onRemove?: (animeId: string) => Promise<void>
}

export function UserCollectionCard({
  animeId,
  slug,
  title,
  image,
  rating,
  episodes,
  currentEpisode,
  status,
  showDelete = false,
  onStatusChange,
  onRemove,
}: UserCollectionCardProps) {
  const { t } = useLanguage()
  const [isRemoving, setIsRemoving] = useState(false)
  const [imageError, setImageError] = useState(false)

  const statusColors = {
    completed: "bg-emerald-500",
    planned: "bg-amber-500",
    dropped: "bg-red-500",
    on_hold: "bg-slate-500",
    watching: "bg-primary",
  }

  const progress = currentEpisode ? (currentEpisode / episodes) * 100 : 0

  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-500",
        isRemoving && "opacity-0 scale-95 pointer-events-none"
      )}
    >
      {/* Card Container */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-[var(--card-shadow)] transition-all duration-300 group-hover:shadow-[var(--glow-primary)] group-hover:scale-[1.02]">
        {/* Poster Image */}
        <Image
          src={imageError ? `https://placehold.co/300x400/081229/00E5FF?text=${encodeURIComponent(title)}` : image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImageError(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />

        {/* Status Badge */}
        {status && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              statusColors[status]
            )} />
            <span className="text-[10px] font-semibold text-foreground bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
              {status === "on_hold" ? t.status.onHold : t.status[status]}
            </span>
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-background/70 backdrop-blur-sm rounded-md">
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="text-xs font-semibold text-primary">{rating.toFixed(1)}</span>
        </div>

        {/* Progress Bar for In Progress */}
        {status === "watching" && currentEpisode && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-background/80 backdrop-blur-sm rounded-md px-2 py-1.5">
              <div className="flex justify-between text-xs text-foreground-muted mb-1">
                <span>
                  {t.common.epShort}. {currentEpisode}
                </span>
                <span>/ {episodes}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Play Overlay */}
        <Link
          href={`/anime/${slug}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm shadow-[0_0_25px_rgba(0,229,255,0.5)]">
            <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
          </div>
        </Link>
      </div>

      {/* Info Section */}
      <div className="mt-3 px-0.5">
        <Link href={`/anime/${slug}`}>
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-xs text-foreground-muted mt-1">
          {episodes} {t.hero.episodes}
        </p>

        {/* Status Manager - Compact variant */}
        <div className="mt-2">
          <AnimeStatusManager
            animeId={animeId}
            currentStatus={status}
            onStatusChange={onStatusChange}
            onRemove={onRemove}
            showDelete={showDelete}
            variant="compact"
          />
        </div>
      </div>
    </div>
  )
}
