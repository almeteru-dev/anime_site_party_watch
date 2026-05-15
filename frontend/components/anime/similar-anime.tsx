"use client"

import { Sparkles, Star } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

interface SimilarAnimeItem {
  id: string
  title: string
  coverImage: string
  rating: number
  year: number
  episodes: number
  genres: string[]
}

interface SimilarAnimeSectionProps {
  animeList: SimilarAnimeItem[]
}

export function SimilarAnimeSection({ animeList }: SimilarAnimeSectionProps) {
  const { t } = useLanguage()

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t.anime.similarAnime}</h2>
        </div>

        {/* Anime Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {animeList.map((anime) => (
            <a
              key={anime.id}
              href={`/catalog`}
              className="group relative bg-card rounded-xl overflow-hidden border border-card-border shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300"
            >
              {/* Poster Image */}
              <div className="relative aspect-[2/3] overflow-hidden">
                <Image
                  src={anime.coverImage}
                  alt={anime.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                
                {/* Rating Badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-border/50">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="text-xs font-semibold text-foreground">{anime.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
                  {anime.title}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-foreground-subtle">
                  <span>{anime.year}</span>
                  <span className="text-foreground-subtle/60">•</span>
                  <span>
                    {anime.episodes} {t.common.epShort}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {anime.genres.slice(0, 2).map((genre) => (
                    <Badge 
                      key={genre}
                      variant="secondary"
                      className="bg-background-tertiary text-foreground-muted border border-border text-xs px-2 py-0.5"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-primary/20 rounded-xl" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
