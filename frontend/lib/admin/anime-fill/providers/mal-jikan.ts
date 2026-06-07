import { adminJikanGetAnime, publicMalAnimeSearch, type AdminCreateAnimeInput, type AdminMeta, type MalAnimeSearchNode } from "@/lib/api"

export type JikanV4Anime = Record<string, any>

export async function adminSearchMal(q: string): Promise<MalAnimeSearchNode[]> {
	const res = await publicMalAnimeSearch({ q, limit: 12 })
	return (res.data || []).map((x) => x.node).filter(Boolean)
}

export async function adminGetJikanAnimeData(malId: number): Promise<any | null> {
	try {
		const j: any = await adminJikanGetAnime({ id: malId })
		return j?.data ?? null
	} catch {
		return null
	}
}

export function uniqTitles(items: string[]) {
	const seen = new Set<string>()
	const out: string[] = []
	for (const raw of items) {
		const v = String(raw || "").trim()
		if (!v) continue
		const key = v.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		out.push(v)
	}
	return out
}

export function uniqUrls(items: string[]) {
	const seen = new Set<string>()
	const out: string[] = []
	for (const raw of items) {
		const v = String(raw || "").trim()
		if (!v) continue
		const normalized = v.replace(/^http:\/\//, "https://")
		const key = normalized.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		out.push(normalized)
	}
	return out
}

export function parseJikanDurationMinutes(raw: unknown): number {
	if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, Math.round(raw))
	const s = String(raw || "").toLowerCase()
	if (!s.trim()) return 0
	let minutes = 0
	const hr = s.match(/(\d+)\s*(hr|hour|hours)/)
	if (hr) minutes += parseInt(hr[1], 10) * 60
	const min = s.match(/(\d+)\s*(min|mins|minute|minutes)/)
	if (min) minutes += parseInt(min[1], 10)
	if (!minutes) {
		const only = s.match(/\b(\d+)\b/)
		if (only) minutes = parseInt(only[1], 10)
	}
	return Number.isFinite(minutes) ? Math.max(0, minutes) : 0
}

export function mapJikanTypeToKind(raw: unknown): string {
	const v = String(raw || "").toLowerCase().trim()
	if (!v) return ""
	if (v === "tv" || v === "tv series" || v === "series") return "tv"
	if (v === "movie") return "movie"
	if (v === "ova") return "ova"
	if (v === "ona") return "ona"
	if (v === "special") return "special"
	if (v === "music") return "music"
	return ""
}

export function mapJikanStatusToInternal(raw: unknown): "ongoing" | "released" | "anons" | "" {
	const v = String(raw || "").toLowerCase().trim()
	if (!v) return ""
	if (v.includes("currently") && v.includes("air")) return "ongoing"
	if (v.includes("finished") && v.includes("air")) return "released"
	if (v.includes("not") && v.includes("yet") && v.includes("air")) return "anons"
	return ""
}

export function mapJikanRatingToCode(raw: unknown): string {
	const v = String(raw || "").toUpperCase()
	if (!v.trim()) return ""
	if (v.includes("PG-13")) return "pg-13"
	if (v.includes("R - 17+") || v.includes("R17")) return "r-17+"
	if (v.includes("R+")) return "r+"
	if (v.includes("PG")) return "pg"
	if (v.includes("G")) return "g"
	return ""
}

export function asISODate(raw: unknown): string {
	const s = String(raw || "").trim()
	if (!s) return ""
	return s.length >= 10 ? s.slice(0, 10) : s
}

