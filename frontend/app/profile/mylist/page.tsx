"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Heart, Tv } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { getAnimePosterUrl, getLocalizedTitle, getMyCollection, removeFromMyCollection, addToMyCollection, type UserCollectionEntry, type WatchlistStatus } from "@/lib/api"
import { UserCollectionCard } from "@/components/user-collection-card"
import { AnimeStatusManager, type AnimeStatus } from "@/components/anime-status-manager"
import { cn } from "@/lib/utils"

type ListStatus = Exclude<AnimeStatus, null>
type MyListTab = ListStatus | "all"

export default function MyListPage() {
  const { user } = useAuth()
  const { t, locale } = useLanguage()
  const [items, setItems] = useState<UserCollectionEntry[] | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<MyListTab>("all")
	const [viewMode, setViewMode] = useState<"cards" | "table">("cards")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) {
        setItems([])
        return
      }
      try {
        const data = await getMyCollection()
        if (mounted) setItems(data)
      } catch (e: any) {
        const msg = e?.message || "Failed to load"
        if (mounted) setPageError(msg)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user])

  const mapBackendToUiStatus = (name: string): AnimeStatus => {
    const n = (name || "").toLowerCase()
    if (n === "watching" || n === "planned" || n === "rewatching" || n === "completed" || n === "on_hold" || n === "dropped") return n as AnimeStatus
    return "planned"
  }

	const tabLabel = (status: MyListTab) => {
		if (status === "all") return t.profile.allAnime
		if (!status) return ""
		if (status === "on_hold") return t.status.onHold
		return t.status[status]
	}

  const cards = useMemo(() => {
    if (!items) return []
    return items.map((entry) => {
      const anime = entry.anime
      const title = getLocalizedTitle(anime, locale)
      const image = getAnimePosterUrl(anime) || `https://placehold.co/300x400/081229/00E5FF?text=${encodeURIComponent(title)}`
      const status = mapBackendToUiStatus(entry.collection_type?.name) as ListStatus

      return { entry, anime, title, image, status }
    })
  }, [items, locale])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const x of cards) {
      const key = x.status
      c[key] = (c[key] || 0) + 1
    }
    return c
  }, [cards])

  const tabs = useMemo(() => {
    return ["all", "completed", "rewatching", "planned", "dropped", "watching", "on_hold"] as MyListTab[]
  }, [])

  const filteredCards = useMemo(() => {
		if (activeTab === "all") return cards
    return cards.filter((c) => c.status === activeTab)
  }, [activeTab, cards])

  useEffect(() => {
    if (!items) return
		if (activeTab === "all") return
		if ((counts[activeTab] || 0) > 0) return
		const first = (tabs.find((t) => t !== "all" && (counts[t] || 0) > 0) || "completed") as MyListTab
    if (first !== activeTab) setActiveTab(first)
  }, [activeTab, counts, items, tabs])

	const statusBarClass = (status: ListStatus) => {
		switch (status) {
			case "completed":
				return "bg-emerald-500"
			case "rewatching":
				return "bg-purple-500"
			case "planned":
				return "bg-amber-500"
			case "watching":
				return "bg-primary"
			case "on_hold":
				return "bg-slate-500"
			case "dropped":
				return "bg-red-500"
			default:
				return "bg-muted"
		}
	}

  const handleStatusChange = async (animeId: string, newStatus: AnimeStatus) => {
    if (!user) return
    if (!newStatus) return
    try {
      await addToMyCollection({ animeId, status: newStatus as WatchlistStatus })
      const refreshed = await getMyCollection()
      setItems(refreshed)
    } catch (e: any) {
      setPageError(e?.message || "Failed to update")
    }
  }

  const handleRemove = async (animeId: string) => {
    if (!user) return
    try {
      await removeFromMyCollection({ animeId })
      setItems((prev) => (prev ? prev.filter((e) => String(e.anime_id) !== String(animeId)) : prev))
    } catch (e: any) {
      setPageError(e?.message || "Failed to remove")
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t.profile.collections}</h1>
              <p className="text-sm text-foreground-muted">{user?.email || ""}</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background-secondary/50 px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Link>
        </div>

        {!user ? (
          <div className="rounded-2xl border border-border/50 bg-background-secondary/40 p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
              <Tv className="w-7 h-7 text-foreground-subtle" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">{t.profile.listSignInTitle}</h2>
            <p className="mt-1 text-sm text-foreground-muted">{t.profile.listSignInBody}</p>
            <Link
              href="/login"
              className="inline-flex mt-6 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t.nav.signIn}
            </Link>
          </div>
		) : (
			<>
				{pageError ? (
					<div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-400">{pageError}</div>
				) : items === null ? (
					<div className="mt-4 rounded-2xl border border-border/50 bg-background-secondary/40 p-8 animate-pulse">
						<div className="h-5 w-40 bg-muted/40 rounded" />
						<div className="mt-6 grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
							{Array.from({ length: 10 }).map((_, i) => (
								<div key={i} className="aspect-[3/4] rounded-xl bg-muted/30" />
							))}
						</div>
					</div>
				) : cards.length === 0 ? (
					<div className="mt-4 rounded-2xl border border-border/50 bg-background-secondary/40 p-8 text-center">
						<div className="mx-auto w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
							<Tv className="w-7 h-7 text-foreground-subtle" />
						</div>
						<h2 className="mt-4 text-lg font-semibold text-foreground">{t.profile.listEmptyTitle}</h2>
						<p className="mt-1 text-sm text-foreground-muted">{t.profile.listEmptyBody}</p>
						<Link
							href="/catalog"
							className="inline-flex mt-6 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
						>
							{t.profile.listBrowseCatalog}
						</Link>
					</div>
				) : (
					<>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-2">
              {tabs.map((key) => {
                const active = key === activeTab
						const count = key === "all" ? cards.length : (counts[key || "none"] || 0)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary/30"
                        : "bg-background-secondary/40 text-foreground-muted border-border/50 hover:text-foreground hover:border-primary/40"
                    )}
                  >
                    <span>{tabLabel(key)}</span>
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold",
                      active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-background/60 text-foreground"
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setViewMode("cards")}
						className={cn(
							"h-10 rounded-xl border px-4 text-sm font-semibold transition-colors",
							viewMode === "cards"
								? "bg-primary text-primary-foreground border-primary/30"
								: "bg-background-secondary/40 text-foreground-muted border-border/50 hover:text-foreground hover:border-primary/40"
						)}
					>
						{t.profile.viewCards}
					</button>
					<button
						type="button"
						onClick={() => setViewMode("table")}
						className={cn(
							"h-10 rounded-xl border px-4 text-sm font-semibold transition-colors",
							viewMode === "table"
								? "bg-primary text-primary-foreground border-primary/30"
								: "bg-background-secondary/40 text-foreground-muted border-border/50 hover:text-foreground hover:border-primary/40"
						)}
					>
						{t.profile.viewTable}
					</button>
				</div>
			</div>

					<div className="mt-6 rounded-2xl border border-border/50 bg-background-secondary/30 p-6">
						{filteredCards.length === 0 ? (
							<div className="text-sm text-foreground-muted">{t.profile.listEmptyTab}</div>
						) : viewMode === "cards" ? (
							<div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
								{filteredCards.map(({ entry, title, image, status }) => (
									<UserCollectionCard
										key={entry.id}
										animeId={String(entry.anime_id)}
										slug={entry.anime.url}
										title={title}
										image={image}
										rating={entry.anime.score}
										episodes={entry.anime.episodes}
										currentEpisode={entry.episodes_watched}
										status={status}
										isReleased={(entry.anime.status?.name || "").toLowerCase() === "released"}
										showDelete
										onStatusChange={handleStatusChange}
										onRemove={handleRemove}
									/>
								))}
							</div>
						) : (
							<div className="divide-y divide-border/40">
								{filteredCards.map(({ entry, title, image, status }) => (
									<div key={entry.id} className="flex gap-3 py-3">
										<div className={cn("w-1 rounded-full", statusBarClass(status))} />
										<Link href={`/anime/${entry.anime.url}`} className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-border/50">
											<img src={image} alt={title} className="h-full w-full object-cover" />
										</Link>
										<div className="min-w-0 flex-1">
											<Link href={`/anime/${entry.anime.url}`} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-1">
												{title}
											</Link>
											<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
												<div>{status === "on_hold" ? t.status.onHold : t.status[status]}</div>
												<div>
													{entry.anime.episodes > 0
														? `${t.common.epShort}. ${entry.episodes_watched} / ${entry.anime.episodes}`
														: `${t.common.epShort}. ${entry.episodes_watched}`}
												</div>
												<div>{Number(entry.anime.score || 0).toFixed(1)}</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<AnimeStatusManager
												animeId={String(entry.anime_id)}
												currentStatus={status}
												onStatusChange={handleStatusChange}
												onRemove={handleRemove}
												showDelete
												isReleased={(entry.anime.status?.name || "").toLowerCase() === "released"}
												variant="compact"
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
					</>
				)}
			</>
		)}
      </main>
    </div>
  )
}
