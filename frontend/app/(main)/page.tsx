import { HeroCarousel } from "@/components/hero-carousel"
import { FeaturedAnimeSection } from "@/components/home/featured-anime-section"
import { getAnimes, getFeaturedAnimes, getMALTopAnimeCatalog } from "@/lib/api"

export const dynamic = "force-dynamic"

export default async function Home() {
	const [ongoing, top, fallbackAll, featured] = await Promise.all([
		getAnimes({ statuses: ["ongoing"], sort_by: "score", sort_dir: "desc" }).catch(() => []),
		getMALTopAnimeCatalog().catch(() => []),
		getAnimes().catch(() => []),
		getFeaturedAnimes().catch(() => []),
	])

	const heroAnimes = ongoing.length > 0 ? ongoing : top.length > 0 ? top : fallbackAll

  return (
    <div className="pt-20 lg:pt-0">
			<HeroCarousel animes={heroAnimes} />
      
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
