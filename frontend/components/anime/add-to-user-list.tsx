"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Plus, Check, Minus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import { setCollectionStatus } from "@/lib/collection-cache"
import { useAuth } from "@/contexts/auth-context"
import { updateMyCollectionEpisodesWatched } from "@/lib/api"

export type UserListStatus = "watching" | "planned" | "rewatching" | "completed" | "on_hold" | "dropped"

export type AddToUserListProps = {
  animeId: string
  onUpdate: (animeId: string, status: UserListStatus) => Promise<void>
  initialStatus?: UserListStatus | null
	initialEpisodesWatched?: number
	totalEpisodes?: number
	animeStatusName?: string | null
}

export function AddToUserList({
	animeId,
	onUpdate,
	initialStatus = null,
	initialEpisodesWatched = 0,
	totalEpisodes = 0,
	animeStatusName = null,
}: AddToUserListProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [selected, setSelected] = useState<UserListStatus | null>(initialStatus)
	const [statusError, setStatusError] = useState<string | null>(null)
	const [episodesWatched, setEpisodesWatched] = useState<number>(initialEpisodesWatched)
	const [isUpdatingEpisodes, setIsUpdatingEpisodes] = useState(false)
	const [episodesError, setEpisodesError] = useState<string | null>(null)

  useEffect(() => {
    setSelected(initialStatus)
  }, [initialStatus])

	useEffect(() => {
		setEpisodesWatched(initialEpisodesWatched)
	}, [initialEpisodesWatched])

	const isReleased = (animeStatusName || "").toLowerCase() === "released"

  const label = useMemo(() => {
    if (phase === "loading") return "Saving..."
    if (phase === "success") return "Saved"
    if (!selected) return t.status.addToList
    if (selected === "on_hold") return t.status.onHold
    return t.status[selected]
  }, [phase, selected, t.status])

  const buttonClass = useMemo(() => {
    if (!selected) return "bg-primary text-primary-foreground hover:bg-primary/90"
    if (selected === "planned")
      return "bg-amber-500/15 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
    if (selected === "rewatching")
      return "bg-purple-500/15 text-purple-700 border border-purple-500/30 hover:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40"
    if (selected === "completed")
      return "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
    if (selected === "watching") return "bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
    if (selected === "on_hold")
      return "bg-slate-500/15 text-slate-700 border border-slate-400/30 hover:bg-slate-500/20 dark:text-slate-200 dark:border-slate-400/40"
    return "bg-red-500/15 text-red-700 border border-red-500/30 hover:bg-red-500/20 dark:text-red-300 dark:border-red-500/40"
  }, [selected])

  const items: { value: UserListStatus; label: string }[] = [
    { value: "watching", label: t.status.watching },
    { value: "planned", label: t.status.planned },
    { value: "rewatching", label: t.status.rewatching },
    { value: "completed", label: t.status.completed },
    { value: "on_hold", label: t.status.onHold },
    { value: "dropped", label: t.status.dropped },
  ]

  const handlePick = async (value: UserListStatus) => {
    setPhase("loading")
    setStatusError(null)
    try {
      if (!isReleased && (value === "completed" || value === "rewatching")) {
        throw new Error("Anime is not released")
      }
      await onUpdate(animeId, value)
      setSelected(value)
      if (value === "completed" && totalEpisodes > 0) {
        setEpisodesWatched(totalEpisodes)
      }
      if (user) setCollectionStatus(user.id, animeId, value)
      setPhase("success")
      window.setTimeout(() => setPhase("idle"), 1200)
    } catch (e: any) {
      setStatusError(e?.message || "Failed to update")
      setPhase("error")
      window.setTimeout(() => setPhase("idle"), 1500)
    }
  }

	const canEditEpisodes = selected === "watching" || selected === "rewatching" || selected === "on_hold" || selected === "dropped"
	const maxEpisodes = totalEpisodes > 0 ? totalEpisodes : 0

	const setEpisodes = async (next: number) => {
		if (!user) return
		if (!canEditEpisodes) return
		if (isUpdatingEpisodes) return
		const prev = episodesWatched
		let value = next
		if (value < 0) value = 0
		if (maxEpisodes > 0 && value > maxEpisodes) value = maxEpisodes
		setEpisodesError(null)
		setEpisodesWatched(value)

		setIsUpdatingEpisodes(true)
		try {
			const saved = await updateMyCollectionEpisodesWatched({ animeId, episodesWatched: value })
			setEpisodesWatched(saved)
		} catch (e: any) {
			setEpisodesWatched(prev)
			setEpisodesError(e?.message || "Failed")
		} finally {
			setIsUpdatingEpisodes(false)
		}
	}

  return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						disabled={phase === "loading"}
						className={cn("font-semibold", buttonClass)}
						variant={selected ? "outline" : "default"}
					>
						<Plus className="w-4 h-4 mr-2" />
						{label}
						<ChevronDown className="w-4 h-4 ml-2" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="bg-popover border-border text-popover-foreground">
					{items.map((it) => (
						<DropdownMenuItem
							key={it.value}
							onSelect={() => handlePick(it.value)}
							disabled={!isReleased && (it.value === "completed" || it.value === "rewatching")}
							className={cn(
								"flex items-center justify-between text-foreground-muted hover:text-foreground hover:bg-background-tertiary focus:bg-background-tertiary focus:text-foreground cursor-pointer",
								selected === it.value && "bg-background-tertiary text-foreground"
							)}
						>
							{it.label}
							{selected === it.value && <Check className="w-4 h-4 ml-2 text-primary" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{statusError ? <div className="mt-2 text-xs text-red-400">{statusError}</div> : null}

			{canEditEpisodes ? (
			<div className="mt-2">
				<div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background-secondary/40 px-3 py-2">
					<div className="text-xs text-foreground-muted">{t.hero.episodes}</div>
					<div className="flex items-center gap-3">
						<div className="text-xs font-semibold text-foreground">
							{episodesWatched}{maxEpisodes > 0 ? ` / ${maxEpisodes}` : ""}
						</div>
						<button
							type="button"
							disabled={isUpdatingEpisodes || episodesWatched <= 0}
							onClick={() => setEpisodes(episodesWatched - 1)}
							className="h-8 w-8 rounded-lg border border-border/60 bg-background text-foreground hover:bg-background-secondary disabled:opacity-50"
							aria-label="-"
						>
							<Minus className="w-4 h-4 mx-auto" />
						</button>
						<button
							type="button"
							disabled={isUpdatingEpisodes || (maxEpisodes > 0 && episodesWatched >= maxEpisodes)}
							onClick={() => setEpisodes(episodesWatched + 1)}
							className="h-8 w-8 rounded-lg border border-border/60 bg-background text-foreground hover:bg-background-secondary disabled:opacity-50"
							aria-label="+"
						>
							<Plus className="w-4 h-4 mx-auto" />
						</button>
					</div>
				</div>
				{episodesError ? <div className="mt-1 text-[11px] text-red-400">{episodesError}</div> : null}
			</div>
		) : null}
		</>
	)
}
