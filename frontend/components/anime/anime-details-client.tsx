"use client"

import { useState } from "react"
import { HeroHeader } from "@/components/anime/hero-header"
import { SynopsisSection } from "@/components/anime/synopsis-section"
import { AnimeStreamPlayer } from "@/components/anime/anime-stream-player"
import { GallerySection } from "@/components/anime/gallery-section"
import type { Anime, AnimeDetailsResponse } from "@/lib/api"

export function AnimeDetailsClient({
  anime,
  episodes,
  galleryImages,
}: {
  anime: Anime
  episodes: AnimeDetailsResponse["episodes"]
  galleryImages: { src: string; alt: string }[]
}) {
  const [startWatchingNonce, setStartWatchingNonce] = useState(0)

  return (
    <div className="pt-16">
      <HeroHeader anime={anime} onStartWatching={() => setStartWatchingNonce((n) => n + 1)} />
      <SynopsisSection anime={anime} />
      <AnimeStreamPlayer anime={anime} episodesByServer={episodes} startWatchingNonce={startWatchingNonce} />
	  {galleryImages.length > 0 ? <GallerySection images={galleryImages} /> : null}
    </div>
  )
}