export function pickJikanTrailerUrl(trailer: any): string {
	const url = typeof trailer?.url === "string" ? trailer.url : ""
	const embed = typeof trailer?.embed_url === "string" ? trailer.embed_url : ""
	const v = String(url || embed || "").trim()
	if (!v) return ""
	return v.replace(/^http:\/\//, "https://")
}

export function pickJikanImageUrls(images: any): { posterUrl: string; galleryUrls: string[] } {
	const jpg = images?.jpg || {}
	const webp = images?.webp || {}
	const candidates = uniqUrls([
		jpg?.large_image_url,
		webp?.large_image_url,
		jpg?.image_url,
		webp?.image_url,
		jpg?.small_image_url,
		webp?.small_image_url,
	])
	return { posterUrl: candidates[0] || "", galleryUrls: candidates }
}

export function readJikanAnimeFields(data: JikanV4Anime): {
	title: string
	titleEnglish: string
	synopsis: string
	episodes: number
	durationMinutes: number
	airedOn: string
	releasedOn: string
	kind: string
	ratingCode: string
	statusCode: "ongoing" | "released" | "anons" | ""
	sourceName: string
	trailerUrl: string
	posterUrl: string
	galleryUrls: string[]
	studios: string[]
	producers: string[]
	genres: string[]
	themes: string[]
} {
	const title = String(data?.title || "").trim()
	const titleEnglish = String(data?.title_english || "").trim()
	const synopsis = String(data?.synopsis || "").trim()
	const episodes = typeof data?.episodes === "number" && data.episodes > 0 ? data.episodes : 0
	const durationMinutes = parseJikanDurationMinutes(data?.duration)
	const airedOn = asISODate(data?.aired?.from)
	const releasedOn = asISODate(data?.aired?.to)
	const kind = mapJikanTypeToKind(data?.type)
	const ratingCode = mapJikanRatingToCode(data?.rating)
	const statusCode = mapJikanStatusToInternal(data?.status)
	const sourceName = String(data?.source || "").trim()
	const trailerUrl = pickJikanTrailerUrl(data?.trailer)
	const img = pickJikanImageUrls(data?.images)
	const studios = (Array.isArray(data?.studios) ? data.studios : []).map((x: any) => String(x?.name || "").trim()).filter(Boolean)
	const producers = (Array.isArray(data?.producers) ? data.producers : []).map((x: any) => String(x?.name || "").trim()).filter(Boolean)
	const genres = (Array.isArray(data?.genres) ? data.genres : []).map((x: any) => String(x?.name || "").trim()).filter(Boolean)
	const themes = (Array.isArray(data?.themes) ? data.themes : []).map((x: any) => String(x?.name || "").trim()).filter(Boolean)
	return {
		title,
		titleEnglish,
		synopsis,
		episodes,
		durationMinutes,
		airedOn,
		releasedOn,
		kind,
		ratingCode,
		statusCode,
		sourceName,
		trailerUrl,
		posterUrl: img.posterUrl,
		galleryUrls: img.galleryUrls,
		studios,
		producers,
		genres,
		themes,
	}
}

export function applyJikanCommonToDraft(params: {
	form: AdminCreateAnimeInput
	jikanData: any
}): AdminCreateAnimeInput {
	const data = params.jikanData || {}
	const jf = readJikanAnimeFields(data)
	const next: AdminCreateAnimeInput = { ...params.form }
	if ((next.mal_id == null || next.mal_id === 0) && typeof data?.mal_id === "number" && data.mal_id > 0) next.mal_id = data.mal_id
	if (!next.title_en.trim() && (jf.titleEnglish || jf.title)) next.title_en = jf.titleEnglish || jf.title
	if (!next.title_en_romaji.trim() && jf.title) next.title_en_romaji = jf.title
	if ((!next.description_en || !next.description_en.trim()) && jf.synopsis) next.description_en = jf.synopsis
	if ((!next.episodes || next.episodes <= 0) && jf.episodes) next.episodes = jf.episodes
	if ((next.episodes_aired || 0) <= 0 && jf.statusCode === "released" && jf.episodes) next.episodes_aired = jf.episodes
	if ((!next.duration || next.duration <= 0) && jf.durationMinutes) next.duration = jf.durationMinutes
	if (!next.aired_on && jf.airedOn) next.aired_on = jf.airedOn
	if (!next.released_on && jf.releasedOn) next.released_on = jf.releasedOn
	if ((!next.kind || !String(next.kind).trim()) && jf.kind) next.kind = jf.kind as any
	if ((!next.rating || !next.rating.trim()) && jf.ratingCode) next.rating = jf.ratingCode
	if ((!next.trailer_url || !next.trailer_url.trim()) && jf.trailerUrl) next.trailer_url = jf.trailerUrl
	if ((!next.poster_url || !next.poster_url.trim()) && jf.posterUrl) next.poster_url = jf.posterUrl
	if ((!next.background_url || !next.background_url.trim()) && (next.poster_url || jf.posterUrl)) next.background_url = next.poster_url || jf.posterUrl
	if ((next.gallery_urls || []).length === 0 && jf.galleryUrls.length) next.gallery_urls = jf.galleryUrls
	return next
}

export async function ensureJikanMeta(params: {
	meta: AdminMeta
	ensureStatus: (name: string, ruName?: string) => Promise<{ id: number }>
	ensureSource: (name: string) => Promise<{ id: number }>
	ensureTheme: (name: string) => Promise<{ id: number }>
	ensureRating: (name: string) => Promise<{ id: number }>
	ensureStudio: (name: string) => Promise<{ id: number }>
	ensureProducer: (name: string) => Promise<{ id: number }>
	ensureGenre: (name: string, ruName?: string) => Promise<{ id: number }>
	form: AdminCreateAnimeInput
	jikanData: any
}): Promise<{ nextMeta: AdminMeta; nextForm: AdminCreateAnimeInput; missing: string[] }> {
	const missing: string[] = []
	const jf = readJikanAnimeFields(params.jikanData || {})
	const nextForm = applyJikanCommonToDraft({ form: params.form, jikanData: params.jikanData })
	const nextMeta: AdminMeta = params.meta
	if (nextForm.status_id == null && jf.statusCode) {
		const ruStatus: Record<string, string> = { ongoing: "Онгоинг", released: "Вышло", anons: "Анонс" }
		try {
			const st = await params.ensureStatus(jf.statusCode, ruStatus[jf.statusCode])
			nextForm.status_id = st.id
		} catch {
			missing.push("status_id")
		}
	}
	if ((!nextForm.rating || !nextForm.rating.trim()) && jf.ratingCode) {
		try {
			await params.ensureRating(jf.ratingCode)
			nextForm.rating = jf.ratingCode
		} catch {
			missing.push("rating")
		}
	}
	if (nextForm.studio_id == null && jf.studios.length) {
		try {
			const st = await params.ensureStudio(jf.studios[0])
			nextForm.studio_id = st.id
		} catch {
			missing.push("studio_id")
		}
	}
	if ((nextForm.producer_ids || []).length === 0 && jf.producers.length) {
		const ids: number[] = []
		for (const pname of jf.producers) {
			try {
				const p = await params.ensureProducer(pname)
				ids.push(p.id)
			} catch {
				missing.push("producer_ids")
			}
		}
		if (ids.length) {
			const uniq = Array.from(new Set(ids))
			nextForm.producer_ids = uniq
			if (nextForm.producer_id == null) nextForm.producer_id = uniq[0]
		}
	}
	if ((nextForm.genre_ids || []).length === 0 && jf.genres.length) {
		const ids: number[] = []
		for (const gname of jf.genres) {
			try {
				const g = await params.ensureGenre(gname)
				ids.push(g.id)
			} catch {
				missing.push("genre_ids")
			}
		}
		if (ids.length) nextForm.genre_ids = Array.from(new Set(ids))
	}
	if (nextForm.source_id == null && jf.sourceName) {
		try {
			const src = await params.ensureSource(jf.sourceName)
			nextForm.source_id = src.id
		} catch {
			missing.push("source_id")
		}
	}
	if ((nextForm.theme_ids || []).length === 0 && jf.themes.length) {
		const tids: number[] = []
		for (const tname of jf.themes) {
			try {
				const th = await params.ensureTheme(tname)
				tids.push(th.id)
			} catch {
				missing.push("theme_ids")
			}
		}
		if (tids.length) nextForm.theme_ids = Array.from(new Set(tids))
	}
	return { nextMeta, nextForm, missing }
}
