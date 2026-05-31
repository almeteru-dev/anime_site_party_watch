"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  adminCreateGenre,
  adminCreateKind,
  adminCreateRating,
  adminCreateSource,
  adminCreateStatus,
  adminCreateStudio,
  adminDeleteGenre,
  adminDeleteKind,
  adminDeleteRating,
  adminDeleteSource,
  adminDeleteStatus,
  adminDeleteStudio,
  adminListGenres,
  adminListKinds,
  adminListRatings,
  adminListSources,
  adminListStatuses,
  adminListStudios,
  adminSetAnimeGenres,
  adminUpdateGenre,
  adminUpdateKind,
  adminUpdateRating,
  adminUpdateSource,
  adminUpdateStatus,
  adminUpdateStudio,
  getAnimeByID,
  getAnimes,
  type Anime,
  type Genre,
  type KindOption,
  type RatingOption,
  type Source,
  type Status,
  type Studio,
  adminListThemes,
  adminCreateTheme,
  adminUpdateTheme,
  adminDeleteTheme,
  adminListProducers,
  adminCreateProducer,
  adminUpdateProducer,
  adminDeleteProducer,
  adminSetAnimeThemes,
  type Theme,
  type Producer,
	adminTranslateThemesFromShikimori,
} from "@/lib/api"
import { cn } from "@/lib/utils"

