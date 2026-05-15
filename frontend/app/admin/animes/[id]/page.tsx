"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Save, Image as ImageIcon, Plus, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  adminGetMeta,
  adminCreateGenre,
  adminCreateKind,
  adminCreateProducer,
  adminCreateRating,
  adminCreateSource,
  adminCreateStatus,
  adminCreateStudio,
  adminCreateEpisode,
  adminDeleteEpisode,
  adminUpdateEpisode,
  adminListVoiceGroups,
  adminCreateVoiceGroup,
  adminUpdateVoiceGroup,
  adminDeleteVoiceGroup,
  adminUpdateAnime,
	adminJikanGetAnime,
	adminKodikImportEpisodes,
  adminShikimoriGetAnime,
  getAnimeByID,
  getAnimeEpisodesFiltered,
  adminListVideoLabels,
  adminCreateVideoSource,
  adminUpdateVideoSource,
  adminDeleteVideoSource,
  adminSetDefaultVideoSource,
  type AdminCreateEpisodeRequest,
  type AdminUpsertEpisodeInput,
  type AdminUpsertVideoSourceInput,
  type AdminMeta,
  type Anime,
  type Episode,
  type VideoSource,
  type VideoLabel,
  type VoiceGroup,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { slugify } from "@/lib/slug"

function pickTranslation(anime: Anime, code: "ru" | "en") {
  return anime.translations?.find((t) => t.language.code === code)
}

