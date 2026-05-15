"use client";

import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

type ScheduleCardItem = {
  time: string
  title: string
  episode: number
  posterUrl: string
  slug: string
}

interface AnimeCardProps {
  anime: ScheduleCardItem;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const { t } = useLanguage()

  return (
    <div className="group relative flex items-center gap-4 p-4 bg-background-secondary border border-border rounded-xl transition-all duration-300 hover:border-primary/25 hover:shadow-sm hover:bg-background-tertiary">
      {/* Time */}
      <div className="flex flex-col items-center justify-center min-w-[72px] py-2 px-3 bg-background border border-border rounded-lg">
        <Clock className="w-3.5 h-3.5 text-primary mb-1" />
        <span className="text-primary font-bold text-sm tracking-wide">
          {anime.time}
        </span>
      </div>

      {/* Poster */}
      <Link href={`/anime/${encodeURIComponent(anime.slug)}`} className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-border group-hover:ring-primary/25 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-background-tertiary to-background" />
        <Image
          src={anime.posterUrl}
          alt={anime.title}
          fill
          className="object-cover"
          sizes="56px"
          onError={(e) => {
            // Fallback handled by the gradient background
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 shadow-[inset_0_1px_6px_rgba(0,0,0,0.18)]" />
      </Link>

      {/* Info */}
      <Link href={`/anime/${encodeURIComponent(anime.slug)}`} className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground text-base leading-snug truncate group-hover:text-primary transition-colors duration-200">
          {anime.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-md">
            {t.common.epShort}. {anime.episode}
          </span>
          <span className="text-foreground-subtle text-xs">{t.common.newEpisode}</span>
        </div>
      </Link>
    </div>
  );
}
