"use client"

import { useMemo, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import type { CatalogMeta } from "@/lib/api"

type CollectionKind = "genre" | "theme" | "rating"

type CollectionHeaderProps = {
	kind: CollectionKind
	value: string
	meta: CatalogMeta
	resultCount: number
}

function clampText(text: string, limit: number): { short: string; clamped: boolean } {
	const t = text.trim()
	if (t.length <= limit) return { short: t, clamped: false }
	return { short: t.slice(0, Math.max(0, limit - 1)).trimEnd() + "…", clamped: true }
}

export function CollectionHeader({ kind, value, meta, resultCount }: CollectionHeaderProps) {
	const { locale } = useLanguage()
	const [expanded, setExpanded] = useState(false)

	const data = useMemo(() => {
		const isRu = locale === "ru"
		if (kind === "genre") {
			const g = meta.genres.find((x) => x.name === value)
			const title = isRu ? g?.ru_name?.trim() || g?.name || value : g?.name || g?.ru_name?.trim() || value
			const description = isRu ? g?.description_ru || g?.description_en || "" : g?.description_en || g?.description_ru || ""
			return {
				title,
				description,
			}
		}
		if (kind === "theme") {
			const t = meta.themes.find((x) => x.name === value)
			const title = isRu ? t?.ru_name?.trim() || t?.name || value : t?.name || t?.ru_name?.trim() || value
			const description = isRu ? t?.description_ru || t?.description_en || "" : t?.description_en || t?.description_ru || ""
			return {
				title,
				description,
			}
		}
		const r = meta.ratings.find((x) => x.name === value)
		const title = isRu ? `Рейтинг: ${value}` : `Rating: ${value}`
		const description = isRu ? r?.description_ru || r?.description_en || "" : r?.description_en || r?.description_ru || ""
		return {
			title,
			description,
		}
	}, [kind, locale, meta.genres, meta.ratings, meta.themes, value])

	const desc = data.description.trim()
	const hasAnyDesc = Boolean(desc)
	const limit = 360
	const clamped = expanded ? { short: desc, clamped: false } : clampText(desc, limit)
	const showToggle = clamped.clamped && hasAnyDesc

	const toggleLabel = locale === "ru" ? (expanded ? "Свернуть" : "Развернуть") : (expanded ? "Collapse" : "Expand")

	return (
		<div className="mb-8 lg:mb-10">
			<h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 text-balance">
				{data.title}
			</h1>

			{hasAnyDesc ? (
				<div className="rounded-xl border border-border/50 bg-background-secondary/40 backdrop-blur-sm p-5 card-shadow">
					<p className="text-sm text-foreground-muted leading-relaxed">{clamped.short}</p>

					{showToggle ? (
						<button
							type="button"
							onClick={() => setExpanded((p) => !p)}
							className="mt-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
						>
							{toggleLabel}
						</button>
					) : null}
				</div>
			) : null}

			<div className="mt-4 text-sm text-foreground-subtle">
				{locale === "ru" ? `Найдено: ${resultCount}` : `Found: ${resultCount}`}
			</div>
		</div>
	)
}
