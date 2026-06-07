import { adminMoonanimeGetAnime, adminUpdateGenre, adminUpdateTheme, type AdminCreateAnimeInput, type AdminMeta } from "@/lib/api"

export type MoonanimeAnimeResponse = Record<string, any>

function normName(s: unknown): string {
	return String(s || "").trim().toLowerCase()
}

function normText(s: unknown): string {
	return String(s || "").trim()
}

export async function adminGetMoonanimeAnimeData(malId: number): Promise<any | null> {
	try {
		const r: any = await adminMoonanimeGetAnime({ id: malId })
		return r?.data ?? null
	} catch {
		return null
	}
}

export function readMoonanimeUA(data: MoonanimeAnimeResponse): {
	titleUK: string
	descriptionUK: string
	genreUKByEN: Map<string, string>
	themeUKByEN: Map<string, string>
} {
	const titleUK = normText(data?.titles?.ua)
	const descriptionUK = normText(data?.synopsis?.ua)
	const genreUKByEN = new Map<string, string>()
	const themeUKByEN = new Map<string, string>()

	const genres = Array.isArray(data?.genres) ? data.genres : []
	for (const g of genres) {
		const en = normText(g?.name)
		const uk = normText(g?.name_ua)
		if (!en || !uk) continue
		genreUKByEN.set(normName(en), uk)
	}
	const themes = Array.isArray(data?.themes) ? data.themes : []
	for (const t of themes) {
		const en = normText(t?.name)
		const uk = normText(t?.name_ua)
		if (!en || !uk) continue
		themeUKByEN.set(normName(en), uk)
	}
	return { titleUK, descriptionUK, genreUKByEN, themeUKByEN }
}

export async function applyMoonanimeUATranslate(params: {
	form: AdminCreateAnimeInput
	meta: AdminMeta
	malId: number
}): Promise<{ nextForm: AdminCreateAnimeInput; nextMeta: AdminMeta; report: string }> {
	const data = await adminGetMoonanimeAnimeData(params.malId)
	if (!data) {
		return { nextForm: params.form, nextMeta: params.meta, report: "Moonanime: не удалось получить данные" }
	}
	const ua = readMoonanimeUA(data)
	const nextForm: AdminCreateAnimeInput = { ...params.form }
	const nextMeta: AdminMeta = {
		...params.meta,
		genres: [...(params.meta.genres || [])],
		themes: [...(params.meta.themes || [])],
		producers: params.meta.producers,
		studios: params.meta.studios,
		statuses: params.meta.statuses,
		sources: params.meta.sources,
		kinds: params.meta.kinds,
		ratings: params.meta.ratings,
	}

	if ((!nextForm.title_uk || !nextForm.title_uk.trim()) && ua.titleUK) nextForm.title_uk = ua.titleUK
	if ((!nextForm.description_uk || !nextForm.description_uk.trim()) && ua.descriptionUK) nextForm.description_uk = ua.descriptionUK

	let updatedGenres = 0
	let updatedThemes = 0
	let failed = 0

	for (const g of nextMeta.genres) {
		if (g.uk_name && String(g.uk_name).trim()) continue
		const uk = ua.genreUKByEN.get(normName(g.name))
		if (!uk) continue
		try {
			const updated = await adminUpdateGenre({
				id: g.id,
				name: g.name,
				ru_name: g.ru_name ?? null,
				uk_name: uk,
				description_en: g.description_en ?? null,
				description_ru: g.description_ru ?? null,
				description_uk: g.description_uk ?? null,
			})
			Object.assign(g, updated)
			updatedGenres++
		} catch {
			failed++
		}
	}

	for (const t of nextMeta.themes) {
		if (t.uk_name && String(t.uk_name).trim()) continue
		const uk = ua.themeUKByEN.get(normName(t.name))
		if (!uk) continue
		try {
			const updated = await adminUpdateTheme({
				id: t.id,
				name: t.name,
				ru_name: t.ru_name ?? null,
				uk_name: uk,
				description_en: t.description_en ?? null,
				description_ru: t.description_ru ?? null,
				description_uk: t.description_uk ?? null,
			})
			Object.assign(t, updated)
			updatedThemes++
		} catch {
			failed++
		}
	}

	const filled: string[] = []
	if (ua.titleUK) filled.push("title_uk")
	if (ua.descriptionUK) filled.push("description_uk")
	const parts: string[] = []
	if (filled.length) parts.push(`UA поля: ${filled.join(", ")}`)
	if (updatedGenres || updatedThemes) parts.push(`Переводы справочников: genres +${updatedGenres}, themes +${updatedThemes}`)
	if (failed) parts.push(`Ошибок: ${failed}`)
	if (!parts.length) parts.push("UA данные не найдены")
	return { nextForm, nextMeta, report: parts.join(" • ") }
}

