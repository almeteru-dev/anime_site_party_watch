"use client"

import { Sparkles } from "lucide-react"
import { AnimeCard } from "./anime-card"
import { type Anime, getAnimePosterUrl, getLocalizedTitle } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

interface FeaturedSidebarProps {
  animes: Anime[]
}

export function FeaturedSidebar({ animes }: FeaturedSidebarProps) {
  const { locale } = useLanguage()
  const featuredAnime = animes.slice(-5)

  return (
    <aside className="w-full lg:w-80 bg-background-secondary/50 rounded-2xl p-5 border border-border">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{locale === "ru" ? "Рекомендуемое" : "Featured"}</h3>
          <p className="text-xs text-foreground-muted">{locale === "ru" ? "Подборка" : "Picks"}</p>
        </div>
      </div>

      <div className="space-y-2">
        {featuredAnime.map((anime) => (
          <AnimeCard
            key={anime.id}
            variant="featured"
            id={anime.id.toString()}
            title={getLocalizedTitle(anime, locale)}
            image={
              getAnimePosterUrl(anime) ||
              `https://placehold.co/300x450/081229/00E5FF?text=${encodeURIComponent(getLocalizedTitle(anime, locale))}`
            }
            rating={anime.score}
            status={anime.status?.name || ""}
            data={anime}
          />
        ))}
      </div>

      <button className="w-full mt-4 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
        {locale === "ru" ? "Смотреть все" : "View all"}
      </button>
    </aside>
  )
}