export default function AdminKindsRatingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<"kinds" | "ratings" | "statuses" | "studios" | "producers" | "sources" | "genres" | "themes">("kinds")
  const [kinds, setKinds] = useState<KindOption[] | null>(null)
  const [ratings, setRatings] = useState<RatingOption[] | null>(null)
  const [statuses, setStatuses] = useState<Status[] | null>(null)
  const [studios, setStudios] = useState<Studio[] | null>(null)
  const [producers, setProducers] = useState<Producer[] | null>(null)
  const [sources, setSources] = useState<Source[] | null>(null)
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [themes, setThemes] = useState<Theme[] | null>(null)
  const [animes, setAnimes] = useState<Anime[] | null>(null)
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>("")
  const [selectedAnimeGenres, setSelectedAnimeGenres] = useState<Genre[]>([])
  const [selectedAnimeThemes, setSelectedAnimeThemes] = useState<Theme[]>([])
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
	const [translatingThemes, setTranslatingThemes] = useState(false)
	const [translateReport, setTranslateReport] = useState<string | null>(null)

  const [newName, setNewName] = useState("")
  const [newRuName, setNewRuName] = useState("")
	const [newDescriptionEn, setNewDescriptionEn] = useState("")
	const [newDescriptionRu, setNewDescriptionRu] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingRuName, setEditingRuName] = useState("")
	const [editingDescriptionEn, setEditingDescriptionEn] = useState("")
	const [editingDescriptionRu, setEditingDescriptionRu] = useState("")

  const supportsRussianName = useMemo(() => {
    return tab === "genres" || tab === "themes" || tab === "statuses" || tab === "sources" || tab === "kinds"
  }, [tab])

	const supportsDescriptions = useMemo(() => {
		return tab === "genres" || tab === "themes" || tab === "ratings"
	}, [tab])

  const activeList = useMemo(() => {
    if (tab === "kinds") return kinds
    if (tab === "ratings") return ratings
    if (tab === "statuses") return statuses
    if (tab === "studios") return studios
    if (tab === "producers") return producers
    if (tab === "genres") return genres
    if (tab === "themes") return themes
    return sources
  }, [genres, themes, kinds, ratings, sources, statuses, studios, producers, tab])

  const tabLabel = useMemo(() => {
    if (tab === "kinds") return "Kind"
    if (tab === "ratings") return "Rating"
    if (tab === "statuses") return "Status"
    if (tab === "studios") return "Studio"
    if (tab === "producers") return "Producer"
    if (tab === "genres") return "Genre"
    if (tab === "themes") return "Theme"
    return "Source"
  }, [tab])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [k, r, st, su, pr, so, ge, th, an] = await Promise.all([
          adminListKinds({}),
          adminListRatings({}),
          adminListStatuses({}),
          adminListStudios({}),
          adminListProducers({}),
          adminListSources({}),
          adminListGenres({}),
          adminListThemes({}),
          getAnimes(),
        ])
        if (!mounted) return
        setKinds(k)
        setRatings(r)
        setStatuses(st)
        setStudios(su)
        setProducers(pr)
        setSources(so)
        setGenres(ge)
        setThemes(th)
        setAnimes(an)
      } catch (e: any) {
        if (!mounted) return
        setError(e.message || "Failed to load")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const startEdit = (id: number, name: string, ruName: string, descriptionEn: string, descriptionRu: string) => {
    setEditingId(id)
    setEditingName(name)
    setEditingRuName(ruName)
		setEditingDescriptionEn(descriptionEn)
		setEditingDescriptionRu(descriptionRu)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
    setEditingRuName("")
		setEditingDescriptionEn("")
		setEditingDescriptionRu("")
  }

	const translateThemesFromEn = async () => {
		setTranslatingThemes(true)
		setError(null)
		setTranslateReport(null)
		try {
			const res = await adminTranslateThemesFromShikimori()
			const th = await adminListThemes({})
			setThemes(th)
			setTranslateReport(`Updated: ${res.updated}, Skipped: ${res.skipped}, Not found: ${res.not_found}`)
		} catch (e: any) {
			setError(e?.message || "Failed to translate")
		} finally {
			setTranslatingThemes(false)
		}
	}

  const saveEdit = async () => {
    const name = editingName.trim()
    const ru_name = supportsRussianName ? (editingRuName.trim() || null) : null
		const description_en = supportsDescriptions ? (editingDescriptionEn.trim() || null) : null
		const description_ru = supportsDescriptions ? (editingDescriptionRu.trim() || null) : null
    if (!editingId || !name) return
    setSaving(true)
    setError(null)
    try {
      if (tab === "kinds") {
        const updated = await adminUpdateKind({ id: editingId, name, ru_name })
        setKinds((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else if (tab === "ratings") {
        const updated = await adminUpdateRating({ id: editingId, name, description_en, description_ru })
        setRatings((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else if (tab === "genres") {
        const updated = await adminUpdateGenre({ id: editingId, name, ru_name, description_en, description_ru })
        setGenres((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else if (tab === "themes") {
        const updated = await adminUpdateTheme({ id: editingId, name, ru_name, description_en, description_ru })
        setThemes((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else if (tab === "statuses") {
        const updated = await adminUpdateStatus({ id: editingId, name, ru_name })
        setStatuses((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else if (tab === "studios") {
        const updated = await adminUpdateStudio({ id: editingId, name })
        setStudios((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else if (tab === "producers") {
        const updated = await adminUpdateProducer({ id: editingId, name })
        setProducers((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      } else {
        const updated = await adminUpdateSource({ id: editingId, name, ru_name })
        setSources((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name)) : prev))
      }
      cancelEdit()
    } catch (e: any) {
      setError(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const create = async () => {
    const name = newName.trim()
    const ru_name = supportsRussianName ? (newRuName.trim() || null) : null
		const description_en = supportsDescriptions ? (newDescriptionEn.trim() || null) : null
		const description_ru = supportsDescriptions ? (newDescriptionRu.trim() || null) : null
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      if (tab === "kinds") {
        const created = await adminCreateKind({ name, ru_name })
        setKinds((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      } else if (tab === "ratings") {
        const created = await adminCreateRating({ name, description_en, description_ru })
        setRatings((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      } else if (tab === "genres") {
        const created = await adminCreateGenre({ name, ru_name, description_en, description_ru })
        setGenres((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      } else if (tab === "themes") {
        const created = await adminCreateTheme({ name, ru_name, description_en, description_ru })
        setThemes((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      } else if (tab === "statuses") {
        const created = await adminCreateStatus({ name, ru_name })
        setStatuses((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      } else if (tab === "studios") {
        const created = await adminCreateStudio({ name })
        setStudios((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      } else if (tab === "producers") {
        const created = await adminCreateProducer({ name })
        setProducers((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      } else {
        const created = await adminCreateSource({ name, ru_name })
        setSources((prev) => ([...(prev || []), created].sort((a, b) => a.name.localeCompare(b.name))))
      }
      setNewName("")
	  setNewRuName("")
		setNewDescriptionEn("")
		setNewDescriptionRu("")
    } catch (e: any) {
      setError(e.message || "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    setSaving(true)
    setError(null)
    try {
      if (tab === "kinds") {
        await adminDeleteKind({ id })
        setKinds((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      } else if (tab === "ratings") {
        await adminDeleteRating({ id })
        setRatings((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      } else if (tab === "genres") {
        await adminDeleteGenre({ id })
        setGenres((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      } else if (tab === "themes") {
        await adminDeleteTheme({ id })
        setThemes((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      } else if (tab === "statuses") {
        await adminDeleteStatus({ id })
        setStatuses((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      } else if (tab === "studios") {
        await adminDeleteStudio({ id })
        setStudios((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      } else if (tab === "producers") {
        await adminDeleteProducer({ id })
        setProducers((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      } else {
        await adminDeleteSource({ id })
        setSources((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      }
      if (editingId === id) cancelEdit()
    } catch (e: any) {
      setError(e.message || "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kinds & Ratings</h1>
          <p className="text-sm text-foreground-muted">Manage dropdown lists for anime metadata</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/60 bg-background p-1">
        {([
          { key: "kinds" as const, label: "Kinds" },
          { key: "ratings" as const, label: "Ratings" },
          { key: "genres" as const, label: "Genres" },
          { key: "themes" as const, label: "Themes" },
          { key: "statuses" as const, label: "Statuses" },
          { key: "studios" as const, label: "Studios" },
          { key: "producers" as const, label: "Producers" },
          { key: "sources" as const, label: "Sources" },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key)
              cancelEdit()
              setNewName("")
			  setNewRuName("")
			  setNewDescriptionEn("")
			  setNewDescriptionRu("")
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary/30"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tab === "genres" ? (
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-background p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Anime genres</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Anime</label>
                <select
                  value={selectedAnimeId}
                  onChange={async (e) => {
                    const v = e.target.value
                    setSelectedAnimeId(v)
                    setSelectedGenreId(null)
                    setSelectedAnimeGenres([])
                    setSelectedThemeId(null)
                    setSelectedAnimeThemes([])
                    if (!v) return
                    try {
                      const a = await getAnimeByID(v)
                      setSelectedAnimeGenres(a.genres || [])
                      setSelectedAnimeThemes(a.themes || [])
                    } catch (err: any) {
                      setError(err?.message || "Failed to load anime")
                    }
                  }}
                  className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                >
                  <option value="">Select anime…</option>
                  {(animes || []).map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.translations?.find((t) => t.language.code === "ru")?.title || a.name} (#{a.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Add genre</label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedGenreId ? String(selectedGenreId) : ""}
                    onChange={(e) => setSelectedGenreId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                    disabled={!selectedAnimeId}
                  >
                    <option value="">Select genre…</option>
                    {(genres || [])
                      .filter((g) => !selectedAnimeGenres.some((x) => x.id === g.id))
                      .map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedAnimeId || !selectedGenreId || saving}
                    onClick={async () => {
                      if (!selectedAnimeId || !selectedGenreId) return
                      setSaving(true)
                      setError(null)
                      try {
                        const nextIds = Array.from(new Set([...selectedAnimeGenres.map((g) => g.id), selectedGenreId]))
                        const updated = await adminSetAnimeGenres({ animeId: selectedAnimeId, genre_ids: nextIds })
                        setSelectedAnimeGenres(updated)
                        setSelectedGenreId(null)
                      } catch (err: any) {
                        setError(err?.message || "Failed to add genre")
                      } finally {
                        setSaving(false)
                      }
                    }}
                    className={cn(
                      "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold",
                      !selectedAnimeId || !selectedGenreId || saving
                        ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-foreground-muted">Selected genres</label>
              <div className="mt-2 rounded-xl border border-border/60 bg-background p-3">
                {selectedAnimeId && selectedAnimeGenres.length === 0 ? (
                  <div className="text-sm text-foreground-muted">No genres selected.</div>
                ) : !selectedAnimeId ? (
                  <div className="text-sm text-foreground-muted">Select an anime to manage genres.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedAnimeGenres.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={async () => {
                          if (!selectedAnimeId) return
                          setSaving(true)
                          setError(null)
                          try {
                            const nextIds = selectedAnimeGenres.filter((x) => x.id !== g.id).map((x) => x.id)
                            const updated = await adminSetAnimeGenres({ animeId: selectedAnimeId, genre_ids: nextIds })
                            setSelectedAnimeGenres(updated)
                          } catch (err: any) {
                            setError(err?.message || "Failed to remove genre")
                          } finally {
                            setSaving(false)
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background-secondary/30 px-3 py-2 text-sm text-foreground hover:bg-background-tertiary/30"
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
        ) : tab === "themes" ? (
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-background p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Anime themes</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Anime</label>
                <select
                  value={selectedAnimeId}
                  onChange={async (e) => {
                    const v = e.target.value
                    setSelectedAnimeId(v)
                    setSelectedGenreId(null)
                    setSelectedAnimeGenres([])
                    setSelectedThemeId(null)
                    setSelectedAnimeThemes([])
                    if (!v) return
                    try {
                      const a = await getAnimeByID(v)
                      setSelectedAnimeGenres(a.genres || [])
                      setSelectedAnimeThemes(a.themes || [])
                    } catch (err: any) {
                      setError(err?.message || "Failed to load anime")
                    }
                  }}
                  className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                >
                  <option value="">Select anime…</option>
                  {(animes || []).map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.translations?.find((t) => t.language.code === "ru")?.title || a.name} (#{a.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Add theme</label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedThemeId ? String(selectedThemeId) : ""}
                    onChange={(e) => setSelectedThemeId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
                    disabled={!selectedAnimeId}
                  >
                    <option value="">Select theme…</option>
                    {(themes || [])
                      .filter((g) => !selectedAnimeThemes.some((x) => x.id === g.id))
                      .map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedAnimeId || !selectedThemeId || saving}
                    onClick={async () => {
                      if (!selectedAnimeId || !selectedThemeId) return
                      setSaving(true)
                      setError(null)
                      try {
                        const nextIds = Array.from(new Set([...selectedAnimeThemes.map((g) => g.id), selectedThemeId]))
                        const updated = await adminSetAnimeThemes({ animeId: selectedAnimeId, theme_ids: nextIds })
                        setSelectedAnimeThemes(updated)
                        setSelectedThemeId(null)
                      } catch (err: any) {
                        setError(err?.message || "Failed to add theme")
                      } finally {
                        setSaving(false)
                      }
                    }}
                    className={cn(
                      "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold",
                      !selectedAnimeId || !selectedThemeId || saving
                        ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-foreground-muted">Selected themes</label>
              <div className="mt-2 rounded-xl border border-border/60 bg-background p-3">
                {selectedAnimeId && selectedAnimeThemes.length === 0 ? (
                  <div className="text-sm text-foreground-muted">No themes selected.</div>
                ) : !selectedAnimeId ? (
                  <div className="text-sm text-foreground-muted">Select an anime to manage themes.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedAnimeThemes.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={async () => {
                          if (!selectedAnimeId) return
                          setSaving(true)
                          setError(null)
                          try {
                            const nextIds = selectedAnimeThemes.filter((x) => x.id !== g.id).map((x) => x.id)
                            const updated = await adminSetAnimeThemes({ animeId: selectedAnimeId, theme_ids: nextIds })
                            setSelectedAnimeThemes(updated)
                          } catch (err: any) {
                            setError(err?.message || "Failed to remove theme")
                          } finally {
                            setSaving(false)
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background-secondary/30 px-3 py-2 text-sm text-foreground hover:bg-background-tertiary/30"
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
        ) : null}

        <div className="rounded-2xl border border-border/60 bg-background p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Add {tabLabel}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={tab === "kinds" ? "e.g., tv" : tab === "ratings" ? "e.g., r-17+" : `e.g., ${tabLabel.toLowerCase()}`}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={create}
                disabled={!newName.trim() || saving}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold",
                  !newName.trim() || saving
                    ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                Add
              </button>
            </div>

            {supportsRussianName ? (
              <input
                value={newRuName}
                onChange={(e) => setNewRuName(e.target.value)}
                placeholder="Russian name (optional)"
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
              />
            ) : null}

			{supportsDescriptions ? (
				<>
					<textarea
						value={newDescriptionEn}
						onChange={(e) => setNewDescriptionEn(e.target.value)}
						placeholder="Description (EN)"
						className="w-full min-h-24 rounded-xl bg-background border border-border/60 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
					/>
					<textarea
						value={newDescriptionRu}
						onChange={(e) => setNewDescriptionRu(e.target.value)}
						placeholder="Описание (RU)"
						className="w-full min-h-24 rounded-xl bg-background border border-border/60 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
					/>
				</>
			) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Existing {tab === "kinds" ? "Kinds" : tab === "ratings" ? "Ratings" : tab === "genres" ? "Genres" : tab === "themes" ? "Themes" : tab === "statuses" ? "Statuses" : tab === "studios" ? "Studios" : tab === "producers" ? "Producers" : "Sources"}
            </h3>
            {tab === "themes" ? (
              <button
                type="button"
                disabled={translatingThemes}
                onClick={translateThemesFromEn}
                className={cn(
                  "h-9 rounded-xl px-3 text-xs font-semibold transition-colors",
                  translatingThemes
                    ? "bg-background-tertiary/30 text-foreground-muted"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {translatingThemes ? "Translating…" : "Translate from EN"}
              </button>
            ) : null}
          </div>
          {tab === "themes" && translateReport ? <div className="mb-3 text-xs text-foreground-subtle">{translateReport}</div> : null}
          {activeList === null ? (
            <div className="text-sm text-foreground-muted">Loading…</div>
          ) : activeList.length === 0 ? (
            <div className="text-sm text-foreground-muted">No items yet.</div>
          ) : (
            <div className="space-y-2">
              {activeList.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background-secondary/30 px-4 py-3">
                  <div className="min-w-0">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                        />
                        {supportsRussianName ? (
                          <input
                            value={editingRuName}
                            onChange={(e) => setEditingRuName(e.target.value)}
                            placeholder="Russian name (optional)"
                            className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50"
                          />
                        ) : null}
						{supportsDescriptions ? (
							<>
								<textarea
									value={editingDescriptionEn}
									onChange={(e) => setEditingDescriptionEn(e.target.value)}
									placeholder="Description (EN)"
									className="w-full min-h-24 rounded-xl bg-background border border-border/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
								/>
								<textarea
									value={editingDescriptionRu}
									onChange={(e) => setEditingDescriptionRu(e.target.value)}
									placeholder="Описание (RU)"
									className="w-full min-h-24 rounded-xl bg-background border border-border/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
								/>
							</>
						) : null}
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-semibold text-foreground truncate">{item.name}</div>
                        {supportsRussianName && "ru_name" in item && item.ru_name ? (
                          <div className="text-xs text-foreground-subtle truncate">{String(item.ru_name)}</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === item.id ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={!editingName.trim() || saving}
                          className={cn(
                            "rounded-lg px-3 py-2 text-xs font-semibold",
                            !editingName.trim() || saving
                              ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
								startEdit(
									item.id,
									item.name,
									("ru_name" in item && item.ru_name ? String(item.ru_name) : ""),
									("description_en" in item && item.description_en ? String(item.description_en) : ""),
									("description_ru" in item && item.description_ru ? String(item.description_ru) : "")
								)
							}
                          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          disabled={saving}
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
