"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createWatchPartyRoom, searchAnimes, type AnimeSearchItem } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function WatchPartyNewPage() {
	const router = useRouter()
	const { user, isLoading: authLoading } = useAuth()
	const [q, setQ] = useState("")
	const [results, setResults] = useState<AnimeSearchItem[]>([])
	const [selected, setSelected] = useState<AnimeSearchItem | null>(null)
	const [creating, setCreating] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (authLoading) return
		if (!user) router.replace(`/login?next=${encodeURIComponent("/watch-party/new")}`)
	}, [authLoading, router, user])

	const canCreate = useMemo(() => {
		if (!selected) return false
		return true
	}, [selected])

	return (
		<div className="pt-20">
			<main className="max-w-[1200px] mx-auto p-4 md:p-6 pb-10">
			<div className="mb-6">
				<div className="text-2xl font-semibold">Создать комнату совместного просмотра</div>
				<div className="mt-1 text-sm text-foreground-muted">Создайте комнату и пригласите других смотреть синхронно.</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
				<div className="rounded-2xl border border-border/60 bg-background p-4">
					<div className="text-sm font-semibold">Выбор аниме</div>
					<div className="mt-3">
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
								try {
									const r = await searchAnimes({ q: t })
									setResults(r.slice(0, 10))
								} catch {
									setResults([])
								}
							}}
							placeholder="Найти аниме..."
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
						{results.map((a) => (
							<button
								key={a.id}
								type="button"
								onClick={() => setSelected(a)}
								className={cn(
									"flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
									selected?.id === a.id
										? "border-primary/40 bg-primary/10"
										: "border-border/60 bg-background hover:bg-background-tertiary/30"
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
				</div>

				<div className="rounded-2xl border border-border/60 bg-background p-4 space-y-4">
					<div>
						<div className="text-sm font-semibold">Настройки комнаты</div>
						<div className="mt-2 text-xs text-foreground-muted">Доступ в комнату только по ссылке. Максимальная длительность: 12 часов. Комната удаляется, если в ней не остается участников.</div>
					</div>

					{error ? <div className="text-sm text-red-300">{error}</div> : null}

					<button
						type="button"
						disabled={!canCreate || creating}
						onClick={async () => {
							if (!selected) return
							setCreating(true)
							setError(null)
							try {
								const resp = await createWatchPartyRoom({
									is_public: true,
									password: "",
									content: {
										anime_slug: selected.url,
										selected_type: "dubbed",
										selected_episode_number: 1,
										selected_voice_group_id: null,
										selected_server_label: "",
										selected_source_id: null,
									},
								})
								router.push(`/watch-party/${resp.room_id}`)
							} catch (e: any) {
								setError(e?.message || "Не удалось создать комнату")
							} finally {
								setCreating(false)
							}
						}}
						className={cn(
							"w-full h-11 rounded-xl text-sm font-semibold transition-colors",
							canCreate && !creating
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-background-tertiary/30 text-foreground-muted"
						)}
					>
						{creating ? "Создание..." : "Создать комнату"}
					</button>
				</div>
			</div>
			</main>
		</div>
	)
}
