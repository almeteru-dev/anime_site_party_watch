"use client"

import { Info, Languages, Tv } from "lucide-react"
import { type Anime, getLocalizedDescription } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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

	const otherAltTitles = (() => {
		const base = [alternativeTitles.romaji, alternativeTitles.russian]
		const seen = new Set(base.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean))
		const out: string[] = []
		for (const it of anime.alt_titles || []) {
			const v = String((it as any)?.title || '').trim()
			if (!v) continue
			const key = v.toLowerCase()
			if (seen.has(key)) continue
			seen.add(key)
			out.push(v)
		}
		return out
	})()

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
		producers: (() => {
			const ps = Array.isArray(anime.producers) ? anime.producers : []
			if (ps.length) {
				const names = ps.map((p) => p.name).filter(Boolean)
				return names.length ? names.join(", ") : t.common.na
			}
			if (anime.producer) return anime.producer.name
			return t.common.na
		})(),
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

	const ratingDescription =
		locale === "ru"
			? (anime.rating_description_ru || "")
			: (anime.rating_description_en || "")

  const labels = {
    synopsis: locale === "ru" ? "Описание" : "Synopsis",
    genres: locale === "ru" ? "Жанры" : "Genres",
		themes: locale === "ru" ? "Темы" : "Themes",
    altTitles: locale === "ru" ? "Альтернативные названия" : "Alternative Titles",
    details: locale === "ru" ? "Детали" : "Details",
    type: locale === "ru" ? "Тип" : "Type",
    status: locale === "ru" ? "Статус" : "Status",
    studio: locale === "ru" ? "Студия" : "Studio",
		producers: locale === "ru" ? "Продюсеры" : "Producers",
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
						(() => {
							const label = locale === "ru" ? g.ru_name || g.name : g.name
							const desc = locale === "ru" ? g.description_ru || "" : g.description_en || ""
							const chip = <span className="meta-chip text-sm"><span className="truncate max-w-[180px]">{label}</span></span>
							if (!desc) return <span key={g.id}>{chip}</span>
							return (
								<Tooltip key={g.id}>
									<TooltipTrigger asChild>
										<span className="inline-flex">{chip}</span>
									</TooltipTrigger>
									<TooltipContent
										sideOffset={8}
										className="max-w-sm !bg-card !text-foreground border border-border shadow-lg px-4 py-3 text-sm leading-relaxed"
									>
										{desc}
									</TooltipContent>
								</Tooltip>
							)
						})()
					))}
				  </div>
				</div>
			  ) : null}

			  {(anime.themes || []).length > 0 ? (
				<div className="mt-4">
				  <div className="text-sm font-semibold text-foreground mb-2">{labels.themes}</div>
				  <div className="flex flex-wrap gap-2">
					{(anime.themes || []).map((th) => (
						(() => {
							const label = locale === "ru" ? th.ru_name || th.name : th.name
							const desc = locale === "ru" ? th.description_ru || "" : th.description_en || ""
							const chip = <span className="meta-chip text-sm"><span className="truncate max-w-[180px]">{label}</span></span>
							if (!desc) return <span key={th.id}>{chip}</span>
							return (
								<Tooltip key={th.id}>
									<TooltipTrigger asChild>
										<span className="inline-flex">{chip}</span>
									</TooltipTrigger>
									<TooltipContent
										sideOffset={8}
										className="max-w-sm !bg-card !text-foreground border border-border shadow-lg px-4 py-3 text-sm leading-relaxed"
									>
										{desc}
									</TooltipContent>
								</Tooltip>
							)
						})()
					))}
				  </div>
				</div>
			  ) : null}

			  {details.rating !== t.common.na ? (
				<div className="mt-4">
				  <div className="text-sm font-semibold text-foreground mb-2">{labels.rating}</div>
				  <div className="flex flex-wrap gap-2">
					{ratingDescription ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="meta-chip text-sm">
									<span className="truncate max-w-[180px]">{details.rating}</span>
								</span>
							</TooltipTrigger>
							<TooltipContent sideOffset={8} className="max-w-sm !bg-card !text-foreground border border-border shadow-lg px-4 py-3 text-sm leading-relaxed">
								{ratingDescription}
							</TooltipContent>
						</Tooltip>
					) : (
						<span className="meta-chip text-sm">
							<span className="truncate max-w-[180px]">{details.rating}</span>
						</span>
					)}
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
				{otherAltTitles.length > 0 ? (
					<div className="pt-2">
						<div className="text-xs font-semibold text-foreground-muted mb-2">{locale === "ru" ? "Другие:" : "Other:"}</div>
						<div className="flex flex-wrap gap-2">
							{otherAltTitles.map((name) => (
								<span
									key={name}
									className="inline-flex items-center rounded-lg border border-border bg-background-tertiary px-3 py-1.5 text-sm text-foreground-muted"
								>
									<span className="truncate max-w-[220px]">{name}</span>
								</span>
							))}
						</div>
					</div>
				) : null}
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
				{details.producers !== t.common.na ? <DetailRow label={labels.producers} value={details.producers} /> : null}
                {details.source !== t.common.na ? <DetailRow label={labels.source} value={details.source} /> : null}
                {details.airedOn !== t.common.na ? <DetailRow label={labels.airedOn} value={details.airedOn} /> : null}
                {details.releasedOn !== t.common.na ? <DetailRow label={labels.releasedOn} value={details.releasedOn} /> : null}
                {details.episodes !== t.common.na ? <DetailRow label={labels.episodes} value={details.episodes} /> : null}
                {details.duration !== t.common.na ? <DetailRow label={labels.duration} value={details.duration} /> : null}
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
    <div className="flex items-start gap-4 py-2 border-b border-border last:border-0">
      <span className="text-foreground-subtle font-medium shrink-0 min-w-[120px]">{label}</span>
      <span className="text-foreground-muted flex-1 text-right break-words">{value}</span>
    </div>
  )
}
