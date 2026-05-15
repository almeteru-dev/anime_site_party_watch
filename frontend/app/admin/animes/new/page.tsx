"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Image as ImageIcon, Plus, X } from "lucide-react"
import {
	adminCreateAnime,
	adminCreateGenre,
	adminCreateKind,
	adminCreateProducer,
	adminCreateRating,
	adminCreateSource,
	adminCreateStatus,
	adminCreateStudio,
	adminCreateTheme,
	adminGetMeta,
	adminJikanGetAnime,
	adminShikimoriGetAnime,
	adminShikimoriSearch,
	type AdminCreateAnimeInput,
	type AdminMeta,
	type ShikimoriAnimeSearchItem,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { slugify } from "@/lib/slug"

export default function AdminAddAnimePage() {
  const [meta, setMeta] = useState<AdminMeta | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingAnime, setExistingAnime] = useState<{ id: number; url?: string; name?: string } | null>(null)
  const [genresMode, setGenresMode] = useState<"grid" | "list">("grid")
  const [genreQuery, setGenreQuery] = useState("")
  const [themesMode, setThemesMode] = useState<"grid" | "list">("grid")
  const [themeQuery, setThemeQuery] = useState("")
	const [producerQuery, setProducerQuery] = useState("")
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
	const [shikiQuery, setShikiQuery] = useState("")
	const [shikiLoading, setShikiLoading] = useState(false)
	const [shikiFillLoading, setShikiFillLoading] = useState(false)
	const [shikiFillReport, setShikiFillReport] = useState<string | null>(null)
	type ShikiState = { items: ShikimoriAnimeSearchItem[]; error: string | null }
	const [shiki, setShiki] = useState<ShikiState>({ items: [], error: null })

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

  const [form, setForm] = useState<AdminCreateAnimeInput>({
    url: "",
    title_ru: "",
    title_en_romaji: "",
    alt_titles: [],
    description_ru: "",
    description_en: "",
    poster_url: "",
		background_url: "",
    trailer_url: "",
    status_id: null,
    studio_id: null,
		producer_ids: [],
    producer_id: null,
    source_id: null,
		shikimori_id: null,
		mal_id: null,
		worldart_id: null,
    genre_ids: [],
    theme_ids: [],
    kind: "tv",
    rating: "",
		episodes: 0,
    episodes_aired: 0,
    aired_on: "",
    released_on: "",
		duration: 0,
  })

	const runShikiSearch = async () => {
		const q = shikiQuery.trim()
		if (!q) return
		setShikiLoading(true)
		setShiki({ items: [], error: null })
		try {
			const res = await adminShikimoriSearch({ q })
			setShiki({ items: res.items || [], error: null })
		} catch (e: any) {
			setShiki({ items: [], error: e?.message || "Failed to search Shikimori" })
		} finally {
			setShikiLoading(false)
		}
	}


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
			const ensureTheme = async (name: string) => {
				const key = norm(name)
				const found = nextMeta.themes.find((x) => norm(x.name) === key)
				if (found) return found
				const created = await adminCreateTheme({ name, ru_name: null })
				nextMeta.themes.push(created)
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
			const next: AdminCreateAnimeInput = { ...form }
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
					if ((next.theme_ids || []).length === 0 && Array.isArray(data?.themes) && data.themes.length) {
						const tids: number[] = []
						for (const t of data.themes) {
							const tname = String(t?.name || "").trim()
							if (!tname) continue
							try {
								const th = await ensureTheme(tname)
								tids.push(th.id)
							} catch {
								missing.push("theme_ids")
							}
						}
						if (tids.length) next.theme_ids = Array.from(new Set(tids))
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
			if ((!next.gallery_urls || next.gallery_urls.length === 0) && Array.isArray(a?.screenshots)) {
				const imgs = a.screenshots
					.map((x: any) => x?.original)
					.filter((x: any) => typeof x === "string" && x.trim())
					.slice(0, 6)
				if (imgs.length) next.gallery_urls = imgs.map((src: string) => (/^https?:\/\//.test(src) ? src : `https://shikimori.one${src}`))
				else missing.push("gallery_urls")
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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminGetMeta({})
        if (mounted) setMeta(data)
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load metadata")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setForm((p) => ({ ...p, url: slugify(p.title_en_romaji) }))
  }, [form.title_en_romaji])

  const canSubmit = useMemo(() => {
    return !!form.url.trim() && !!form.title_ru.trim() && !!form.title_en_romaji.trim()
  }, [form.title_en_romaji, form.title_ru, form.url])

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

	const toggleProducer = (id: number) => {
		setForm((prev) => {
			const has = (prev.producer_ids || []).includes(id)
			const nextIds = has ? (prev.producer_ids || []).filter((x) => x !== id) : [...(prev.producer_ids || []), id]
			return {
				...prev,
				producer_ids: nextIds,
				producer_id: nextIds.length ? nextIds[0] : null,
			}
		})
	}

  const allGenres = meta?.genres || []

  const filteredGenres = useMemo(() => {
    const q = genreQuery.trim().toLowerCase()
    if (!q) return allGenres
    return allGenres.filter((g) => g.name.toLowerCase().includes(q))
  }, [allGenres, genreQuery])

  const selectedGenres = useMemo(() => {
    const selected = new Set(form.genre_ids)
    return allGenres.filter((g) => selected.has(g.id))
  }, [allGenres, form.genre_ids])

  const allThemes = meta?.themes || []

  const filteredThemes = useMemo(() => {
    const q = themeQuery.trim().toLowerCase()
    if (!q) return allThemes
    return allThemes.filter((x) => x.name.toLowerCase().includes(q))
  }, [allThemes, themeQuery])

  const selectedThemes = useMemo(() => {
    const selected = new Set(form.theme_ids)
    return allThemes.filter((x) => selected.has(x.id))
  }, [allThemes, form.theme_ids])

	const allProducers = meta?.producers || []

	const filteredProducers = useMemo(() => {
		const q = producerQuery.trim().toLowerCase()
		if (!q) return allProducers
		return allProducers.filter((p) => p.name.toLowerCase().includes(q))
	}, [allProducers, producerQuery])

	const selectedProducers = useMemo(() => {
		const selected = new Set(form.producer_ids || [])
		return allProducers.filter((p) => selected.has(p.id))
	}, [allProducers, form.producer_ids])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    if (!form.title_ru.trim() || !form.title_en_romaji.trim()) {
      setError("Title (RU) and Title (Romaji) are required")
      return
    }
    if (!canSubmit) return

    setIsLoading(true)
    setError(null)
    setExistingAnime(null)
    try {
      await adminCreateAnime({ input: form })
      window.location.href = "/admin/animes"
    } catch (e: any) {
      const payload = e?.payload
      if (payload?.error_code === "ANIME_EXISTS" && typeof payload?.existing_id === "number") {
        setExistingAnime({
          id: payload.existing_id,
          url: typeof payload.existing_url === "string" ? payload.existing_url : undefined,
          name: typeof payload.existing_name === "string" ? payload.existing_name : undefined,
        })
        const label = payload.existing_name || payload.existing_url || String(payload.existing_id)
        setError(`Anime already exists: ${label}`)
      } else {
        setError(e.message || "Failed to create")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Anime</h1>
          <p className="text-sm text-foreground-muted">Create a new anime entry with RU + Romaji</p>
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
              {existingAnime ? (
                <div className="mt-2">
                  <Link className="text-primary hover:underline" href={`/admin/animes/${existingAnime.id}`}>
                    Open existing anime
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-foreground-muted">Shikimori</label>
              <div className="flex gap-2">
                <input
                  value={shikiQuery}
                  onChange={(e) => setShikiQuery(e.target.value)}
                  placeholder="Search on Shikimori (romaji/english/russian)"
                  className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={runShikiSearch}
                  disabled={shikiLoading || !shikiQuery.trim()}
                  className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {shikiLoading ? "Searching" : "Search"}
                </button>
              </div>
              {shiki.error ? <div className="text-xs text-red-400">{shiki.error}</div> : null}
              <div className="flex flex-wrap gap-2">
                {form.shikimori_id ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-foreground">
                    <span>shikimori_id: {form.shikimori_id}</span>
                    {form.mal_id ? <span className="text-foreground-muted">mal_id: {form.mal_id}</span> : null}
                  <button
                    type="button"
                    onClick={fillFromShikimori}
                    disabled={shikiFillLoading}
                    className="ml-2 rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary disabled:opacity-50"
                  >
                    {shikiFillLoading ? "Filling…" : "Fill"}
                  </button>
                    <button
                      type="button"
                      className="text-foreground-muted hover:text-foreground"
                      onClick={() => setForm((p) => ({ ...p, shikimori_id: null, mal_id: null }))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
              </div>
              {shiki.items.length > 0 ? (
                <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-border/60 bg-background">
                  {shiki.items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        setForm((p) => ({
                          ...p,
                          shikimori_id: it.id,
                          mal_id: typeof it.mal_id === "number" ? it.mal_id : null,
                          title_ru: p.title_ru.trim() ? p.title_ru : it.russian || p.title_ru,
                          title_en_romaji: p.title_en_romaji.trim() ? p.title_en_romaji : it.name || p.title_en_romaji,
                          kind: p.kind || it.kind || "tv",
                          episodes: p.episodes && p.episodes > 0 ? p.episodes : it.episodes || p.episodes,
                          episodes_aired: p.episodes_aired || it.episodes_aired || p.episodes_aired,
                        }))
                        setShiki({ items: [], error: null })
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-border/40 last:border-b-0"
                    >
                      <div className="text-sm font-semibold text-foreground">{it.russian || it.name}</div>
                      <div className="text-xs text-foreground-muted">
                        {it.name} • id {it.id}
                        {it.mal_id ? ` • mal ${it.mal_id}` : ""} • {it.kind} • {it.status} • eps {it.episodes}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
              {shikiFillReport ? <div className="text-xs text-foreground-muted">{shikiFillReport}</div> : null}
            </div>


            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Slug (URL)</label>
              <input
                value={form.url}
                placeholder="e.g. solo-leveling"
                readOnly
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50 opacity-80"
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
              <label className="text-xs font-semibold text-foreground-muted">Title (RU) *</label>
              <input
                value={form.title_ru}
                onChange={(e) => setForm((p) => ({ ...p, title_ru: e.target.value }))}
                required
                aria-invalid={attemptedSubmit && !form.title_ru.trim()}
                className={cn(
                  "w-full h-11 rounded-xl bg-background border px-4 text-sm text-foreground outline-none focus:border-primary/50",
                  attemptedSubmit && !form.title_ru.trim() ? "border-red-500/60" : "border-border/60"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Title (Romaji) *</label>
              <input
                value={form.title_en_romaji}
                onChange={(e) => setForm((p) => ({ ...p, title_en_romaji: e.target.value }))}
                required
                aria-invalid={attemptedSubmit && !form.title_en_romaji.trim()}
                className={cn(
                  "w-full h-11 rounded-xl bg-background border px-4 text-sm text-foreground outline-none focus:border-primary/50",
                  attemptedSubmit && !form.title_en_romaji.trim() ? "border-red-500/60" : "border-border/60"
                )}
              />
            </div>

			<div className="space-y-2 lg:col-span-2">
				<div className="flex items-center justify-between gap-3">
					<label className="text-xs font-semibold text-foreground-muted">Alternative Titles (manual)</label>
					<button
						type="button"
					disabled={false}
						onClick={() =>
							setForm((p) => ({
								...p,
							alt_titles: [...(p.alt_titles || []), ""],
							}))
						}
						className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground hover:border-primary/40 disabled:opacity-60 disabled:hover:border-border/60"
					>
						<Plus className="w-3.5 h-3.5" />
						Add
					</button>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{(form.alt_titles || []).map((title, idx) => (
						<div key={idx} className="relative">
							<input
								value={title}
								onChange={(e) => {
									const v = e.target.value
									setForm((p) => {
										const next = (p.alt_titles || []).slice()
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
									setForm((p) => ({ ...p, alt_titles: (p.alt_titles || []).filter((_, i) => i !== idx) }))
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
              <label className="text-xs font-semibold text-foreground-muted">Producers</label>
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <input
                      value={producerQuery}
                      onChange={(e) => setProducerQuery(e.target.value)}
                      placeholder="Search producers…"
                      className="w-full h-10 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                    />
                    <div className="rounded-xl border border-border/60 bg-background-secondary/20 max-h-56 overflow-auto p-2">
                      <div className="space-y-1">
                        {filteredProducers.map((p) => {
                          const active = (form.producer_ids || []).includes(p.id)
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleProducer(p.id)}
                              className={cn(
                                "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm border transition-colors",
                                active
                                  ? "border-primary/40 bg-primary/10 text-foreground"
                                  : "border-border/60 bg-background text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
                              )}
                            >
                              <span className="truncate">{p.name}</span>
                              <span className={cn("text-xs", active ? "text-primary" : "text-foreground-subtle")}>#{p.id}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground-muted">Selected</div>
                    <div className="rounded-xl border border-border/60 bg-background-secondary/20 min-h-14 p-3">
                      {selectedProducers.length === 0 ? (
                        <div className="text-sm text-foreground-muted">No producers selected.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedProducers.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleProducer(p.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground hover:bg-background-tertiary/30"
                            >
                              <span>{p.name}</span>
                              <span className="text-xs text-red-400">Remove</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                value={(form.aired_on as string) || ""}
                onChange={(e) => setForm((p) => ({ ...p, aired_on: e.target.value }))}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Released on</label>
              <input
                type="date"
                value={(form.released_on as string) || ""}
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
              <Link href="/admin/kinds-ratings" target="_blank" className="text-xs text-primary hover:underline">
                Manage kinds
              </Link>
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
              <Link href="/admin/kinds-ratings" target="_blank" className="text-xs text-primary hover:underline">
                Manage ratings
              </Link>
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
            </div>

            <div className="space-y-2 lg:col-span-2">
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
              {isLoading ? "Saving…" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
