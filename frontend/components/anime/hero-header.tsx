"use client"

import { Star, Play, Calendar, Film, Clock, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Anime, getAnimeBackgroundUrl, getLocalizedTitle } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

interface HeroHeaderProps {
  anime: Anime
  onStartWatching: () => void
}

export function HeroHeader({ anime, onStartWatching }: HeroHeaderProps) {
  const { locale, t } = useLanguage()
  const title = getLocalizedTitle(anime, locale)
  const bgUrl = getAnimeBackgroundUrl(anime)
	const producersText = (() => {
		const ps = Array.isArray(anime.producers) ? anime.producers : []
		if (ps.length) {
			const names = ps.map((p) => p.name).filter(Boolean)
			if (names.length <= 2) return names.join(", ")
			return `${names.slice(0, 2).join(", ")} +${names.length - 2}`
		}
		if (anime.producer) return anime.producer.name
		return ""
	})()

  const statusLabel = anime.status
    ? locale === "ru"
      ? anime.status.ru_name || (t.catalog.filters.statusValues as Record<string, string>)[anime.status.name] || anime.status.name
      : anime.status.name
    : null
  
  return (
    <section className="relative w-full min-h-[70vh] overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl || `https://placehold.co/1400x900/F1F5F9/00D2FF?text=${encodeURIComponent(title)}`})` }}
      >
        {/* Multi-layer gradient for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-background/25" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col justify-end min-h-[70vh]">
        <div className="max-w-3xl space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              {title}
            </h1>
          </div>

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-foreground-muted">
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-semibold text-foreground">
                {(typeof anime.rating_avg === "number" ? anime.rating_avg : anime.score).toFixed(1)}
              </span>
              {typeof anime.rating_count === "number" && anime.rating_count > 0 ? (
                <span className="text-xs text-foreground-muted">({anime.rating_count})</span>
              ) : null}
            </div>

            {/* Year */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-foreground-subtle" />
              <span>{anime.aired_on ? new Date(anime.aired_on).getFullYear() : t.common.na}</span>
            </div>

            {/* Episodes */}
            <div className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-foreground-subtle" />
              <span>
                {anime.episodes} {t.hero.episodes}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-foreground-subtle" />
              <span>
                {anime.duration} {t.common.minShort}
              </span>
            </div>

            {/* Producer / Studio */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-foreground-subtle" />
              <span>
				{producersText
					? producersText
					: anime.studio
						? locale === "ru"
							? anime.studio.ru_name || anime.studio.name
							: anime.studio.name
						: t.common.na}
              </span>
            </div>

            {/* Status Badge */}
            {anime.status && (
              <Badge 
                variant="outline" 
                className={`
                  border-primary/40 text-primary font-medium px-3 py-1
                  ${anime.status.name === "ongoing" ? "bg-primary/10" : ""}
                  ${anime.status.name === "released" ? "bg-secondary/10 border-secondary/40 text-secondary" : ""}
                `}
              >
                {statusLabel}
              </Badge>
            )}
          </div>

          {/* Genre & Theme Tags */}
          <div className="flex flex-wrap gap-2">
            {anime.genres?.map((genre) => (
              <Badge 
                key={`genre-${genre.id}`}
                variant="secondary"
                className="bg-background-secondary text-foreground-muted border border-border hover:bg-background-tertiary hover:border-primary/20 transition-all duration-300 px-3 py-1"
              >
                {locale === "ru" ? genre.ru_name || genre.name : genre.name}
              </Badge>
            ))}
            {anime.themes?.map((theme) => (
              <Badge 
                key={`theme-${theme.id}`}
                variant="outline"
                className="bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 px-3 py-1"
              >
                {locale === "ru" ? theme.ru_name || theme.name : theme.name}
              </Badge>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              size="lg"
              onClick={onStartWatching}
              className="font-bold text-lg px-8 py-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <Play className="w-5 h-5 mr-2 fill-current group-hover:scale-110 transition-transform" />
              {t.anime.startWatching}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
