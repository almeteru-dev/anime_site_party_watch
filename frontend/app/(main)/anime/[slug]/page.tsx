import { AnimeDetailsClient } from "@/components/anime/anime-details-client"
import { getAnimeBySlug, getAnimes } from "@/lib/api"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AnimeTitlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const details = await getAnimeBySlug(slug).catch(() => null)
  if (!details || !details.anime || typeof (details.anime as any).id !== "number") redirect("/")

  const anime = details.anime
  await getAnimes()

  const galleryImages = (anime.gallery_images || [])
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((g) => ({ src: g.url, alt: anime.name }))

  return <AnimeDetailsClient anime={anime} episodes={details.episodes} galleryImages={galleryImages} />
}
