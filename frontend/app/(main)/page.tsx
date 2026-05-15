import { HeroCarousel } from "@/components/hero-carousel"
import { FeaturedAnimeSection } from "@/components/home/featured-anime-section"
import { getAnimes, getFeaturedAnimes } from "@/lib/api"

export const dynamic = "force-dynamic"

export default async function Home() {
  const [animes, featured] = await Promise.all([getAnimes(), getFeaturedAnimes()])

  return (
    <div className="pt-20 lg:pt-0">
      <HeroCarousel animes={animes} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 gap-10">
          <div className="space-y-16">
            {featured.length > 0 ? <FeaturedAnimeSection animes={featured} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