export default function AdminEditAnimePage() {
  const params = useParams<{ id: string }>()
  const { user: me } = useAuth()
  const [meta, setMeta] = useState<AdminMeta | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
	const [shikiFillLoading, setShikiFillLoading] = useState(false)
	const [shikiFillReport, setShikiFillReport] = useState<string | null>(null)
	const [kodikLoading, setKodikLoading] = useState(false)
	const [kodikReport, setKodikReport] = useState<string | null>(null)

	const stripShikiBBCode = (input: string): string => {
		let s = String(input || "")
		s = s.replace(/\[br\]/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
		s = s.replace(/\[(character|person|anime|manga|ranobe|seyu)=\d+[^\]]*\]([\s\S]*?)\[\/(character|person|anime|manga|ranobe|seyu)\]/gi, "$2")
		s = s.replace(/\[\/?(b|i|u|s|spoiler|quote|url|center|left|right|color|size)[^\]]*\]/gi, "")
		s = s.replace(/\[[^\]]+\]/g, "")
		s = s.replace(/\n{3,}/g, "\n\n")
		return s.trim()
	}

	const uniqTitles = (items: string[]) => {
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
  const [genresMode, setGenresMode] = useState<"grid" | "list">("grid")
  const [genreQuery, setGenreQuery] = useState("")
  const [themesMode, setThemesMode] = useState<"grid" | "list">("grid")
  const [themeQuery, setThemeQuery] = useState("")

  const [episodes, setEpisodes] = useState<Episode[] | null>(null)
  const [episodeError, setEpisodeError] = useState<string | null>(null)
  const [episodeSaving, setEpisodeSaving] = useState(false)
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null)
  const [voiceGroups, setVoiceGroups] = useState<VoiceGroup[] | null>(null)
  const [episodesTab, setEpisodesTab] = useState<"voice_groups" | "episodes">("episodes")
  const [existingGroupsFilter, setExistingGroupsFilter] = useState<"all" | "dub" | "sub">("all")
  const [selectedGroupType, setSelectedGroupType] = useState<"dub" | "sub">("dub")
  const [newGroupName, setNewGroupName] = useState("")

  const [selectedEpisodeForSources, setSelectedEpisodeForSources] = useState<Episode | null>(null)
  const [videoLabels, setVideoLabels] = useState<VideoLabel[] | null>(null)
  const [episodeSourceForm, setEpisodeSourceForm] = useState<AdminUpsertVideoSourceInput>({
    label_id: null,
    label: "",
    type: "iframe",
    url: "",
		voice_group_id: null,
		is_integrated_player: false,
    is_default: true,
    is_active: true,
    sort_order: 0,
  })
	const [initialSourceCategory, setInitialSourceCategory] = useState<"dub" | "sub">("dub")
	const [editSourceCategory, setEditSourceCategory] = useState<"dub" | "sub">("dub")
  const [sourceForm, setSourceForm] = useState<AdminUpsertVideoSourceInput>({
    label_id: null,
    label: "",
    type: "iframe",
    url: "",
		voice_group_id: null,
		is_integrated_player: false,
    is_default: false,
    is_active: true,
    sort_order: 0,
  })
  const [editingSourceId, setEditingSourceId] = useState<number | null>(null)

  const [voiceGroupForm, setVoiceGroupForm] = useState<{ name: string; type: "dub" | "sub" }>({
    name: "",
    type: "dub",
  })
  const [editingVoiceGroupId, setEditingVoiceGroupId] = useState<number | null>(null)
  const [episodeForm, setEpisodeForm] = useState<AdminUpsertEpisodeInput>({
    number: 1,
    duration: 24,
		kind: "tv",
  })

  const [form, setForm] = useState({
    title_ru: "",
    title_en_romaji: "",
    alt_titles: [] as string[],
    description_ru: "",
    description_en: "",
    poster_url: "",
	background_url: "",
    trailer_url: "",
    gallery_urls: [] as string[],
    status_id: null as number | null,
    studio_id: null as number | null,
    producer_id: null as number | null,
		producer_ids: [] as number[],
    source_id: null as number | null,
		shikimori_id: null as number | null,
		mal_id: null as number | null,
		worldart_id: null as number | null,
		shiki_english: [] as string[],
		shiki_japanese: [] as string[],
		shiki_synonyms: [] as string[],
		shiki_fansubbers: [] as string[],
		shiki_fandubbers: [] as string[],
    genre_ids: [] as number[],
    theme_ids: [] as number[],
    kind: "tv",
    episodes_aired: 0,
    aired_on: "" as string,
    released_on: "" as string,
    episodes: 12,
    duration: 24,
    rating: "",
    score: 0,
  })

	const fillFromShikimori = async () => {
		const id = form.shikimori_id
		if (!id) return
		if (!meta) {
			setError("Metadata is not loaded yet")
			return
		}
		setShikiFillLoading(true)
		setError(null)
		setShikiFillReport(null)
		try {
			const a: any = await adminShikimoriGetAnime({ id })
			const missing: string[] = []
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
				const created = await adminCreateStatus({ name, ru_name: ruName ?? null })
				nextMeta.statuses.push(created)
				return created
			}
			const ensureRating = async (name: string) => {
				const key = norm(name)
				const found = nextMeta.ratings.find((x) => norm(x.name) === key)
				if (found) return found
				const created = await adminCreateRating({ name })
				nextMeta.ratings.push(created)
				return created
			}
			const ensureKind = async (name: string) => {
				const key = norm(name)
				const found = nextMeta.kinds.find((x) => norm(x.name) === key)
				if (found) return found
				const created = await adminCreateKind({ name, ru_name: null })
				nextMeta.kinds.push(created)
				return created
			}
			const ensureStudio = async (name: string) => {
				const key = norm(name)
				const found = nextMeta.studios.find((x) => norm(x.name) === key)
				if (found) return found
				const created = await adminCreateStudio({ name, ru_name: null })
				nextMeta.studios.push(created)
				return created
			}
			const ensureSource = async (name: string) => {
				const key = norm(name)
				const found = nextMeta.sources.find((x) => norm(x.name) === key)
				if (found) return found
				const created = await adminCreateSource({ name, ru_name: null })
				nextMeta.sources.push(created)
				return created
			}
			const ensureProducer = async (name: string) => {
				const key = norm(name)
				const found = nextMeta.producers.find((x) => norm(x.name) === key)
				if (found) return found
				const created = await adminCreateProducer({ name })
				nextMeta.producers.push(created)
				return created
			}
			const ensureGenre = async (name: string, ruName?: string) => {
				const key = norm(name)
				const found = nextMeta.genres.find((x) => norm(x.name) === key)
				if (found) return found
				const created = await adminCreateGenre({ name, ru_name: ruName ?? null })
				nextMeta.genres.push(created)
				return created
			}
			const pickedTrailer = (() => {
				const vids = Array.isArray(a?.videos) ? a.videos : []
				const pv = vids.find((v: any) => v?.kind === "pv" && typeof v?.player_url === "string") || vids.find((v: any) => typeof v?.player_url === "string")
				if (!pv) return ""
				const raw = String(pv.player_url || "").trim()
				if (!raw) return ""
				return raw.replace(/^http:\/\//, "https://")
			})()
			const ratingMap: Record<string, string> = { pg_13: "pg-13", r_17: "r-17+", r_plus: "r+" }
			const next = { ...form }
			if (!next.title_ru.trim() && typeof a?.russian === "string") next.title_ru = a.russian
			if (!next.title_en_romaji.trim() && typeof a?.name === "string") next.title_en_romaji = a.name
			if ((!next.kind || !next.kind.trim()) && typeof a?.kind === "string") next.kind = a.kind
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
			if ((next.score || 0) <= 0 && typeof a?.score === "string") {
				const f = Number.parseFloat(a.score)
				if (Number.isFinite(f)) next.score = f
			}
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
			if (typeof next.mal_id === "number" && next.mal_id > 0) {
				try {
					const j: any = await adminJikanGetAnime({ id: next.mal_id })
					const data: any = j?.data
					if ((!next.description_en || !next.description_en.trim()) && typeof data?.synopsis === "string" && data.synopsis.trim()) {
						next.description_en = data.synopsis
					}
					if (next.source_id == null && typeof data?.source === "string" && data.source.trim()) {
						try {
							const src = await ensureSource(String(data.source))
							next.source_id = src.id
						} catch {
							missing.push("source_id")
						}
					}
					if ((!next.producer_ids || next.producer_ids.length === 0) && Array.isArray(data?.producers) && data.producers.length) {
						const pids: number[] = []
						for (const pr of data.producers) {
							const pname = String(pr?.name || "").trim()
							if (!pname) continue
							try {
								const p = await ensureProducer(pname)
								pids.push(p.id)
							} catch {
								missing.push("producer_ids")
							}
						}
						if (pids.length) {
							next.producer_ids = Array.from(new Set(pids))
							next.producer_id = next.producer_ids[0]
						}
					}
				} catch {
					missing.push("mal")
				}
			}
			if (!next.poster_url && typeof a?.image?.original === "string") {
				const src = a.image.original
				next.poster_url = /^https?:\/\//.test(src) ? src : `https://shikimori.one${src}`
			}
			if ((!next.background_url || !next.background_url.trim()) && next.poster_url) next.background_url = next.poster_url
				if ((!next.description_ru || !next.description_ru.trim()) && typeof a?.description === "string") {
					next.description_ru = stripShikiBBCode(a.description)
				}
			if ((!next.trailer_url || !next.trailer_url.trim()) && pickedTrailer) next.trailer_url = pickedTrailer
			if ((!next.rating || !next.rating.trim()) && typeof a?.rating === "string") {
				const mapped = ratingMap[String(a.rating)] || String(a.rating)
				try {
					await ensureRating(mapped)
					next.rating = mapped
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
			if (!next.shiki_english?.length && Array.isArray(a?.english)) next.shiki_english = a.english.filter(Boolean)
			if (!next.shiki_japanese?.length && Array.isArray(a?.japanese)) next.shiki_japanese = a.japanese.filter(Boolean)
			if (!next.shiki_synonyms?.length && Array.isArray(a?.synonyms)) next.shiki_synonyms = a.synonyms.filter(Boolean)
			if (!next.shiki_fansubbers?.length && Array.isArray(a?.fansubbers)) next.shiki_fansubbers = a.fansubbers.filter(Boolean)
			if (!next.shiki_fandubbers?.length && Array.isArray(a?.fandubbers)) next.shiki_fandubbers = a.fandubbers.filter(Boolean)
				if ((next.alt_titles || []).length === 0) {
					const titles = uniqTitles([
						...(Array.isArray(a?.english) ? a.english : []),
						...(Array.isArray(a?.japanese) ? a.japanese : []),
						...(Array.isArray(a?.synonyms) ? a.synonyms : []),
					])
					const filtered = titles.filter((t) => t.toLowerCase() !== next.title_en_romaji.toLowerCase() && t.toLowerCase() !== next.title_ru.toLowerCase())
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
			setMeta(nextMeta)
			setForm(next)
			if (missing.length) setShikiFillReport(`Не удалось заполнить: ${Array.from(new Set(missing)).join(", ")}`)
			else setShikiFillReport("Все основные поля заполнены")
		} catch (e: any) {
			setError(e?.message || "Failed to fetch Shikimori")
		} finally {
			setShikiFillLoading(false)
		}
	}

	const importKodik = async (mode: "add" | "sync") => {
		if (!params?.id) return
		setKodikLoading(true)
		setKodikReport(null)
		setError(null)
		try {
			const res: any = await adminKodikImportEpisodes({ animeId: params.id, mode })
			setKodikReport(
				`Kodik: episodes +${res?.created_episodes || 0}, sources +${res?.created_sources || 0}, updated ${res?.updated_sources || 0}, translations ${res?.translations || 0}`
			)
			const [m, eps] = await Promise.all([
				adminGetMeta({}),
				getAnimeEpisodesFiltered({ idOrSlug: params.id }),
			])
			setMeta(m)
			setEpisodes(eps)
		} catch (e: any) {
			setError(e?.message || "Kodik import failed")
		} finally {
			setKodikLoading(false)
		}
	}

  const toDateInput = (value: any) => {
    if (!value) return ""
    const s = String(value)
    return s.length >= 10 ? s.slice(0, 10) : s
  }

  const slug = useMemo(() => slugify(form.title_en_romaji), [form.title_en_romaji])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [m, a, vl] = await Promise.all([adminGetMeta({}), getAnimeByID(params.id), adminListVideoLabels({})])
        if (!mounted) return
        setMeta(m)
        setVideoLabels(vl)

        const ru = pickTranslation(a, "ru")
        const en = pickTranslation(a, "en")
        setForm({
          title_ru: ru?.title || "",
          title_en_romaji: en?.title || a.name,
			  alt_titles: (a.alt_titles || []).map((x) => x.title),
          description_ru: ru?.description || "",
          description_en: en?.description || "",
          poster_url: a.image_url || a.image || "",
			  background_url: a.background_url || "",
          trailer_url: a.trailer_url || "",
          gallery_urls: (a.gallery_images || []).slice().sort((x: any, y: any) => (x.sort_order || 0) - (y.sort_order || 0)).map((x: any) => x.url).slice(0, 6),
          status_id: a.status_id ?? null,
          studio_id: a.studio_id ?? null,
          producer_id: a.producer_id ?? null,
			producer_ids: Array.isArray((a as any).producers)
				? (a as any).producers.map((x: any) => x.id).filter((x: any) => typeof x === "number")
				: a.producer_id != null
				? [a.producer_id]
				: [],
          source_id: a.source_id ?? null,
			  shikimori_id: a.shikimori_id ?? null,
			  mal_id: a.mal_id ?? null,
			  worldart_id: a.worldart_id ?? null,
			  shiki_english: Array.isArray((a as any).shiki_english) ? (a as any).shiki_english : [],
			  shiki_japanese: Array.isArray((a as any).shiki_japanese) ? (a as any).shiki_japanese : [],
			  shiki_synonyms: Array.isArray((a as any).shiki_synonyms) ? (a as any).shiki_synonyms : [],
			  shiki_fansubbers: Array.isArray((a as any).shiki_fansubbers) ? (a as any).shiki_fansubbers : [],
			  shiki_fandubbers: Array.isArray((a as any).shiki_fandubbers) ? (a as any).shiki_fandubbers : [],
          genre_ids: (a.genres || []).map((g) => g.id),
          theme_ids: (a.themes || []).map((t) => t.id),
          kind: a.kind || "tv",
          episodes_aired: a.episodes_aired || 0,
          aired_on: toDateInput(a.aired_on),
          released_on: toDateInput(a.released_on),
          episodes: a.episodes || 0,
          duration: a.duration || 0,
          rating: a.rating || "",
          score: a.score || 0,
        })
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load")
      }
    })()
    return () => {
      mounted = false
    }
  }, [params.id])


  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const groups = await adminListVoiceGroups({})
        if (mounted) setVoiceGroups(groups)
      } catch (e: any) {
        if (mounted) setEpisodeError(e.message || "Failed to load voice groups")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const dubVoiceGroups = useMemo(() => {
    return (voiceGroups || []).filter((g) => g.type === "dub")
  }, [voiceGroups])

  const subVoiceGroups = useMemo(() => {
    return (voiceGroups || []).filter((g) => g.type === "sub")
  }, [voiceGroups])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getAnimeEpisodesFiltered({ idOrSlug: params.id })
        if (mounted) setEpisodes(data)
      } catch (e: any) {
        if (mounted) setEpisodeError(e.message || "Failed to load episodes")
      }
    })()
    return () => {
      mounted = false
    }
  }, [params.id])

  const resetEpisodeForm = () => {
    setEditingEpisodeId(null)
    setEpisodeForm({
      number: 1,
      duration: 24,
      kind: "tv",
    })
    setInitialSourceCategory("dub")
    setEpisodeSourceForm({
      label_id: null,
      label: "",
      type: "iframe",
      url: "",
		voice_group_id: null,
		is_integrated_player: false,
      is_default: true,
      is_active: true,
      sort_order: 0,
    })
  }

  const startEditEpisode = (ep: Episode) => {
    setEditingEpisodeId(ep.id)
    setEpisodeForm({
      number: ep.number,
      duration: ep.duration || 0,
      kind: ep.kind || "tv",
    })
  }

  const quickAddGroup = async () => {
    if (me?.role === "moderator") {
      setEpisodeError("Moderators cannot manage voice groups")
      return
    }
    const name = newGroupName.trim()
    if (!name) return
    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      const created = await adminCreateVoiceGroup({
        input: { name, type: selectedGroupType },
      })
      setVoiceGroups((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      setNewGroupName("")
    } catch (e: any) {
      setEpisodeError(e.message || "Failed to create voice group")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const saveVoiceGroup = async () => {
    if (me?.role === "moderator") {
      setEpisodeError("Moderators cannot manage voice groups")
      return
    }
    const name = voiceGroupForm.name.trim()
    if (!name) return

    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      if (editingVoiceGroupId) {
        const updated = await adminUpdateVoiceGroup({
          id: String(editingVoiceGroupId),
          input: { name, type: voiceGroupForm.type },
        })
        setVoiceGroups((prev) => (prev ? prev.map((g) => (g.id === updated.id ? updated : g)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else {
        const created = await adminCreateVoiceGroup({
          input: { name, type: voiceGroupForm.type },
        })
        setVoiceGroups((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      }
      setVoiceGroupForm({ name: "", type: voiceGroupForm.type })
      setEditingVoiceGroupId(null)
    } catch (e: any) {
      setEpisodeError(e.message || "Failed to save voice group")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const startEditVoiceGroup = (g: VoiceGroup) => {
    setEpisodesTab("voice_groups")
    setEditingVoiceGroupId(g.id)
    setVoiceGroupForm({ name: g.name, type: g.type })
  }

  const deleteVoiceGroup = async (g: VoiceGroup) => {
    if (me?.role === "moderator") {
      setEpisodeError("Moderators cannot manage voice groups")
      return
    }
    const ok = window.confirm(`Delete voice group "${g.name}"? This will also delete related episodes.`)
    if (!ok) return

    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      await adminDeleteVoiceGroup({ id: String(g.id) })
      setVoiceGroups((prev) => (prev ? prev.filter((x) => x.id !== g.id) : prev))
      setEditingVoiceGroupId((prev) => (prev === g.id ? null : prev))
    } catch (e: any) {
      setEpisodeError(e.message || "Failed to delete voice group")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const saveEpisode = async () => {
    if (form.episodes <= 0) {
      setEpisodeError("Set total episodes on the anime first")
      return
    }
    if (episodeForm.number > form.episodes) {
      setEpisodeError("Episode number exceeds total episodes")
      return
    }

    const input: AdminUpsertEpisodeInput = { ...episodeForm }

    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      if (editingEpisodeId) {
        const updated = await adminUpdateEpisode({
          episodeId: String(editingEpisodeId),
          input,
        })
        setEpisodes((prev) => (prev ? prev.map((e) => (e.id === updated.id ? updated : e)).sort((a, b) => a.number - b.number) : prev))
      } else {
        const hasLabel = !!episodeSourceForm.label_id || !!episodeSourceForm.label?.trim()
        const hasUrl = !!episodeSourceForm.url?.trim()
        if (!hasLabel || !hasUrl) {
          setEpisodeError("Label and URL are required")
          setEpisodeSaving(false)
          return
        }
        if (!episodeSourceForm.is_integrated_player && !episodeSourceForm.voice_group_id) {
          setEpisodeError("Select Category and Voice group for non-integrated sources")
          setEpisodeSaving(false)
          return
        }

        const payload: AdminCreateEpisodeRequest = {
          episode: input,
          initial_source: {
            label_id: episodeSourceForm.label_id,
            label: episodeSourceForm.label,
            type: episodeSourceForm.type,
            url: episodeSourceForm.url,
            voice_group_id: episodeSourceForm.voice_group_id,
            is_integrated_player: episodeSourceForm.is_integrated_player,
            is_default: episodeSourceForm.is_default,
            is_active: episodeSourceForm.is_active,
            sort_order: episodeSourceForm.sort_order,
          },
        }

        const created = await adminCreateEpisode({
          animeId: params.id,
          input: payload,
        })
        setEpisodes((prev) => ([...(prev || []), created].sort((a, b) => a.number - b.number)))
      }
      resetEpisodeForm()
    } catch (e: any) {
      const msg = typeof e === "string" ? e : e?.message
      if (msg === "Anime not found") {
        setEpisodeError("Anime not found (try reloading this page)")
        return
      }
      if (msg === "Admin access required" || msg === "Invalid or expired token") {
        setEpisodeError("Authorization error (log out and log in again)")
        return
      }
      setEpisodeError(msg || "Failed to save episode")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const deleteEpisode = async (ep: Episode) => {
    if (me?.role === "moderator") return
    const ok = window.confirm(`Delete episode ${ep.number}?`)
    if (!ok) return
    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      await adminDeleteEpisode({ episodeId: String(ep.id) })
      setEpisodes((prev) => (prev ? prev.filter((x) => x.id !== ep.id) : prev))
      if (editingEpisodeId === ep.id) resetEpisodeForm()
      if (selectedEpisodeForSources?.id === ep.id) setSelectedEpisodeForSources(null)
    } catch (e: any) {
      setEpisodeError(e.message || "Failed to delete episode")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const saveSource = async () => {
    if (!selectedEpisodeForSources) return
    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      if (editingSourceId) {
        const updated = await adminUpdateVideoSource({
          sourceId: String(editingSourceId),
          input: sourceForm,
        })
        setSelectedEpisodeForSources((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            video_sources: (prev.video_sources || []).map((s) => (s.id === updated.id ? updated : s)),
          }
        })
      } else {
        const created = await adminCreateVideoSource({
          episodeId: String(selectedEpisodeForSources.id),
          input: sourceForm,
        })
        setSelectedEpisodeForSources((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            video_sources: [...(prev.video_sources || []), created],
          }
        })
      }
      setSourceForm({
        label_id: null,
        label: "",
        type: "iframe",
        url: "",
		voice_group_id: null,
		is_integrated_player: false,
        is_default: false,
        is_active: true,
        sort_order: 0,
      })
      setEditingSourceId(null)
    } catch (e: any) {
      setEpisodeError(e.message || "Failed to save video source")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const deleteSource = async (source: VideoSource) => {
    if (!selectedEpisodeForSources) return
    if (me?.role === "moderator") return
    if (selectedEpisodeForSources.video_sources?.length === 1) {
      setEpisodeError("Cannot delete the last source")
      return
    }
    const ok = window.confirm(`Delete source "${source.label}"?`)
    if (!ok) return

    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      await adminDeleteVideoSource({ sourceId: String(source.id) })
      setSelectedEpisodeForSources((prev) => {
        if (!prev) return prev
        const filtered = (prev.video_sources || []).filter((s) => s.id !== source.id)
        if (source.is_default && filtered.length > 0) {
          filtered[0].is_default = true
        }
        return { ...prev, video_sources: filtered }
      })
      if (editingSourceId === source.id) setEditingSourceId(null)
    } catch (e: any) {
      setEpisodeError(e.message || "Failed to delete source")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const setDefaultSource = async (sourceId: number) => {
    if (!selectedEpisodeForSources) return
    setEpisodeSaving(true)
    setEpisodeError(null)
    try {
      await adminSetDefaultVideoSource({ sourceId: String(sourceId) })
      setSelectedEpisodeForSources((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          video_sources: (prev.video_sources || []).map((s) => ({
            ...s,
            is_default: s.id === sourceId,
          })),
        }
      })
    } catch (e: any) {
      setEpisodeError(e.message || "Failed to set default source")
    } finally {
      setEpisodeSaving(false)
    }
  }

  const canSubmit = useMemo(() => {
    return !!form.title_ru.trim() && !!form.title_en_romaji.trim() && !!slug
  }, [form.title_en_romaji, form.title_ru, slug])

  const allGenres = meta?.genres || []
  const allThemes = meta?.themes || []

  const filteredGenres = useMemo(() => {
    const q = genreQuery.trim().toLowerCase()
    if (!q) return allGenres
    return allGenres.filter((g) => g.name.toLowerCase().includes(q))
  }, [allGenres, genreQuery])

  const selectedGenres = useMemo(() => {
    const selected = new Set(form.genre_ids)
    return allGenres.filter((g) => selected.has(g.id))
  }, [allGenres, form.genre_ids])

  const filteredThemes = useMemo(() => {
    const q = themeQuery.trim().toLowerCase()
    if (!q) return allThemes
    return allThemes.filter((x) => x.name.toLowerCase().includes(q))
  }, [allThemes, themeQuery])

  const selectedThemes = useMemo(() => {
    const selected = new Set(form.theme_ids)
    return allThemes.filter((x) => selected.has(x.id))
  }, [allThemes, form.theme_ids])

  const toggleGenre = (id: number) => {
    setForm((prev) => {
      const has = prev.genre_ids.includes(id)
      return {
        ...prev,
        genre_ids: has ? prev.genre_ids.filter((x) => x !== id) : [...prev.genre_ids, id],
      }
    })
  }

  const toggleTheme = (id: number) => {
    setForm((prev) => {
      const has = prev.theme_ids.includes(id)
      return {
        ...prev,
        theme_ids: has ? prev.theme_ids.filter((x) => x !== id) : [...prev.theme_ids, id],
      }
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsLoading(true)
    setError(null)
    try {
      await adminUpdateAnime({
        id: params.id,
        input: {
          kind: form.kind,
          duration: form.duration,
          rating: form.rating,
          episodes_aired: form.episodes_aired,
          aired_on: form.aired_on || undefined,
          released_on: form.released_on || undefined,
          trailer_url: form.trailer_url,
          score: form.score,
          episodes: form.episodes,
          poster_url: form.poster_url,
			  background_url: form.background_url,
          studio_id: form.studio_id,
          producer_id: form.producer_id,
			producer_ids: form.producer_ids,
          status_id: form.status_id,
          source_id: form.source_id,
			shikimori_id: form.shikimori_id,
			mal_id: form.mal_id,
			worldart_id: form.worldart_id,
			shiki_english: form.shiki_english,
			shiki_japanese: form.shiki_japanese,
			shiki_synonyms: form.shiki_synonyms,
			shiki_fansubbers: form.shiki_fansubbers,
			shiki_fandubbers: form.shiki_fandubbers,
          genre_ids: form.genre_ids,
          theme_ids: form.theme_ids,
          title_ru: form.title_ru,
          title_en_romaji: form.title_en_romaji,
          alt_titles: form.alt_titles,
          gallery_urls: form.gallery_urls,
          description_ru: form.description_ru,
          description_en: form.description_en,
        },
      })
      window.location.href = "/admin/animes"
    } catch (e: any) {
      setError(e.message || "Failed to save")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Anime</h1>
          <p className="text-sm text-foreground-muted">Update fields and translations (RU + Romaji)</p>
        </div>
        <Link
          href="/admin/animes"
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Link>
      </div>

      <form onSubmit={submit} className="mt-6">
        <div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Slug (URL)</label>
              <input
                value={slug}
                readOnly
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50 opacity-80"
              />
            </div>

			<div className="space-y-2">
				<label className="text-xs font-semibold text-foreground-muted">Shikimori ID (optional)</label>
				<div className="flex gap-2">
					<input
						type="number"
						value={form.shikimori_id ?? ""}
						onChange={(e) => {
							const v = e.target.value
							setForm((p) => ({ ...p, shikimori_id: v ? Number(v) : null }))
						}}
						className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
					/>
					<button
						type="button"
						onClick={fillFromShikimori}
						disabled={!form.shikimori_id || shikiFillLoading}
						className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
					>
						{shikiFillLoading ? "Filling…" : "Fill"}
					</button>
				</div>
				{shikiFillReport ? <div className="text-xs text-foreground-muted">{shikiFillReport}</div> : null}
			</div>

			<div className="space-y-2">
				<label className="text-xs font-semibold text-foreground-muted">MAL ID (optional)</label>
				<input
					type="number"
					value={form.mal_id ?? ""}
					onChange={(e) => {
						const v = e.target.value
						setForm((p) => ({ ...p, mal_id: v ? Number(v) : null }))
					}}
					className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
				/>
			</div>

			<div className="space-y-2">
				<label className="text-xs font-semibold text-foreground-muted">World-Art ID (optional)</label>
				<input
					type="number"
					value={form.worldart_id ?? ""}
					onChange={(e) => {
						const v = e.target.value
						setForm((p) => ({ ...p, worldart_id: v ? Number(v) : null }))
					}}
					className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
				/>
			</div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Poster URL</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <input
                  value={form.poster_url || ""}
                  onChange={(e) => setForm((p) => ({ ...p, poster_url: e.target.value }))}
                  placeholder="https://cdn.myanimelist.net/...jpg"
                  className="w-full h-11 rounded-xl bg-background border border-border/60 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>
            </div>

			<div className="space-y-2">
				<label className="text-xs font-semibold text-foreground-muted">Background URL</label>
				<div className="relative">
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle">
						<ImageIcon className="w-4 h-4" />
					</div>
					<input
						value={form.background_url || ""}
						onChange={(e) => setForm((p) => ({ ...p, background_url: e.target.value }))}
						placeholder="https://... (leave empty to use Poster URL)"
						className="w-full h-11 rounded-xl bg-background border border-border/60 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary/50"
					/>
				</div>
				<div className="text-[11px] text-foreground-subtle">Used for the blurred hero background (home + anime page). Defaults to Poster URL.</div>
			</div>

			<div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-foreground-muted">Trailer URL (optional)</label>
              <input
                value={form.trailer_url || ""}
                onChange={(e) => setForm((p) => ({ ...p, trailer_url: e.target.value }))}
                placeholder="https://www.youtube.com/embed/... or direct video url"
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Title (RU)</label>
              <input
                value={form.title_ru}
                onChange={(e) => setForm((p) => ({ ...p, title_ru: e.target.value }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Title (Romaji)</label>
              <input
                value={form.title_en_romaji}
                onChange={(e) => setForm((p) => ({ ...p, title_en_romaji: e.target.value }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

			<div className="space-y-2 lg:col-span-2">
				<div className="flex items-center justify-between gap-3">
					<label className="text-xs font-semibold text-foreground-muted">Alternative Titles (manual)</label>
					<button
						type="button"
								disabled={false}
						onClick={() =>
									setForm((p) => ({ ...p, alt_titles: [...p.alt_titles, ""] }))
						}
						className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground hover:border-primary/40 disabled:opacity-60 disabled:hover:border-border/60"
					>
						<Plus className="w-3.5 h-3.5" />
						Add
					</button>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{form.alt_titles.map((title, idx) => (
						<div key={idx} className="relative">
							<input
								value={title}
								onChange={(e) => {
									const v = e.target.value
									setForm((p) => {
										const next = p.alt_titles.slice()
										next[idx] = v
										return { ...p, alt_titles: next }
									})
								}}
								placeholder="e.g. Alternative name"
								className="w-full h-11 rounded-xl bg-background border border-border/60 pl-4 pr-10 text-sm text-foreground outline-none focus:border-primary/50"
							/>
							<button
								type="button"
								onClick={() =>
									setForm((p) => ({ ...p, alt_titles: p.alt_titles.filter((_, i) => i !== idx) }))
								}
								className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
								aria-label="Remove"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					))}
				</div>
				<div className="text-xs text-foreground-subtle">These titles are searched as-is (no translation).</div>
			</div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-foreground-muted">Description (RU)</label>
              <textarea
                value={form.description_ru || ""}
                onChange={(e) => setForm((p) => ({ ...p, description_ru: e.target.value }))}
                rows={8}
                className="w-full rounded-2xl bg-primary/5 border border-primary/30 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-foreground-muted">Description (Romaji)</label>
              <textarea
                value={form.description_en || ""}
                onChange={(e) => setForm((p) => ({ ...p, description_en: e.target.value }))}
                rows={8}
                className="w-full rounded-2xl bg-primary/5 border border-primary/30 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Status</label>
              <select
                value={form.status_id ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, status_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">Select…</option>
                {meta?.statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Studio</label>
              <select
                value={form.studio_id ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, studio_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">Select…</option>
                {meta?.studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Source</label>
              <select
                value={form.source_id ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, source_id: e.target.value ? Number(e.target.value) : null }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">Select…</option>
                {meta?.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Episodes</label>
              <input
                type="number"
                min={0}
                value={form.episodes ?? 0}
                onChange={(e) => setForm((p) => ({ ...p, episodes: Number(e.target.value) }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Episodes aired</label>
              <input
                type="number"
                min={0}
                value={form.episodes_aired ?? 0}
                onChange={(e) => setForm((p) => ({ ...p, episodes_aired: Number(e.target.value) }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Duration (min)</label>
              <input
                type="number"
                min={0}
                value={form.duration ?? 0}
                onChange={(e) => setForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Aired on</label>
              <input
                type="date"
                value={form.aired_on || ""}
                onChange={(e) => setForm((p) => ({ ...p, aired_on: e.target.value }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Released on</label>
              <input
                type="date"
                value={form.released_on || ""}
                onChange={(e) => setForm((p) => ({ ...p, released_on: e.target.value }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Kind</label>
              <select
                value={form.kind || ""}
                onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">Select…</option>
                {(meta?.kinds || []).map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Rating</label>
              <select
                value={form.rating || ""}
                onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">Select…</option>
                {(meta?.ratings || []).map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-foreground-muted">Genres</label>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-1">
                {([
                  { key: "grid" as const, label: "Grid" },
                  { key: "list" as const, label: "List" },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setGenresMode(t.key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      genresMode === t.key
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {genresMode === "grid" ? (
                <div className="rounded-xl border border-border/60 bg-background p-3 max-h-48 overflow-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allGenres.map((g) => {
                      const active = form.genre_ids.includes(g.id)
                      return (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => toggleGenre(g.id)}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm border transition-colors",
                            active
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                          )}
                        >
                          <span className="truncate">{g.name}</span>
                          <span className={cn("text-xs", active ? "text-primary" : "text-foreground-subtle")}>#{g.id}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <input
                        value={genreQuery}
                        onChange={(e) => setGenreQuery(e.target.value)}
                        placeholder="Search genres…"
                        className="w-full h-10 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                      />
                      <div className="rounded-xl border border-border/60 bg-background-secondary/20 max-h-56 overflow-auto p-2">
                        <div className="space-y-1">
                          {filteredGenres.map((g) => {
                            const active = form.genre_ids.includes(g.id)
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => toggleGenre(g.id)}
                                className={cn(
                                  "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm border transition-colors",
                                  active
                                    ? "border-primary/40 bg-primary/10 text-foreground"
                                    : "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                                )}
                              >
                                <span className="truncate">{g.name}</span>
                                <span className={cn("text-xs", active ? "text-primary" : "text-foreground-subtle")}>#{g.id}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-foreground-muted">Selected</div>
                      <div className="rounded-xl border border-border/60 bg-background-secondary/20 min-h-14 p-3">
                        {selectedGenres.length === 0 ? (
                          <div className="text-sm text-foreground-muted">No genres selected.</div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedGenres.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => toggleGenre(g.id)}
                                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground hover:bg-background-tertiary/30"
                              >
                                <span>{g.name}</span>
                                <span className="text-xs text-red-400">Remove</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Themes</label>
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-1">
                  {([
                    { key: "grid" as const, label: "Grid" },
                    { key: "list" as const, label: "List" },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setThemesMode(t.key)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                        themesMode === t.key
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {themesMode === "grid" ? (
                  <div className="rounded-xl border border-border/60 bg-background p-3 max-h-48 overflow-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allThemes.map((x) => {
                        const active = form.theme_ids.includes(x.id)
                        return (
                          <button
                            type="button"
                            key={x.id}
                            onClick={() => toggleTheme(x.id)}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm border transition-colors",
                              active
                                ? "border-primary/40 bg-primary/10 text-foreground"
                                : "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                            )}
                          >
                            <span className="truncate">{x.name}</span>
                            <span className={cn("text-xs", active ? "text-primary" : "text-foreground-subtle")}>#{x.id}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-background p-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <input
                          value={themeQuery}
                          onChange={(e) => setThemeQuery(e.target.value)}
                          placeholder="Search themes…"
                          className="w-full h-10 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                        />
                        <div className="rounded-xl border border-border/60 bg-background-secondary/20 max-h-56 overflow-auto p-2">
                          <div className="space-y-1">
                            {filteredThemes.map((x) => {
                              const active = form.theme_ids.includes(x.id)
                              return (
                                <button
                                  key={x.id}
                                  type="button"
                                  onClick={() => toggleTheme(x.id)}
                                  className={cn(
                                    "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm border transition-colors",
                                    active
                                      ? "border-primary/40 bg-primary/10 text-foreground"
                                      : "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                                  )}
                                >
                                  <span className="truncate">{x.name}</span>
                                  <span className={cn("text-xs", active ? "text-primary" : "text-foreground-subtle")}>#{x.id}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground-muted">Selected</div>
                        <div className="rounded-xl border border-border/60 bg-background-secondary/20 min-h-14 p-3">
                          {selectedThemes.length === 0 ? (
                            <div className="text-sm text-foreground-muted">No themes selected.</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {selectedThemes.map((x) => (
                                <button
                                  key={x.id}
                                  type="button"
                                  onClick={() => toggleTheme(x.id)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground hover:bg-background-tertiary/30"
                                >
                                  <span>{x.name}</span>
                                  <span className="text-xs text-red-400">Remove</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

			  <div className="mt-4 space-y-3">
				<div className="flex items-center justify-between gap-3">
					<div className="text-xs font-semibold text-foreground-muted">Gallery (manual, up to 6)</div>
					<button
						type="button"
						disabled={form.gallery_urls.length >= 6}
						onClick={() =>
							setForm((p) => ({
								...p,
								gallery_urls: p.gallery_urls.length >= 6 ? p.gallery_urls : [...p.gallery_urls, ""],
							}))
						}
						className={cn(
							"inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold",
							form.gallery_urls.length >= 6
								? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
								: "bg-primary text-primary-foreground hover:bg-primary/90"
						)}
					>
						+
					</button>
				</div>
				<div className="text-[11px] text-foreground-subtle">Add image links gradually. Poster URL is not added automatically.</div>
				{form.gallery_urls.length === 0 ? (
					<div className="rounded-xl border border-border/60 bg-background p-3 text-sm text-foreground-muted">No gallery images.</div>
				) : (
					<div className="space-y-2">
						{form.gallery_urls.map((u, idx) => (
							<div key={idx} className="flex items-center gap-2">
								<input
									value={u}
									onChange={(e) =>
										setForm((p) => {
											const next = p.gallery_urls.slice()
											next[idx] = e.target.value
											return { ...p, gallery_urls: next }
										})
									}
									placeholder="https://..."
									className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
								/>
								<button
									type="button"
									onClick={() => setForm((p) => ({ ...p, gallery_urls: p.gallery_urls.filter((_, i) => i !== idx) }))}
									className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-red-300 hover:bg-background-tertiary/30"
								>
									Remove
								</button>
							</div>
						))}
					</div>
				)}
			  </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Link
              href="/admin/animes"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border/60 bg-background px-5 py-2.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className={cn(
                "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
                !canSubmit || isLoading
                  ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8 rounded-2xl border border-border/60 bg-background-secondary/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Episodes</h2>
            <p className="text-sm text-foreground-muted">Select voice group, then add or edit episodes</p>
          </div>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => importKodik("add")}
					disabled={kodikLoading || !form.shikimori_id}
					className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
				>
					{kodikLoading ? "Working…" : "Add Kodik"}
				</button>
				<button
					type="button"
					onClick={() => importKodik("sync")}
					disabled={kodikLoading || !form.shikimori_id}
					className="rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground disabled:opacity-50"
				>
					Sync Kodik
				</button>
				{editingEpisodeId && (
					<button
						type="button"
						onClick={resetEpisodeForm}
						className="rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground"
					>
						Cancel edit
					</button>
				)}
			</div>
        </div>
		{kodikReport ? <div className="mt-2 text-xs text-foreground-muted">{kodikReport}</div> : null}

        {episodeError && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {episodeError}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background p-1">
          {(me?.role === "moderator"
            ? ([{ key: "episodes" as const, label: "Episode Manager" }] as const)
            : ([
                { key: "voice_groups" as const, label: "Voice Groups" },
                { key: "episodes" as const, label: "Episode Manager" },
              ] as const)
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setEpisodesTab(t.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                episodesTab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {episodesTab === "voice_groups" && me?.role !== "moderator" ? (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">{editingVoiceGroupId ? "Edit Voice Group" : "Add Voice Group"}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground-muted">Name</label>
                  <input
                    value={voiceGroupForm.name}
                    onChange={(e) => setVoiceGroupForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={voiceGroupForm.type === "dub" ? "e.g., Anidub" : "e.g., Crunchyroll"}
                    className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="text-xs font-semibold text-foreground-muted">Type</div>
                  <div className="flex items-center gap-2">
                    {([
                      { key: "dub" as const, label: "Dubbed" },
                      { key: "sub" as const, label: "Subbed" },
                    ] as const).map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setVoiceGroupForm((p) => ({ ...p, type: t.key }))}
                        className={cn(
                          "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                          voiceGroupForm.type === t.key
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                {editingVoiceGroupId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVoiceGroupId(null)
                      setVoiceGroupForm({ name: "", type: voiceGroupForm.type })
                    }}
                    className="rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={saveVoiceGroup}
                  disabled={!voiceGroupForm.name.trim() || episodeSaving}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-semibold",
                    !voiceGroupForm.name.trim() || episodeSaving
                      ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {episodeSaving ? "Saving…" : editingVoiceGroupId ? "Save Group" : "Add Group"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Existing Voice Groups</h3>
              {voiceGroups === null ? (
                <div className="text-sm text-foreground-muted">Loading…</div>
              ) : (voiceGroups || []).length === 0 ? (
                <div className="text-sm text-foreground-muted">No voice groups yet.</div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-1">
                    {([
                      { key: "all" as const, label: "All" },
                      { key: "dub" as const, label: "Dubbed" },
                      { key: "sub" as const, label: "Subbed" },
                    ] as const).map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setExistingGroupsFilter(t.key)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                          existingGroupsFilter === t.key
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground-muted">Dub groups</div>
                      <div className="text-xs text-foreground-subtle">{dubVoiceGroups.length}</div>
                    </div>
                    {existingGroupsFilter === "sub" ? null : dubVoiceGroups.length === 0 ? (
                      <div className="text-sm text-foreground-muted">No dub groups.</div>
                    ) : (
                      <div className="space-y-2">
                        {dubVoiceGroups.map((g) => (
                          <div key={g.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background-secondary/30 px-4 py-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-foreground truncate">{g.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditVoiceGroup(g)}
                                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteVoiceGroup(g)}
                                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground-muted">Sub groups</div>
                      <div className="text-xs text-foreground-subtle">{subVoiceGroups.length}</div>
                    </div>
                    {existingGroupsFilter === "dub" ? null : subVoiceGroups.length === 0 ? (
                      <div className="text-sm text-foreground-muted">No sub groups.</div>
                    ) : (
                      <div className="space-y-2">
                        {subVoiceGroups.map((g) => (
                          <div key={g.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background-secondary/30 px-4 py-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-foreground truncate">{g.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditVoiceGroup(g)}
                                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteVoiceGroup(g)}
                                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {editingEpisodeId ? `Edit Episode #${episodeForm.number}` : "Add Episode"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Episode Number</label>
                <input
                  type="number"
                  min={1}
                  value={episodeForm.number}
                  onChange={(e) => setEpisodeForm((p) => ({ ...p, number: Number(e.target.value) }))}
                  className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Duration (sec)</label>
                <input
                  type="number"
                  min={0}
                  value={episodeForm.duration || 0}
                  onChange={(e) => setEpisodeForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                  className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>
			  <div className="space-y-2 sm:col-span-2">
				<label className="text-xs font-semibold text-foreground-muted">Type</label>
				<select
					value={episodeForm.kind || "tv"}
					onChange={(e) => setEpisodeForm((p) => ({ ...p, kind: e.target.value }))}
					className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
				>
					{(["tv", "ova", "ona", "special", "movie"] as const).map((k) => (
						<option key={k} value={k}>
							{k.toUpperCase()}
						</option>
					))}
				</select>
			  </div>
            </div>

            {!editingEpisodeId && (
              <div className="mt-5 rounded-xl border border-border/60 bg-background-secondary/20 p-4">
                <div className="text-xs font-semibold text-foreground-muted mb-3">Source (required)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2 sm:col-span-2">
						<label className="flex items-center gap-2 cursor-pointer group">
							<input
								type="checkbox"
								checked={!!episodeSourceForm.is_integrated_player}
								onChange={(e) =>
									setEpisodeSourceForm((p) => ({
										...p,
										is_integrated_player: e.target.checked,
										voice_group_id: e.target.checked ? null : p.voice_group_id,
									}))
								}
								className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
							/>
							<span className="text-xs font-semibold text-foreground-muted group-hover:text-foreground">
								Dub & Sub integrated in player
							</span>
						</label>
						<div className="text-[11px] text-foreground-subtle">
							{episodeSourceForm.is_integrated_player
								? "If enabled, Category/Team is not required and Dub/Sub selection is hidden on the watch page."
								: "If disabled, Category and Voice group are required for this source."}
						</div>
					</div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground-muted">Label</label>
                    <select
                      value={episodeSourceForm.label_id ? String(episodeSourceForm.label_id) : ""}
                      onChange={(e) =>
                        setEpisodeSourceForm((p) => ({
                          ...p,
                          label_id: e.target.value ? Number(e.target.value) : null,
                          label: "",
                        }))
                      }
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    >
                      <option value="">Select label…</option>
                      {(videoLabels || []).map((l) => (
                        <option key={l.id} value={String(l.id)}>
                          {l.name}{l.is_external_player ? " (External)" : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      value={episodeSourceForm.label || ""}
                      onChange={(e) =>
                        setEpisodeSourceForm((p) => ({
                          ...p,
                          label: e.target.value,
                          label_id: e.target.value.trim() ? null : p.label_id,
                        }))
                      }
                      placeholder="Or type a new label (e.g., Kodik)"
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground-muted">Type</label>
                    <select
                      value={episodeSourceForm.type}
                      onChange={(e) => setEpisodeSourceForm((p) => ({ ...p, type: e.target.value as "iframe" | "direct" }))}
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    >
                      <option value="iframe">Iframe Embed</option>
                      <option value="direct">Direct (Artplayer)</option>
                    </select>
                  </div>
					{episodeSourceForm.is_integrated_player ? null : (
						<div className="space-y-2">
							<label className="text-xs font-semibold text-foreground-muted">Category</label>
							<div className="flex items-center gap-2">
								{([
									{ key: "dub" as const, label: "Dubbed" },
									{ key: "sub" as const, label: "Subbed" },
								] as const).map((t) => (
									<button
										key={t.key}
										type="button"
										onClick={() => {
											setInitialSourceCategory(t.key)
											const list = (voiceGroups || []).filter((g) => g.type === t.key)
											setEpisodeSourceForm((p) => ({ ...p, voice_group_id: list[0]?.id || null }))
										}}
										className={cn(
											"rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
											initialSourceCategory === t.key
												? "border-primary/40 bg-primary/10 text-foreground"
												: "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
										)}
									>
										{t.label}
									</button>
								))}
							</div>
							<label className="text-xs font-semibold text-foreground-muted">Voice group</label>
							<select
								value={episodeSourceForm.voice_group_id ? String(episodeSourceForm.voice_group_id) : ""}
								onChange={(e) =>
									setEpisodeSourceForm((p) => ({
										...p,
										voice_group_id: e.target.value ? Number(e.target.value) : null,
									}))
								}
								className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
							>
								<option value="">Select…</option>
								{(voiceGroups || [])
									.filter((g) => g.type === initialSourceCategory)
									.map((g) => (
										<option key={g.id} value={String(g.id)}>
											{g.name}
										</option>
									))}
							</select>
						</div>
					)}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground-muted">URL</label>
                    <input
                      value={episodeSourceForm.url}
                      onChange={(e) => setEpisodeSourceForm((p) => ({ ...p, url: e.target.value }))}
                      placeholder="https://…"
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={episodeSourceForm.is_active}
                        onChange={(e) => setEpisodeSourceForm((p) => ({ ...p, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
                      />
                      <span className="text-xs font-semibold text-foreground-muted group-hover:text-foreground">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={episodeSourceForm.is_default}
                        onChange={(e) => setEpisodeSourceForm((p) => ({ ...p, is_default: e.target.checked }))}
                        className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
                      />
                      <span className="text-xs font-semibold text-foreground-muted group-hover:text-foreground">Default</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={saveEpisode}
                disabled={episodeSaving}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold",
                  episodeSaving
                    ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {episodeSaving ? "Saving…" : editingEpisodeId ? "Save Episode" : "Add Episode"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Existing Episodes</h3>
            {episodes === null ? (
              <div className="text-sm text-foreground-muted">Loading…</div>
            ) : episodes.length === 0 ? (
              <div className="text-sm text-foreground-muted">No episodes yet.</div>
            ) : (
              <div className="space-y-2">
                {episodes.map((ep) => (
                  <div key={ep.id} className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background-secondary/30 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">Episode {ep.number}</div>
                        <div className="text-xs text-foreground-muted truncate">{(ep.video_sources || []).length} sources</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
							setSelectedEpisodeForSources(ep)
							setEditingSourceId(null)
						}}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                            selectedEpisodeForSources?.id === ep.id
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border/60 bg-background text-foreground-muted hover:text-foreground"
                          )}
                        >
                          Sources
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditEpisode(ep)}
                          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEpisode(ep)}
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedEpisodeForSources && (
          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Video Sources for Episode #{selectedEpisodeForSources.number}</h3>
                <p className="text-sm text-foreground-muted">Manage multiple servers/players for this episode</p>
              </div>
              <button
                type="button"
                onClick={() => {
					setSelectedEpisodeForSources(null)
					setEditingSourceId(null)
				}}
                className="text-foreground-muted hover:text-foreground text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{editingSourceId ? "Edit Source" : "Add New Source"}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground-muted">Label</label>
                    <select
                      value={sourceForm.label_id ? String(sourceForm.label_id) : ""}
                      onChange={(e) =>
                        setSourceForm((p) => ({
                          ...p,
                          label_id: e.target.value ? Number(e.target.value) : null,
                          label: "",
                        }))
                      }
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    >
                      <option value="">Select label…</option>
                      {(videoLabels || []).map((l) => (
                        <option key={l.id} value={String(l.id)}>
                          {l.name}{l.is_external_player ? " (External)" : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      value={sourceForm.label || ""}
                      onChange={(e) =>
                        setSourceForm((p) => ({
                          ...p,
                          label: e.target.value,
                          label_id: e.target.value.trim() ? null : p.label_id,
							is_integrated_player: e.target.value.trim() ? false : p.is_integrated_player,
                        }))
                      }
                      placeholder="Or type a new label (e.g., Kodik)"
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                    {sourceForm.label_id ? (
                      <div className="text-[11px] text-foreground-subtle">
                        {(videoLabels || []).find((x) => x.id === sourceForm.label_id)?.is_external_player
                          ? "External player: Dub/Sub selection will be hidden on Watch page."
                          : "Standard player: Dub/Sub selection remains available."
                        }
                      </div>
                    ) : sourceForm.label?.trim() ? (
                      <div className="text-[11px] text-foreground-subtle">
                        New label will be created automatically. External flag defaults to Standard.
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
						<label className="flex items-center gap-2 cursor-pointer group">
							<input
								type="checkbox"
								checked={!!sourceForm.is_integrated_player}
								onChange={(e) => {
									const next = e.target.checked
									setSourceForm((p) => ({
										...p,
										is_integrated_player: next,
										voice_group_id: next ? null : p.voice_group_id,
									}))
								}}
								className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
							/>
							<span className="text-xs font-semibold text-foreground-muted group-hover:text-foreground">
								Dub & Sub integrated in player
							</span>
						</label>
						{sourceForm.is_integrated_player ? (
							<div className="text-[11px] text-foreground-subtle">Category/Team is not required for integrated sources.</div>
						) : (
							<div className="space-y-2">
								<label className="text-xs font-semibold text-foreground-muted">Category</label>
								<div className="flex items-center gap-2">
									{([
										{ key: "dub" as const, label: "Dubbed" },
										{ key: "sub" as const, label: "Subbed" },
									] as const).map((t) => (
										<button
											key={t.key}
											type="button"
											onClick={() => {
												setEditSourceCategory(t.key)
												const list = (voiceGroups || []).filter((g) => g.type === t.key)
												setSourceForm((p) => ({ ...p, voice_group_id: list[0]?.id || null }))
											}}
											className={cn(
												"rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
												editSourceCategory === t.key
													? "border-primary/40 bg-primary/10 text-foreground"
													: "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
											)}
										>
											{t.label}
										</button>
									))}
								</div>
								<label className="text-xs font-semibold text-foreground-muted">Voice group</label>
								<select
									value={sourceForm.voice_group_id ? String(sourceForm.voice_group_id) : ""}
									onChange={(e) => setSourceForm((p) => ({ ...p, voice_group_id: e.target.value ? Number(e.target.value) : null }))}
									className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
								>
									<option value="">Select…</option>
									{(voiceGroups || [])
										.filter((g) => g.type === editSourceCategory)
										.map((g) => (
											<option key={g.id} value={String(g.id)}>
												{g.name}
											</option>
										))}
								</select>
							</div>
						)}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground-muted">Type</label>
                    <select
                      value={sourceForm.type}
                      onChange={(e) => setSourceForm((p) => ({ ...p, type: e.target.value as "iframe" | "direct" }))}
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    >
                      <option value="iframe">Iframe Embed</option>
                      <option value="direct">Direct (Artplayer)</option>
                    </select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground-muted">URL</label>
                    <input
                      value={sourceForm.url}
                      onChange={(e) => setSourceForm((p) => ({ ...p, url: e.target.value }))}
                      placeholder="https://…"
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground-muted">Order</label>
                    <input
                      type="number"
                      value={sourceForm.sort_order}
                      onChange={(e) => setSourceForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={sourceForm.is_active}
                        onChange={(e) => setSourceForm((p) => ({ ...p, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
                      />
                      <span className="text-xs font-semibold text-foreground-muted group-hover:text-foreground">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={sourceForm.is_default}
                        onChange={(e) => setSourceForm((p) => ({ ...p, is_default: e.target.checked }))}
                        className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
                      />
                      <span className="text-xs font-semibold text-foreground-muted group-hover:text-foreground">Default</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  {editingSourceId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSourceId(null)
						setEditSourceCategory("dub")
						setSourceForm({ label_id: null, label: "", type: "iframe", url: "", voice_group_id: null, is_integrated_player: false, is_default: false, is_active: true, sort_order: 0 })
                      }}
                      className="px-4 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveSource}
                    disabled={
						  (!sourceForm.label_id && !sourceForm.label?.trim()) ||
						  !sourceForm.url.trim() ||
						  (!sourceForm.is_integrated_player && !sourceForm.voice_group_id) ||
						  episodeSaving
						}
                    className={cn(
                      "rounded-xl px-5 py-2.5 text-sm font-semibold",
                      (!sourceForm.label_id && !sourceForm.label?.trim()) ||
						  !sourceForm.url.trim() ||
						  (!sourceForm.is_integrated_player && !sourceForm.voice_group_id) ||
						  episodeSaving
                        ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {episodeSaving ? "Saving…" : editingSourceId ? "Save Source" : "Add Source"}
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Current Sources</h4>
                <div className="space-y-3">
                  {(selectedEpisodeForSources.video_sources || []).map((s) => (
                    <div key={s.id} className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border p-4",
                      s.is_default ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background"
                    )}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{s.label}</span>
                          {s.is_default && <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Default</span>}
                          {!s.is_active && <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Inactive</span>}
                        </div>
                        <div className="text-xs text-foreground-muted truncate mt-1">{s.type} • {s.url}</div>
					<div className="text-[11px] text-foreground-subtle mt-1">
						{s.is_integrated_player ? "Dub & Sub integrated" : s.audio === "dub" ? "Dubbed" : "Subbed"}
					</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!s.is_default && (
                          <button
                            type="button"
                            onClick={() => setDefaultSource(s.id)}
                            className="p-2 text-foreground-muted hover:text-primary transition-colors"
                            title="Set as Default"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSourceId(s.id)
                            const guessed = (videoLabels || []).find((x) => x.name === s.label)?.id || null
                            setSourceForm({
                              label_id: s.label_id || guessed,
                              label: s.label_id || guessed ? "" : s.label,
                              type: s.type,
                              url: s.url,
							  voice_group_id: s.voice_group_id || s.voice_group?.id || null,
							  is_integrated_player: !!s.is_integrated_player,
                              is_default: s.is_default,
                              is_active: s.is_active,
                              sort_order: s.sort_order,
                            })
							setEditSourceCategory((s.voice_group?.type || (s.audio === "sub" ? "sub" : "dub")) as "dub" | "sub")
                          }}
                          className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSource(s)}
                          className="p-2 text-foreground-muted hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
