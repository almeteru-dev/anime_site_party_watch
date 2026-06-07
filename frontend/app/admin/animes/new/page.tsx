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
	searchAnimes,
	type AnimeSearchItem,
	type AdminCreateAnimeInput,
	type AdminMeta,
	type MalAnimeSearchNode,
	type ShikimoriAnimeSearchItem,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { slugify } from "@/lib/slug"
import { adminSearchMal, adminSearchShikimori, fillDraftFromMalId, fillDraftFromShikimoriId } from "@/lib/admin/anime-fill/fill"
import { applyMoonanimeUATranslate } from "@/lib/admin/anime-fill/providers/moonanime-ua"

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
	const [malQuery, setMalQuery] = useState("")
	const [malLoading, setMalLoading] = useState(false)
	const [malFillLoading, setMalFillLoading] = useState(false)
	const [malFillReport, setMalFillReport] = useState<string | null>(null)
	const [uaFillLoading, setUaFillLoading] = useState(false)
	const [uaFillReport, setUaFillReport] = useState<string | null>(null)
	const [firstSeasonQuery, setFirstSeasonQuery] = useState("")
	const [firstSeasonResults, setFirstSeasonResults] = useState<AnimeSearchItem[]>([])
	const [firstSeasonSelected, setFirstSeasonSelected] = useState<AnimeSearchItem | null>(null)
	const [shikiFillReport, setShikiFillReport] = useState<string | null>(null)
	type ShikiState = { items: ShikimoriAnimeSearchItem[]; error: string | null }
	const [shiki, setShiki] = useState<ShikiState>({ items: [], error: null })
	type MalState = { items: MalAnimeSearchNode[]; error: string | null }
	const [mal, setMal] = useState<MalState>({ items: [], error: null })

  const [form, setForm] = useState<AdminCreateAnimeInput>({
    url: "",
    title_ru: "",
	title_uk: "",
		title_en: "",
    title_en_romaji: "",
    alt_titles: [],
    description_ru: "",
	description_uk: "",
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
		season_number: 1,
		first_season_id: null,
  })

	const runShikiSearch = async () => {
		const q = shikiQuery.trim()
		if (!q) return
		setShikiLoading(true)
		setShiki({ items: [], error: null })
		try {
			const items = await adminSearchShikimori(q)
			setShiki({ items, error: null })
		} catch (e: any) {
			setShiki({ items: [], error: e?.message || "Failed to search Shikimori" })
		} finally {
			setShikiLoading(false)
		}
	}

	const runMalSearch = async () => {
		const q = malQuery.trim()
		if (!q) return
		setMalLoading(true)
		setMal({ items: [], error: null })
		try {
			const items = await adminSearchMal(q)
			setMal({ items, error: null })
		} catch (e: any) {
			setMal({ items: [], error: e?.message || "Failed to search via MAL" })
		} finally {
			setMalLoading(false)
		}
	}

	const fillFromShikimori = async (idOverride?: number) => {
		const id = typeof idOverride === "number" ? idOverride : form.shikimori_id
		if (!id || !meta) return
		setShikiFillLoading(true)
		setError(null)
		setShikiFillReport(null)
		try {
			const res = await fillDraftFromShikimoriId({ form, meta, shikiId: id })
			setMeta(res.nextMeta)
			setForm(res.nextForm)
			setShikiFillReport(res.report)
		} catch (e: any) {
			setError(e?.message || "Failed to fetch Shikimori")
		} finally {
			setShikiFillLoading(false)
		}
	}

	const fillFromMal = async () => {
		const id = form.mal_id
		if (!id || !meta) return
		setMalFillLoading(true)
		setError(null)
		setMalFillReport(null)
		try {
			const q = (form.title_en_romaji || form.title_en || malQuery).trim()
			const res = await fillDraftFromMalId({ form, meta, malId: id, q })
			setMeta(res.nextMeta)
			setForm(res.nextForm)
			setMalFillReport(res.report)
		} catch (e: any) {
			setError(e?.message || "Failed to fill from MAL")
		} finally {
			setMalFillLoading(false)
		}
	}

	const fillUATranslate = async () => {
		const id = form.mal_id
		if (!id || !meta) return
		setUaFillLoading(true)
		setError(null)
		setUaFillReport(null)
		try {
			const res = await applyMoonanimeUATranslate({ form, meta, malId: id })
			setMeta(res.nextMeta)
			setForm(res.nextForm)
			setUaFillReport(res.report)
		} catch (e: any) {
			setError(e?.message || "Failed to add UA translate")
		} finally {
			setUaFillLoading(false)
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
		if (!form.url.trim() || !form.title_ru.trim() || !form.title_en.trim() || !form.title_en_romaji.trim()) return false
		if (!form.season_number || form.season_number <= 0) return false
		if (form.season_number === 1) return form.first_season_id == null
		return form.first_season_id != null
	}, [form.first_season_id, form.season_number, form.title_en, form.title_en_romaji, form.title_ru, form.url])

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
    if (!form.title_ru.trim() || !form.title_en.trim() || !form.title_en_romaji.trim()) {
      setError("Title (RU), Title (EN) and Title (Romaji) are required")
      return
    }
		if (!form.season_number || form.season_number <= 0) {
			setError("Number Season is required")
			return
		}
		if (form.season_number === 1 && form.first_season_id != null) {
			setError("First season must be empty when Number Season = 1")
			return
		}
		if (form.season_number > 1 && form.first_season_id == null) {
			setError("First season is required when Number Season > 1")
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
									onClick={() => fillFromShikimori()}
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

				<div className="space-y-2 lg:col-span-2">
					<label className="text-xs font-semibold text-foreground-muted">MyAnimeList</label>
					<div className="flex gap-2">
						<input
							value={malQuery}
							onChange={(e) => setMalQuery(e.target.value)}
							placeholder="Search on MyAnimeList (english)"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
						<button
							type="button"
							onClick={runMalSearch}
							disabled={malLoading || !malQuery.trim()}
							className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
						>
							{malLoading ? "Searching" : "Search"}
						</button>
					</div>
					{mal.error ? <div className="text-xs text-red-400">{mal.error}</div> : null}
					<div className="flex flex-wrap gap-2">
						{form.mal_id ? (
							<div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-foreground">
								<span>mal_id: {form.mal_id}</span>
								<button
									type="button"
									onClick={fillFromMal}
									disabled={malFillLoading}
									className="ml-2 rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary disabled:opacity-50"
								>
									{malFillLoading ? "Filling…" : "Fill"}
								</button>
								<button
									type="button"
									className="text-foreground-muted hover:text-foreground"
									onClick={() => setForm((p) => ({ ...p, mal_id: null }))}
								>
									<X className="w-3 h-3" />
								</button>
							</div>
						) : null}
					</div>
					{mal.items.length > 0 ? (
						<div className="mt-2 max-h-56 overflow-auto rounded-xl border border-border/60 bg-background">
							{mal.items.map((it) => (
								<button
									key={it.id}
									type="button"
									onClick={() => {
										setForm((p) => ({
											...p,
											mal_id: it.id,
											title_en: p.title_en.trim() ? p.title_en : it.alternative_titles?.en || it.title || p.title_en,
											title_en_romaji: p.title_en_romaji.trim() ? p.title_en_romaji : it.title || p.title_en_romaji,
											poster_url: p.poster_url || it.main_picture?.large || it.main_picture?.medium || p.poster_url,
											episodes: p.episodes && p.episodes > 0 ? p.episodes : it.num_episodes || p.episodes,
											kind: p.kind || it.media_type || "tv",
										}))
										setMal({ items: [], error: null })
									}}
									className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-border/40 last:border-b-0"
								>
									<div className="text-sm font-semibold text-foreground">{it.title}</div>
									<div className="text-xs text-foreground-muted">
										MAL #{it.id}
										{it.alternative_titles?.en ? ` • ${it.alternative_titles.en}` : ""}
										{typeof it.num_episodes === "number" ? ` • eps ${it.num_episodes}` : ""}
										{it.media_type ? ` • ${it.media_type}` : ""}
									</div>
								</button>
							))}
						</div>
					) : null}
					{malFillReport ? <div className="text-xs text-foreground-muted">{malFillReport}</div> : null}
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
				<div className="flex items-center justify-between gap-2">
					<label className="text-xs font-semibold text-foreground-muted">Title (UA)</label>
					<button
						type="button"
						onClick={fillUATranslate}
						disabled={uaFillLoading || !meta || !form.mal_id}
						className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary disabled:opacity-50"
					>
						{uaFillLoading ? "Filling…" : "Add UA translate"}
					</button>
				</div>
				<input
					value={form.title_uk || ""}
					onChange={(e) => setForm((p) => ({ ...p, title_uk: e.target.value }))}
					className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
				/>
				{uaFillReport ? <div className="text-xs text-foreground-muted">{uaFillReport}</div> : null}
			</div>

			<div className="space-y-2">
				<label className="text-xs font-semibold text-foreground-muted">Title (EN) *</label>
				<input
					value={form.title_en}
					onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
					required
					aria-invalid={attemptedSubmit && !form.title_en.trim()}
					className={cn(
						"w-full h-11 rounded-xl bg-background border px-4 text-sm text-foreground outline-none focus:border-primary/50",
						attemptedSubmit && !form.title_en.trim() ? "border-red-500/60" : "border-border/60"
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

			<div className="space-y-2">
				<label className="text-xs font-semibold text-foreground-muted">Number Season *</label>
				<input
					type="number"
					min={1}
					value={form.season_number || 1}
					onChange={(e) => {
						const v = Number(e.target.value)
						setForm((p) => ({ ...p, season_number: Number.isFinite(v) ? v : 0 }))
						if (v === 1) {
							setFirstSeasonSelected(null)
							setFirstSeasonResults([])
							setFirstSeasonQuery("")
							setForm((p) => ({ ...p, first_season_id: null }))
						}
					}}
					required
					aria-invalid={attemptedSubmit && (!form.season_number || form.season_number <= 0)}
					className={cn(
						"w-full h-11 rounded-xl bg-background border px-4 text-sm text-foreground outline-none focus:border-primary/50",
						attemptedSubmit && (!form.season_number || form.season_number <= 0) ? "border-red-500/60" : "border-border/60"
					)}
				/>
			</div>

			<div className="space-y-2 lg:col-span-2">
				<label className="text-xs font-semibold text-foreground-muted">First season *</label>
				{form.season_number === 1 ? (
					<div className="h-11 rounded-xl border border-border/60 bg-background px-4 flex items-center text-sm text-foreground-muted">
						This anime is the first season
					</div>
				) : (
					<>
						<input
							value={firstSeasonQuery}
							onChange={async (e) => {
								const v = e.target.value
								setFirstSeasonQuery(v)
								const t = v.trim()
								if (t.length < 2) {
									setFirstSeasonResults([])
									return
								}
								try {
									const r = await searchAnimes({ q: t })
									setFirstSeasonResults(r.slice(0, 10))
								} catch {
									setFirstSeasonResults([])
								}
							}}
							placeholder="Search first season anime..."
							className={cn(
								"w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50",
								attemptedSubmit && form.season_number > 1 && form.first_season_id == null ? "border-red-500/60" : ""
							)}
						/>
						{firstSeasonSelected ? (
							<div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background-secondary/30 px-4 py-3">
								<div className="min-w-0">
									<div className="text-sm font-semibold truncate">{firstSeasonSelected.title_en || firstSeasonSelected.title_ru}</div>
									<div className="text-xs text-foreground-muted truncate">{firstSeasonSelected.title_ru}</div>
								</div>
								<button
									type="button"
									onClick={() => {
										setFirstSeasonSelected(null)
										setForm((p) => ({ ...p, first_season_id: null }))
									}}
									className="text-xs font-semibold text-foreground-muted hover:text-foreground"
								>
									Clear
								</button>
							</div>
						) : null}
						{firstSeasonResults.length > 0 ? (
							<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
								{firstSeasonResults.map((a) => (
									<button
										key={a.id}
										type="button"
										onClick={() => {
											setFirstSeasonSelected(a)
											setForm((p) => ({ ...p, first_season_id: a.id }))
										}}
										className={cn(
											"flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
											form.first_season_id === a.id ? "border-primary/40 bg-primary/10" : "border-border/60 bg-background hover:bg-background-tertiary/30"
										)}
									>
										<div className="w-10 h-14 rounded-lg overflow-hidden bg-background-tertiary/40 shrink-0">
											{a.image_url ? <img src={a.image_url} alt="" className="w-full h-full object-cover" /> : null}
										</div>
										<div className="min-w-0">
											<div className="text-sm font-semibold truncate">{a.title_en || a.title_ru}</div>
											<div className="text-xs text-foreground-muted truncate">{a.title_ru}</div>
										</div>
									</button>
								))}
							</div>
						) : null}
					</>
				)}
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
				<label className="text-xs font-semibold text-foreground-muted">Description (UA)</label>
				<textarea
					value={form.description_uk || ""}
					onChange={(e) => setForm((p) => ({ ...p, description_uk: e.target.value }))}
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
