"use client";

import { AnimeCard } from "./anime-card";
import { CalendarOff } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type ScheduleCardItem = {
  time: string
  title: string
  episode: number
  posterUrl: string
  slug: string
}

interface ReleaseListProps {
  releases: ScheduleCardItem[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  const { t } = useLanguage()

  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-background-secondary border border-border flex items-center justify-center mb-4 shadow-sm">
          <CalendarOff className="w-8 h-8 text-foreground-subtle" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t.schedule.noReleasesTitle}
        </h3>
        <p className="text-foreground-subtle text-sm max-w-xs">
          {t.schedule.noReleasesSubtitle}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {releases.map((anime) => (
        <AnimeCard
          key={`${anime.slug}-${anime.episode}-${anime.time}`}
          anime={anime}
        />
      ))}
    </div>
  );
}
