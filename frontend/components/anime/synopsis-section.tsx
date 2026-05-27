"use client"

import Link from "next/link"
import { Info, Languages, Tv } from "lucide-react"
import { useMemo, useState } from "react"
import { type Anime, getLocalizedDescription, getLocalizedTitle } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SynopsisSectionProps {
  anime: Anime
}

export function SynopsisSection({ anime }: SynopsisSectionProps) {
  const { locale, t } = useLanguage()
	const dateLocale = locale === "ru" ? "ru-RU" : "en-US"

	const [showAllNames, setShowAllNames] = useState(false)
  
  const alternativeTitles = {
		romaji: anime.name,
		english: anime.translations?.find((t) => t.language.code === "en")?.title,
		russian: anime.translations?.find((t) => t.language.code === "ru")?.title,
  }

	const otherAltTitles = (() => {
		const base = [alternativeTitles.romaji, alternativeTitles.english, alternativeTitles.russian]
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
		rating: anime.rating ? anime.rating.toUpperCase() : t.common.na,
  }

	const ratingDescription =
		locale === "ru"
			? (anime.rating_description_ru || "")
			: (anime.rating_description_en || "")

	const buildCollectionHref = (p: { kind: "genre" | "theme" | "rating"; value: string }) => {
		const sp = new URLSearchParams()
		sp.set("kind", p.kind)
		sp.set("value", p.value)
		if (p.kind === "genre") sp.set("genres", p.value)
		if (p.kind === "theme") sp.set("themes", p.value)
		if (p.kind === "rating") sp.set("ratings", p.value)
		return `/collection?${sp.toString()}`
	}

  const labels = {
    synopsis: locale === "ru" ? "Описание" : "Synopsis",
    genres: locale === "ru" ? "Жанры" : "Genres",
		themes: locale === "ru" ? "Темы" : "Themes",
		altTitles: locale === "ru" ? "Названия" : "Titles",
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
		english: locale === "ru" ? "Английский" : "English",
    russian: locale === "ru" ? "Русский" : "Russian",
		seasons: locale === "ru" ? "Сезоны" : "Seasons",
  }
	const showAllNamesLabel = locale === "ru" ? "Показать полностью" : "Show full"
	const showLessNamesLabel = locale === "ru" ? "Свернуть" : "Show less"

	const seasonsSorted = useMemo(() => {
		const seasons = Array.isArray((anime as any).seasons) ? ((anime as any).seasons as Anime[]) : []
		return seasons
			.slice()
			.filter((s) => s && typeof (s as any).id === "number")
			.sort((a, b) => ((a.season_number || 0) - (b.season_number || 0)) || ((a.id || 0) - (b.id || 0)))
	}, [anime])

	const shouldShowToggle = otherAltTitles.some((x) => x.length > 32) || seasonsSorted.some((s) => (getLocalizedTitle(s, locale) || "").length > 32)

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
							const href = buildCollectionHref({ kind: "genre", value: g.name })
							const chip = (
								<Link href={href} className="meta-chip text-sm">
									<span className="truncate max-w-[180px]">{label}</span>
								</Link>
							)
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
							const href = buildCollectionHref({ kind: "theme", value: th.name })
							const chip = (
								<Link href={href} className="meta-chip text-sm">
									<span className="truncate max-w-[180px]">{label}</span>
								</Link>
							)
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
								<Link href={buildCollectionHref({ kind: "rating", value: anime.rating })} className="meta-chip text-sm">
									<span className="truncate max-w-[180px]">{details.rating}</span>
								</Link>
							</TooltipTrigger>
							<TooltipContent sideOffset={8} className="max-w-sm !bg-card !text-foreground border border-border shadow-lg px-4 py-3 text-sm leading-relaxed">
								{ratingDescription}
							</TooltipContent>
						</Tooltip>
					) : (
						<Link href={buildCollectionHref({ kind: "rating", value: anime.rating })} className="meta-chip text-sm">
							<span className="truncate max-w-[180px]">{details.rating}</span>
						</Link>
					)}
				  </div>
				</div>
			  ) : null}
            </div>

            {/* Alternative Titles */}
            <div className="bg-card rounded-xl p-6 border border-card-border shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{labels.altTitles}</h3>
                </div>
				{shouldShowToggle ? (
					<button
						type="button"
						onClick={() => setShowAllNames((v) => !v)}
						className="text-xs font-semibold text-primary hover:text-primary/80"
					>
						{showAllNames ? showLessNamesLabel : showAllNamesLabel}
					</button>
				) : null}
              </div>
              <div className="space-y-2">
                {alternativeTitles.romaji && (
                  <div className="flex gap-2">
                    <span className="text-foreground-subtle font-medium min-w-[80px]">{labels.romaji}:</span>
					<span className="text-foreground-muted break-words">{alternativeTitles.romaji}</span>
                  </div>
                )}
				{alternativeTitles.english && (
				  <div className="flex gap-2">
					<span className="text-foreground-subtle font-medium min-w-[80px]">{labels.english}:</span>
					<span className="text-foreground-muted break-words">{alternativeTitles.english}</span>
				  </div>
				)}
                {alternativeTitles.russian && (
                  <div className="flex gap-2">
                    <span className="text-foreground-subtle font-medium min-w-[80px]">{labels.russian}:</span>
					<span className="text-foreground-muted break-words">{alternativeTitles.russian}</span>
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
									<span className={showAllNames ? "whitespace-normal break-words" : "truncate max-w-[220px]"}>{name}</span>
								</span>
							))}
						</div>
					</div>
				) : null}
				{seasonsSorted.length > 1 ? (
					<div className="pt-4">
						<div className="text-xs font-semibold text-foreground-muted mb-2">{labels.seasons}:</div>
						<div className="flex flex-wrap gap-2">
							{seasonsSorted.map((s) => {
								const n = typeof s.season_number === "number" && s.season_number > 0 ? s.season_number : null
								const prefix = n ? (locale === "ru" ? `${n} сезон` : `S${n}`) : (locale === "ru" ? "Сезон" : "Season")
								const label = `${prefix}: ${getLocalizedTitle(s, locale)}`
								const active = s.id === anime.id
								return (
									<Link
										key={s.id}
										href={`/anime/${s.url}`}
										className={
											"inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors " +
											(active
												? "border-primary/40 bg-primary/10 text-primary font-semibold"
												: "border-border bg-background-tertiary text-foreground-muted hover:text-foreground hover:bg-background")
										}
									>
										<span className={showAllNames ? "whitespace-normal break-words" : "truncate max-w-[260px]"}>{label}</span>
									</Link>
								)
							})}
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
