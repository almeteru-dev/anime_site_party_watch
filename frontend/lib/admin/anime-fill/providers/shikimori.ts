import {
	adminShikimoriGetAnime,
	adminShikimoriSearch,
	type AdminCreateAnimeInput,
	type AdminMeta,
	type ShikimoriAnimeSearchItem,
} from "@/lib/api"

export type ShikiState = { items: ShikimoriAnimeSearchItem[]; error: string | null }

export async function adminSearchShikimori(q: string): Promise<any[]> {
	const res = await adminShikimoriSearch({ q })
	return res.items || []
}

export async function adminGetShikimoriAnime(id: number): Promise<any> {
	return adminShikimoriGetAnime({ id })
}

export function stripShikiBBCode(input: string): string {
	let s = String(input || "")
	s = s.replace(/\[br\]/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
	s = s.replace(/\[(character|person|anime|manga|ranobe|seyu)=\d+[^\]]*\]([\s\S]*?)\[\/(character|person|anime|manga|ranobe|seyu)\]/gi, "$2")
	s = s.replace(/\[\/?(b|i|u|s|spoiler|quote|url|center|left|right|color|size)[^\]]*\]/gi, "")
	s = s.replace(/\[[^\]]+\]/g, "")
	s = s.replace(/\n{3,}/g, "\n\n")
	return s.trim()
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

export function createMetaEnsurer(meta: AdminMeta, api: {
	adminCreateStatus: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
	adminCreateRating: (p: { name: string }) => Promise<any>
	adminCreateKind: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
	adminCreateStudio: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
	adminCreateSource: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
	adminCreateProducer: (p: { name: string }) => Promise<any>
	adminCreateGenre: (p: { name: string; ru_name?: string | null; uk_name?: string | null; description_en?: string | null; description_ru?: string | null; description_uk?: string | null }) => Promise<any>
	adminCreateTheme: (p: { name: string; ru_name?: string | null; uk_name?: string | null; description_en?: string | null; description_ru?: string | null; description_uk?: string | null }) => Promise<any>
}) {
	const nextMeta: AdminMeta = {
		...meta,
		genres: [...(meta.genres || [])],
		themes: [...(meta.themes || [])],
		producers: [...(meta.producers || [])],
		studios: [...(meta.studios || [])],
		statuses: [...(meta.statuses || [])],
		sources: [...(meta.sources || [])],
		kinds: [...(meta.kinds || [])],
		ratings: [...(meta.ratings || [])],
	}
	const norm = (s: string) => s.trim().toLowerCase()
	const ensureStatus = async (name: string, ruName?: string) => {
		const key = norm(name)
		const found = nextMeta.statuses.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateStatus({ name, ru_name: ruName ?? null })
		nextMeta.statuses.push(created)
		return created
	}
	const ensureRating = async (name: string) => {
		const key = norm(name)
		const found = nextMeta.ratings.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateRating({ name })
		nextMeta.ratings.push(created)
		return created
	}
	const ensureKind = async (name: string) => {
		const key = norm(name)
		const found = nextMeta.kinds.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateKind({ name, ru_name: null })
		nextMeta.kinds.push(created)
		return created
	}
	const ensureStudio = async (name: string) => {
		const key = norm(name)
		const found = nextMeta.studios.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateStudio({ name, ru_name: null })
		nextMeta.studios.push(created)
		return created
	}
	const ensureSource = async (name: string) => {
		const key = norm(name)
		const found = nextMeta.sources.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateSource({ name, ru_name: null })
		nextMeta.sources.push(created)
		return created
	}
	const ensureProducer = async (name: string) => {
		const key = norm(name)
		const found = nextMeta.producers.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateProducer({ name })
		nextMeta.producers.push(created)
		return created
	}
	const ensureGenre = async (name: string, ruName?: string) => {
		const key = norm(name)
		const found = nextMeta.genres.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateGenre({ name, ru_name: ruName ?? null })
		nextMeta.genres.push(created)
		return created
	}
	const ensureTheme = async (name: string) => {
		const key = norm(name)
		const found = nextMeta.themes.find((x) => norm(x.name) === key)
		if (found) return found
		const created = await api.adminCreateTheme({ name, ru_name: null })
		nextMeta.themes.push(created)
		return created
	}

	return { nextMeta, ensureStatus, ensureRating, ensureKind, ensureStudio, ensureSource, ensureProducer, ensureGenre, ensureTheme }
}

