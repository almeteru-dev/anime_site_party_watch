import {
	adminCreateGenre,
	adminCreateKind,
	adminCreateProducer,
	adminCreateRating,
	adminCreateSource,
	adminCreateStatus,
	adminCreateStudio,
	adminCreateTheme,
	type AdminCreateAnimeInput,
	type AdminMeta,
} from "@/lib/api"

import { adminGetJikanAnimeData, adminSearchMal, applyJikanCommonToDraft, ensureJikanMeta } from "@/lib/admin/anime-fill/providers/mal-jikan"
import { adminGetShikimoriAnime, adminSearchShikimori, createMetaEnsurer, fillAnimeDraftFromShikimori } from "@/lib/admin/anime-fill/providers/shikimori"

export { adminSearchMal } from "@/lib/admin/anime-fill/providers/mal-jikan"
export { adminSearchShikimori } from "@/lib/admin/anime-fill/providers/shikimori"

export async function fillDraftFromShikimoriId(params: {
	form: AdminCreateAnimeInput
	meta: AdminMeta
	shikiId: number
}): Promise<{ nextForm: AdminCreateAnimeInput; nextMeta: AdminMeta; report: string }> {
	const a: any = await adminGetShikimoriAnime(params.shikiId)
	const malId = typeof a?.myanimelist_id === "number" ? a.myanimelist_id : typeof a?.mal_id === "number" ? a.mal_id : null
	const jikanData: any = typeof malId === "number" && malId > 0 ? await adminGetJikanAnimeData(malId) : null
	const result = await fillAnimeDraftFromShikimori({
		form: params.form,
		meta: params.meta,
		shikiAnime: a,
		api: {
			adminCreateStatus,
			adminCreateRating,
			adminCreateKind,
			adminCreateStudio,
			adminCreateSource,
			adminCreateProducer,
			adminCreateGenre,
			adminCreateTheme,
		},
		applyJikanMetaAndCommon: ensureJikanMeta,
		jikanData,
	})
	const report = result.missing.length ? `Не удалось заполнить: ${Array.from(new Set(result.missing)).join(", ")}` : "Все основные поля заполнены"
	return { nextForm: result.nextForm, nextMeta: result.nextMeta, report }
}

export async function resolveShikiIdByMalId(params: { malId: number; q: string }): Promise<number | null> {
	const items = await adminSearchShikimori(params.q)
	const match = items.find((x: any) => typeof x?.mal_id === "number" && x.mal_id === params.malId)
	return match && typeof match.id === "number" ? match.id : null
}

export async function fillDraftFromMalId(params: {
	form: AdminCreateAnimeInput
	meta: AdminMeta
	malId: number
	q: string
}): Promise<{ nextForm: AdminCreateAnimeInput; nextMeta: AdminMeta; report: string }> {
	const shikiId = await resolveShikiIdByMalId({ malId: params.malId, q: params.q })
	if (shikiId) {
		return fillDraftFromShikimoriId({ form: params.form, meta: params.meta, shikiId })
	}
	const { nextMeta, ensureStatus, ensureSource, ensureTheme, ensureRating, ensureStudio, ensureProducer, ensureGenre } = createMetaEnsurer(params.meta, {
		adminCreateStatus,
		adminCreateRating,
		adminCreateKind,
		adminCreateStudio,
		adminCreateSource,
		adminCreateProducer,
		adminCreateGenre,
		adminCreateTheme,
	})
	let jikanData: any = null
	jikanData = await adminGetJikanAnimeData(params.malId)
	let nextForm = applyJikanCommonToDraft({ form: params.form, jikanData })
	if (jikanData) {
		const enriched = await ensureJikanMeta({
			form: nextForm,
			meta: nextMeta,
			ensureStatus,
			ensureSource,
			ensureTheme,
			ensureRating,
			ensureStudio,
			ensureProducer,
			ensureGenre,
			jikanData,
		})
		nextForm = enriched.nextForm
		const report = enriched.missing.length ? `Не удалось заполнить: ${Array.from(new Set(enriched.missing)).join(", ")}` : "Все основные поля заполнены"
		return { nextForm, nextMeta: enriched.nextMeta, report }
	}
	return { nextForm, nextMeta, report: "Заполнены базовые поля" }
}
