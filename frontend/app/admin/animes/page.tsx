"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { PlusCircle, Trash2, Pencil, Search, Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import {
  adminDeleteAnime,
  adminGetMeta,
  adminListFeaturedAnimes,
  adminSetAnimeFeatured,
  getAnimes,
  getLocalizedTitle,
  type AdminMeta,
  type Anime,
} from "@/lib/api"

export default function AdminAnimesPage() {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const [animes, setAnimes] = useState<Anime[] | null>(null)
  const [meta, setMeta] = useState<AdminMeta | null>(null)
  const [featuredIds, setFeaturedIds] = useState<Set<number>>(new Set())
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [studio, setStudio] = useState("")
  const [source, setSource] = useState("")
  const [rating, setRating] = useState("")
  const [sortBy, setSortBy] = useState<"score" | "studio" | "source" | "rating">("score")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")

  const queryDebounce = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const m = await adminGetMeta({})
        if (mounted) setMeta(m)
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load metadata")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const featured = await adminListFeaturedAnimes({})
        if (!mounted) return
        setFeaturedIds(new Set((featured || []).map((a) => a.id)))
      } catch {
        ;
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    if (queryDebounce.current) window.clearTimeout(queryDebounce.current)
    queryDebounce.current = window.setTimeout(() => {
      ;(async () => {
        try {
          const data = await getAnimes({
            q: query.trim() || undefined,
            studios: studio ? [studio] : undefined,
            sources: source ? [source] : undefined,
            ratings: rating ? [rating] : undefined,
            sort_by: sortBy,
            sort_dir: sortDir,
          })
          if (mounted) setAnimes(data)
        } catch (e: any) {
          if (mounted) {
            setError(e.message || "Failed to load")
            setAnimes([])
          }
        }
      })()
    }, 250)
    return () => {
      mounted = false
      if (queryDebounce.current) window.clearTimeout(queryDebounce.current)
    }
  }, [query, rating, sortBy, sortDir, source, studio])

  const filtered = useMemo(() => {
    return animes || []
  }, [animes])

  const handleDelete = async (id: string) => {
    if (user?.role === "moderator") return
    const ok = window.confirm("Delete this anime? This cannot be undone.")
    if (!ok) return

    try {
      await adminDeleteAnime({ id })
      setAnimes((prev) => (prev ? prev.filter((a) => String(a.id) !== id) : prev))
    } catch (e: any) {
      setError(e.message || "Failed to delete")
    }
  }

  const featuredCount = featuredIds.size

  const toggleFeatured = async (a: Anime) => {
    const currently = featuredIds.has(a.id) || !!a.is_featured
    const next = !currently
    if (next && featuredCount >= 5 && !currently) {
      setError("Maximum of 5 featured anime reached")
      return
    }
    try {
      const updated = await adminSetAnimeFeatured({ id: String(a.id), featured: next })
      setAnimes((prev) => (prev ? prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)) : prev))
      setFeaturedIds((prev) => {
        const n = new Set(prev)
        if (updated.is_featured) n.add(updated.id)
        else n.delete(updated.id)
        return n
      })
    } catch (e: any) {
      setError(e.message || "Failed to update featured")
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Anime</h1>
          <p className="text-sm text-foreground-muted">Manage your catalog entries</p>
        </div>
        <Link
          href="/admin/animes/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="w-4 h-4" />
          Add Anime
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-background-secondary/40">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Search className="w-4 h-4 text-foreground-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or slug"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-subtle outline-none"
          />
        </div>

        <div className="px-4 py-3 border-b border-border/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
          >
            <option value="score">Sort: Score</option>
            <option value="studio">Sort: Studio</option>
            <option value="source">Sort: Source</option>
            <option value="rating">Sort: Rating</option>
          </select>

          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as any)}
            className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
          >
            <option value="desc">Direction: Desc</option>
            <option value="asc">Direction: Asc</option>
          </select>

          <select
            value={studio}
            onChange={(e) => setStudio(e.target.value)}
            className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
          >
            <option value="">Studio: All</option>
            {(meta?.studios || []).map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
          >
            <option value="">Source: All</option>
            {(meta?.sources || []).map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
          >
            <option value="">Rating: All</option>
            {(meta?.ratings || []).map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-red-400 border-b border-red-500/30 bg-red-500/10">{error}</div>
        )}

        {animes === null ? (
          <div className="p-6 text-sm text-foreground-muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-foreground-muted">No anime found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-foreground-subtle">
                <tr className="border-b border-border/50">
                  <th className="text-left font-semibold px-4 py-3">Title</th>
                  <th className="text-left font-semibold px-4 py-3">Featured</th>
                  <th className="text-left font-semibold px-4 py-3">Slug</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Year</th>
                  <th className="text-right font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-border/40 hover:bg-background-tertiary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{getLocalizedTitle(a, locale)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(a)}
                        disabled={!featuredIds.has(a.id) && featuredCount >= 5}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          featuredIds.has(a.id) || a.is_featured
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/60 bg-background text-foreground-muted hover:text-foreground"
                        } ${!featuredIds.has(a.id) && featuredCount >= 5 ? "opacity-60 cursor-not-allowed" : ""}`}
                        title={!featuredIds.has(a.id) && featuredCount >= 5 ? "Max 5" : ""}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {(featuredIds.has(a.id) || a.is_featured) ? "Featured" : "Feature"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{a.url}</td>
                    <td className="px-4 py-3 text-foreground-muted">{a.status?.name || ""}</td>
                    <td className="px-4 py-3 text-foreground-muted">{a.aired_on ? new Date(a.aired_on).getFullYear() : ""}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/animes/${a.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                        {user?.role !== "moderator" ? (
                          <button
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15"
                            onClick={() => handleDelete(String(a.id))}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
