"use client";

import { Clock, Play, Zap } from "lucide-react";
import { getNextRelease } from "@/lib/schedule-data";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";

export function NextRelease() {
  const { locale, t } = useLanguage()
  const nextRelease = getNextRelease();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background-secondary to-background border border-border p-6 shadow-sm">
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
      
      {/* Header */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{locale === "ru" ? "Следующий релиз" : "Next to Release"}</h2>
      </div>

      {/* Content */}
      <div className="relative flex gap-4">
        {/* Poster */}
        <div className="relative w-24 h-36 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-primary/15">
          <div className="absolute inset-0 bg-gradient-to-br from-background-tertiary to-background" />
          <Image
            src={nextRelease.posterUrl}
            alt={nextRelease.title}
            fill
            className="object-cover"
            sizes="96px"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Inner shadow */}
          <div className="absolute inset-0 shadow-[inset_0_1px_10px_rgba(0,0,0,0.22)]" />
          
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="font-bold text-foreground text-lg leading-snug mb-1">
              {nextRelease.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-md">
                {t.common.epShort}. {nextRelease.episode}
              </span>
              <span className="text-foreground-subtle text-xs">{nextRelease.day}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold text-lg tracking-wide">
                {nextRelease.countdown}
              </span>
            </div>
            <span className="text-foreground-subtle text-sm">{locale === "ru" ? "до релиза" : "until release"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