export function mapShikiRatingToCode(raw: unknown): string {
	const v = String(raw || "").trim()
	if (!v) return ""
	const ratingMap: Record<string, string> = { pg_13: "pg-13", r_17: "r-17+", r_plus: "r+" }
	return ratingMap[v] || v
}

export function pickTrailerUrl(videos: any): string {
	const vids = Array.isArray(videos) ? videos : []
	const pv = vids.find((v: any) => v?.kind === "pv" && typeof v?.player_url === "string") || vids.find((v: any) => typeof v?.player_url === "string")
	if (!pv) return ""
	const raw = String(pv.player_url || "").trim()
	if (!raw) return ""
	return raw.replace(/^http:\/\//, "https://")
}

export function pickShikiPosterUrl(image: any): string {
	const src = typeof image?.original === "string" ? image.original : ""
	if (!src) return ""
	if (String(src).includes("/assets/globals/missing_")) return ""
	return /^https?:\/\//.test(src) ? src : `https://shikimori.one${src}`
}

export async function fillAnimeDraftFromShikimori(params: {
	form: AdminCreateAnimeInput
	meta: AdminMeta
	shikiAnime: any
	api: {
		adminCreateStatus: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
		adminCreateRating: (p: { name: string }) => Promise<any>
		adminCreateKind: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
		adminCreateStudio: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
		adminCreateSource: (p: { name: string; ru_name?: string | null; uk_name?: string | null }) => Promise<any>
		adminCreateProducer: (p: { name: string }) => Promise<any>
		adminCreateGenre: (p: { name: string; ru_name?: string | null; uk_name?: string | null; description_en?: string | null; description_ru?: string | null; description_uk?: string | null }) => Promise<any>
		adminCreateTheme: (p: { name: string; ru_name?: string | null; uk_name?: string | null; description_en?: string | null; description_ru?: string | null; description_uk?: string | null }) => Promise<any>
	}
	applyJikanMetaAndCommon: (p: {
		form: AdminCreateAnimeInput
		meta: AdminMeta
		ensureStatus: any
		ensureStudio: any
		ensureProducer: any
		ensureGenre: any
		ensureSource: any
		ensureTheme: any
		ensureRating: any
		jikanData: any
	}) => Promise<{ nextForm: AdminCreateAnimeInput; nextMeta: AdminMeta; missing: string[] }>
	jikanData?: any
}): Promise<{ nextForm: AdminCreateAnimeInput; nextMeta: AdminMeta; missing: string[] }> {
	const a: any = params.shikiAnime
	const missing: string[] = []
	const { nextMeta, ensureStatus, ensureRating, ensureKind, ensureStudio, ensureSource, ensureProducer, ensureGenre, ensureTheme } = createMetaEnsurer(params.meta, params.api)
	const next: AdminCreateAnimeInput = { ...params.form }

	if (!next.title_ru.trim() && typeof a?.russian === "string") next.title_ru = a.russian
	if (!next.title_en_romaji.trim() && typeof a?.name === "string") next.title_en_romaji = a.name
	if (!next.title_en.trim() && Array.isArray(a?.english) && a.english.length) {
		const v = String(a.english[0] || "").trim()
		if (v) next.title_en = v
	}
	if (!next.title_en.trim() && typeof a?.name === "string") next.title_en = a.name
	if ((!next.kind || !String(next.kind).trim()) && typeof a?.kind === "string") next.kind = a.kind
	if (typeof next.kind === "string" && next.kind.trim()) {
		try {
			await ensureKind(next.kind)
		} catch {
			missing.push("kind")
		}
	}
	if (((next.duration || 0) <= 0 || next.duration === 24) && typeof a?.duration === "number" && a.duration > 0) next.duration = a.duration
	if (((next.episodes || 0) <= 0 || next.episodes === 12) && typeof a?.episodes === "number" && a.episodes > 0) next.episodes = a.episodes
	if ((next.episodes_aired || 0) <= 0 && typeof a?.episodes_aired === "number" && a.episodes_aired > 0) next.episodes_aired = a.episodes_aired
	if (!next.aired_on && typeof a?.aired_on === "string") next.aired_on = a.aired_on
	if (!next.released_on && typeof a?.released_on === "string") next.released_on = a.released_on
	if ((next.status_id == null) && typeof a?.status === "string" && a.status.trim()) {
		const ruStatus: Record<string, string> = { ongoing: "Онгоинг", released: "Вышло", anons: "Анонс" }
		try {
			const st = await ensureStatus(a.status, ruStatus[a.status])
			next.status_id = st.id
		} catch {
			missing.push("status_id")
		}
	}
	const mal = typeof a?.myanimelist_id === "number" ? a.myanimelist_id : typeof a?.mal_id === "number" ? a.mal_id : null
	if ((next.mal_id == null || next.mal_id === 0) && typeof mal === "number") next.mal_id = mal

	const pickedTrailer = pickTrailerUrl(a?.videos)
	if ((!next.trailer_url || !next.trailer_url.trim()) && pickedTrailer) next.trailer_url = pickedTrailer

	const mappedRating = mapShikiRatingToCode(a?.rating)
	if ((!next.rating || !next.rating.trim()) && mappedRating) {
		try {
			await ensureRating(mappedRating)
			next.rating = mappedRating
		} catch {
			missing.push("rating")
		}
	}
	if ((next.studio_id == null) && Array.isArray(a?.studios)) {
		const sname = String(a.studios?.[0]?.name || "").trim()
		if (sname) {
			try {
				const st = await ensureStudio(sname)
				next.studio_id = st.id
			} catch {
				missing.push("studio_id")
			}
		}
	}
	if ((!next.description_ru || !next.description_ru.trim()) && typeof a?.description === "string") {
		next.description_ru = stripShikiBBCode(a.description)
	}

	const poster = pickShikiPosterUrl(a?.image)
	if (!next.poster_url && poster) next.poster_url = poster
	if ((!next.background_url || !next.background_url.trim()) && next.poster_url) next.background_url = next.poster_url

	if ((next.alt_titles || []).length === 0) {
		const titles = uniqTitles([
			...(Array.isArray(a?.english) ? a.english : []),
			...(Array.isArray(a?.japanese) ? a.japanese : []),
			...(Array.isArray(a?.synonyms) ? a.synonyms : []),
		])
		const filtered = titles.filter((t) => {
			const tl = t.toLowerCase()
			return tl !== next.title_en_romaji.toLowerCase() && tl !== next.title_ru.toLowerCase() && tl !== next.title_en.toLowerCase() && tl !== (next.title_uk || "").toLowerCase()
		})
		if (filtered.length) next.alt_titles = filtered
	}

	if ((next.genre_ids || []).length === 0 && Array.isArray(a?.genres)) {
		const ids: number[] = []
		for (const g of a.genres) {
			const gname = String(g?.name || "").trim()
			if (!gname) continue
			try {
				const created = await ensureGenre(gname, typeof g?.russian === "string" ? g.russian : undefined)
				ids.push(created.id)
			} catch {
				missing.push("genre_ids")
			}
		}
		if (ids.length) next.genre_ids = Array.from(new Set(ids))
	}

	if (params.jikanData) {
		const enriched = await params.applyJikanMetaAndCommon({
			form: next,
			meta: nextMeta,
			ensureStatus,
			ensureStudio,
			ensureProducer,
			ensureGenre,
			ensureSource,
			ensureTheme,
			ensureRating,
			jikanData: params.jikanData,
		})
		return {
			nextForm: enriched.nextForm,
			nextMeta: enriched.nextMeta,
			missing: Array.from(new Set([...missing, ...enriched.missing])),
		}
	}

	return { nextForm: next, nextMeta, missing }
}
