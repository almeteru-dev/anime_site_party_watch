"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Achievement, Title } from "@/lib/api"
import type { Locale } from "@/lib/translations"

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
	const v = hex.trim()
	if (!v.startsWith("#")) return null
	const raw = v.slice(1)
	if (raw.length === 3) {
		const r = parseInt(raw[0] + raw[0], 16)
		const g = parseInt(raw[1] + raw[1], 16)
		const b = parseInt(raw[2] + raw[2], 16)
		if ([r, g, b].some((n) => Number.isNaN(n))) return null
		return { r, g, b }
	}
	if (raw.length === 6) {
		const r = parseInt(raw.slice(0, 2), 16)
		const g = parseInt(raw.slice(2, 4), 16)
		const b = parseInt(raw.slice(4, 6), 16)
		if ([r, g, b].some((n) => Number.isNaN(n))) return null
		return { r, g, b }
	}
	return null
}

function pickTextColor(bgHex: string): "#111827" | "#ffffff" {
	const rgb = parseHexColor(bgHex)
	if (!rgb) return "#ffffff"
	const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
	return lum > 0.62 ? "#111827" : "#ffffff"
}

type LocalizedTag = Pick<Achievement, "id" | "code" | "name_en" | "name_ru" | "name_uk" | "color"> | Pick<Title, "id" | "code" | "name_en" | "name_ru" | "name_uk" | "color">

function localizedLabel(a: LocalizedTag, locale: Locale): string {
	if (locale === "uk") return a.name_uk || a.name_en
	if (locale === "ru") return a.name_ru || a.name_en
	return a.name_en
}

export function AchievementTags(props: { achievements: LocalizedTag[]; locale: Locale; className?: string }) {
	const items = props.achievements
	const sorted = useMemo(() => [...items].sort((x, y) => x.id - y.id), [items])

	if (sorted.length === 0) return null

	return (
		<div className={cn("flex flex-wrap gap-2", props.className)}>
			{sorted.map((a) => {
				const fg = pickTextColor(a.color)
				return (
					<span
						key={a.id}
						className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold"
						style={{ backgroundColor: a.color, color: fg }}
						title={a.code}
					>
						{localizedLabel(a, props.locale)}
					</span>
				)
			})}
		</div>
	)
}
