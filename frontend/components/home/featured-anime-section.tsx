"use client"

import { ContentSection } from "@/components/content-section"
import { AnimeCard } from "@/components/anime-card"
import { getAnimePosterUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

type FeaturedAnimeSectionProps = {
  animes: any[]
}

export function FeaturedAnimeSection({ animes }: FeaturedAnimeSectionProps) {
  const { t } = useLanguage()

  return (
    <ContentSection title={t.home.featuredAnime}>
      {animes.map((anime) => (
        <AnimeCard
          key={anime.id}
          variant="top-rated"
          id={anime.id.toString()}
          title={anime.name}
          image={
            getAnimePosterUrl(anime) ||
            `https://placehold.co/300x450/081229/00E5FF?text=${encodeURIComponent(anime.name)}`
          }
          rating={anime.score}
          genres={anime.genres?.map((g: any) => g.name) || []}
          data={anime}
        />
      ))}
    </ContentSection>
  )
}

