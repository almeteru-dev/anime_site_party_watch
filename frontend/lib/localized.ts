import type { Locale } from "@/lib/translations"

export function toBcp47(locale: Locale): string {
	if (locale === "ru") return "ru-RU"
	if (locale === "uk") return "uk-UA"
	return "en-US"
}

export function pickName(locale: Locale, item: { name?: string | null; ru_name?: string | null; uk_name?: string | null }): string {
	const name = item.name || ""
	const ru = item.ru_name || ""
	const uk = item.uk_name || ""
	if (locale === "uk") return uk || ru || name
	if (locale === "ru") return ru || name
	return name
}

export function pickDescription(
	locale: Locale,
	item: { description_en?: string | null; description_ru?: string | null; description_uk?: string | null }
): string {
	const en = item.description_en || ""
	const ru = item.description_ru || ""
	const uk = item.description_uk || ""
	if (locale === "uk") return uk || ru || en
	if (locale === "ru") return ru || en
	return en || ru
}

export function pickAnimeTitle(
	locale: Locale,
	item: { title_en?: string | null; title_ru?: string | null; title_uk?: string | null; url?: string | null; name?: string | null }
): string {
	const en = item.title_en || ""
	const ru = item.title_ru || ""
	const uk = item.title_uk || ""
	const fallback = item.name || item.url || ""
	if (locale === "uk") return uk || ru || en || fallback
	if (locale === "ru") return ru || uk || en || fallback
	return en || ru || uk || fallback
}
