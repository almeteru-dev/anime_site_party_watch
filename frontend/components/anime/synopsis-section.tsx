"use client"

import { Info, Languages, Tv } from "lucide-react"
import { type Anime, getLocalizedDescription } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

interface SynopsisSectionProps {
  anime: Anime
}

export function SynopsisSection({ anime }: SynopsisSectionProps) {
  const { locale, t } = useLanguage()

  const dateLocale = locale === "ru" ? "ru-RU" : "en-US"
  
  const alternativeTitles = {
    romaji: anime.translations?.find(t => t.language.code === "en")?.title,
    russian: anime.translations?.find(t => t.language.code === "ru")?.title,
  }

  const details = {
    type: anime.kind
      ? locale === "ru"
        ? anime.kind_ru_name || (t.catalog.filters.typeValues as Record<string, string>)[anime.kind] || anime.kind
        : anime.kind
      : t.common.na,
    status: anime.status
      ? locale === "ru"
        ? anime.status.ru_name || (t.catalog.filters.statusValues as Record<string, string>)[anime.status.name] || anime.status.name
        : anime.status.name
      : t.common.na,
    studio: anime.studio
      ? locale === "ru"
        ? anime.studio.ru_name || anime.studio.name
        : anime.studio.name
      : t.common.na,
    source: anime.source
      ? locale === "ru"
        ? anime.source.ru_name || anime.source.name
        : anime.source.name
      : t.common.na,
    airedOn: anime.aired_on ? new Date(anime.aired_on).toLocaleDateString(dateLocale) : t.common.na,
    releasedOn: anime.released_on ? new Date(anime.released_on).toLocaleDateString(dateLocale) : t.common.na,
    episodes:
      anime.episodes > 0
        ? locale === "ru"
          ? `${anime.episodes_aired ?? 0} из ${anime.episodes}`
          : `${anime.episodes_aired ?? 0} of ${anime.episodes}`
        : t.common.na,
    duration: `${anime.duration} ${t.common.minShort} ${t.common.perEp}`,
    rating: anime.rating || t.common.na,
  }

  const labels = {
    synopsis: locale === "ru" ? "Описание" : "Synopsis",
    genres: locale === "ru" ? "Жанры" : "Genres",
    altTitles: locale === "ru" ? "Альтернативные названия" : "Alternative Titles",
    details: locale === "ru" ? "Детали" : "Details",
    type: locale === "ru" ? "Тип" : "Type",
    status: locale === "ru" ? "Статус" : "Status",
    studio: locale === "ru" ? "Студия" : "Studio",
    source: locale === "ru" ? "Источник" : "Source",
    releasedOn: locale === "ru" ? "Дата релиза" : "Released on",
    airedOn: locale === "ru" ? "Дата старта" : "Aired on",
    episodes: locale === "ru" ? "Вышло серий" : "Aired",
    duration: locale === "ru" ? "Длительность" : "Duration",
    rating: locale === "ru" ? "Рейтинг" : "Rating",
    romaji: locale === "ru" ? "Ромадзи" : "Romaji",
    russian: locale === "ru" ? "Русский" : "Russian",
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Synopsis */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{labels.synopsis}</h2>
            </div>
            <div className="bg-card rounded-xl p-6 border border-card-border shadow-sm">
              <p className="text-foreground-muted leading-relaxed text-base">
                {getLocalizedDescription(anime, locale)}
              </p>

			  {(anime.genres || []).length > 0 ? (
				<div className="mt-5">
				  <div className="text-sm font-semibold text-foreground mb-2">{labels.genres}</div>
				  <div className="flex flex-wrap gap-2">
					{(anime.genres || []).map((g) => (
					  <span
						key={g.id}
						className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 py-1.5 text-sm text-foreground-muted"
					  >
						<span className="truncate max-w-[180px]">{locale === "ru" ? g.ru_name || g.name : g.name}</span>
					  </span>
					))}
				  </div>
				</div>
			  ) : null}
            </div>

            {/* Alternative Titles */}
            <div className="bg-card rounded-xl p-6 border border-card-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Languages className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{labels.altTitles}</h3>
              </div>
              <div className="space-y-2">
                {alternativeTitles.romaji && (
                  <div className="flex gap-2">
                    <span className="text-foreground-subtle font-medium min-w-[80px]">{labels.romaji}:</span>
                    <span className="text-foreground-muted">{alternativeTitles.romaji}</span>
                  </div>
                )}
                {alternativeTitles.russian && (
                  <div className="flex gap-2">
                    <span className="text-foreground-subtle font-medium min-w-[80px]">{labels.russian}:</span>
                    <span className="text-foreground-muted">{alternativeTitles.russian}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Production Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Tv className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{labels.details}</h2>
            </div>
            <div className="bg-card rounded-xl p-6 border border-card-border shadow-sm">
              <div className="space-y-4">
                {details.type !== t.common.na ? <DetailRow label={labels.type} value={details.type} /> : null}
                {details.status !== t.common.na ? <DetailRow label={labels.status} value={details.status} /> : null}
                {details.studio !== t.common.na ? <DetailRow label={labels.studio} value={details.studio} /> : null}
                {details.source !== t.common.na ? <DetailRow label={labels.source} value={details.source} /> : null}
                {details.airedOn !== t.common.na ? <DetailRow label={labels.airedOn} value={details.airedOn} /> : null}
                {details.releasedOn !== t.common.na ? <DetailRow label={labels.releasedOn} value={details.releasedOn} /> : null}
                {details.episodes !== t.common.na ? <DetailRow label={labels.episodes} value={details.episodes} /> : null}
                {details.duration !== t.common.na ? <DetailRow label={labels.duration} value={details.duration} /> : null}
                {details.rating !== t.common.na ? <DetailRow label={labels.rating} value={details.rating} /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-foreground-subtle font-medium">{label}</span>
      <span className="text-foreground-muted">{value}</span>
    </div>
  )
}
