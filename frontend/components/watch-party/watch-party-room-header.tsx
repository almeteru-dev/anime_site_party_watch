"use client"

import { cn } from "@/lib/utils"
import type { WatchPartyRoomState, WatchPartyRole } from "@/lib/api"
import { useMemo, useState } from "react"
import type { AnimeSearchItem } from "@/lib/api"
import { searchAnimes } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"
import { pickAnimeTitle } from "@/lib/localized"

export function WatchPartyRoomHeader({
	room,
	selfRole,
	inviteUrl,
	onLeave,
	onDissolve,
	onChangeContent,
}: {
	room: WatchPartyRoomState
	selfRole: WatchPartyRole
	inviteUrl: string
	onLeave: () => void
	onDissolve: () => void
	onChangeContent: (animeSlug: string) => void
}) {
	const canShare = selfRole === "owner" || selfRole === "moderator"
	const canControl = canShare
	const [copied, setCopied] = useState(false)
	const [showPicker, setShowPicker] = useState(false)
	const [q, setQ] = useState("")
	const [results, setResults] = useState<AnimeSearchItem[]>([])
	const [loading, setLoading] = useState(false)
	const { locale } = useLanguage()

	const statusLabel = useMemo(() => {
		if (room.status === "active") return "Active"
		if (room.status === "expired") return "Expired"
		return "Dissolved"
	}, [room.status])

	return (
		<div className="sticky top-0 z-10 rounded-2xl border border-border/60 bg-background/90 backdrop-blur px-4 py-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<div className="text-sm font-semibold">Watch Party</div>
						<span className={cn("text-xs px-2 py-1 rounded-full border", room.status === "active" ? "border-green-500/30 text-green-300" : "border-red-500/30 text-red-300")}>
							{statusLabel}
						</span>
						<span className="text-xs text-foreground-subtle">#{room.id}</span>
					</div>
					<div className="text-xs text-foreground-muted">
						Ends: {new Date(room.expires_at).toLocaleString()}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{canShare ? (
						<button
							type="button"
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(inviteUrl)
									setCopied(true)
									setTimeout(() => setCopied(false), 1200)
								} catch {
									;
								}
							}}
							className={cn(
								"h-10 px-4 rounded-xl text-sm font-semibold border transition-colors",
								"border-border/60 bg-background hover:bg-background-tertiary/30"
							)}
						>
							{copied ? "Copied" : "Copy invite"}
						</button>
					) : null}

					{canControl ? (
						<button
							type="button"
							onClick={() => setShowPicker((v) => !v)}
							className={cn(
								"h-10 px-4 rounded-xl text-sm font-semibold border transition-colors",
								"border-border/60 bg-background hover:bg-background-tertiary/30"
							)}
						>
							Change content
						</button>
					) : null}

					<button
						type="button"
						onClick={onLeave}
						className="h-10 px-4 rounded-xl text-sm font-semibold border border-border/60 bg-background hover:bg-background-tertiary/30"
					>
						Leave
					</button>

					{selfRole === "owner" ? (
						<button
							type="button"
							onClick={onDissolve}
							className="h-10 px-4 rounded-xl text-sm font-semibold bg-red-500/90 text-white hover:bg-red-500"
						>
							Dissolve
						</button>
					) : null}
				</div>
			</div>

			{canControl && showPicker ? (
				<div className="mt-3 rounded-2xl border border-border/60 bg-background p-3">
					<div className="flex items-center gap-2">
						<input
							value={q}
							onChange={async (e) => {
								const v = e.target.value
								setQ(v)
								const t = v.trim()
								if (t.length < 2) {
									setResults([])
									return
								}
								setLoading(true)
								try {
									const r = await searchAnimes({ q: t })
									setResults(r.slice(0, 8))
								} finally {
									setLoading(false)
								}
							}}
							placeholder="Search anime…"
							className="flex-1 h-10 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
						<div className="text-xs text-foreground-muted">{loading ? "Searching…" : ""}</div>
					</div>
					<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
						{results.map((a) => (
							<button
								key={a.id}
								type="button"
								onClick={() => {
									onChangeContent(a.url)
									setShowPicker(false)
									setResults([])
									setQ("")
								}}
								className="flex items-center gap-3 rounded-xl border border-border/60 bg-background hover:bg-background-tertiary/30 px-3 py-2 text-left"
							>
								<div className="w-10 h-14 rounded-lg overflow-hidden bg-background-tertiary/40 shrink-0">
									{a.image_url ? <img src={a.image_url} alt="" className="w-full h-full object-cover" /> : null}
								</div>
								<div className="min-w-0">
									<div className="text-sm font-semibold truncate">{pickAnimeTitle(locale, a)}</div>
									<div className="text-xs text-foreground-muted truncate">
										{locale === "en" ? a.title_ru || a.title_uk || "" : a.title_en || ""}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			) : null}
		</div>
	)
}
