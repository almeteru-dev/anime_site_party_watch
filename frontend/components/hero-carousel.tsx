"use client"

import { useState, useCallback, useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Play, Info, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { type Anime, getAnimeBackgroundUrl, getLocalizedTitle, getLocalizedDescription } from "@/lib/api"

interface HeroCarouselProps {
  animes: Anime[]
}

export function HeroCarousel({ animes }: HeroCarouselProps) {
  const { t, locale } = useLanguage()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Use the first 3-5 animes as featured
  const featuredAnime = animes.slice(0, 5)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[85vh] min-h-[500px] sm:min-h-[600px] overflow-hidden">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {featuredAnime.map((anime, index) => (
            <div
              key={anime.id}
              className="flex-none w-full h-full relative"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={getAnimeBackgroundUrl(anime) || `https://placehold.co/1400x900/081229/00E5FF?text=${encodeURIComponent(getLocalizedTitle(anime, locale))}`}
                  alt={getLocalizedTitle(anime, locale)}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                {/* Radial gradient for depth */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_transparent_40%,_var(--background)_100%)]" />
              </div>

              {/* Content */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-2xl pt-16 sm:pt-20">
                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {anime.genres?.slice(0, 3).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium bg-primary/10 text-primary border border-primary/30 rounded-full"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight text-balance">
                    {getLocalizedTitle(anime, locale)}
                  </h1>

                  {/* Rating & Episodes */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary" />
                      <span className="text-sm sm:text-lg font-semibold text-primary">
                        {anime.score}
                      </span>
                    </div>
                    <span className="text-foreground-muted">•</span>
                    <span className="text-foreground-muted text-xs sm:text-base">
                      {anime.episodes} {t.hero.episodes}
                    </span>
                  </div>

                  {/* Synopsis */}
                  <p className="text-foreground-muted text-xs sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8 max-w-xl line-clamp-2 sm:line-clamp-3">
                    {getLocalizedDescription(anime, locale)}
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <Link 
                      href={`/anime/${anime.url}`}
                      className="group flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-primary text-primary-foreground text-sm sm:text-base font-semibold rounded-lg hover:shadow-[var(--glow-primary)] transition-all duration-300"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      {t.hero.watchNow}
                    </Link>
                    <Link 
                      href={`/anime/${anime.url}`}
                      className="flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-transparent border border-secondary/50 text-foreground text-sm sm:text-base font-semibold rounded-lg hover:bg-secondary/10 hover:border-secondary transition-all duration-300"
                    >
                      <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                      {t.hero.moreInfo}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 items-center justify-center rounded-full bg-background/50 backdrop-blur-sm border border-border hover:bg-primary/20 hover:border-primary transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-foreground group-hover:text-primary transition-colors" />
      </button>
      <button
        onClick={scrollNext}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 items-center justify-center rounded-full bg-background/50 backdrop-blur-sm border border-border hover:bg-primary/20 hover:border-primary transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-foreground group-hover:text-primary transition-colors" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {featuredAnime.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              selectedIndex === index
                ? "w-8 bg-primary"
                : "w-2 bg-foreground-muted/50 hover:bg-foreground-muted"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
