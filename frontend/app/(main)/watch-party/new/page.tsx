"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { createWatchPartyRoom, searchAnimes, type AnimeSearchItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { pickAnimeTitle } from "@/lib/localized"

export default function WatchPartyNewPage() {
	const router = useRouter()
	const { user, isLoading: authLoading } = useAuth()
	const { locale } = useLanguage()
	const [q, setQ] = useState("")
	const [results, setResults] = useState<AnimeSearchItem[]>([])
	const [selected, setSelected] = useState<AnimeSearchItem | null>(null)
	type PlayerChoice = "kodik" | "moonanime"
	const [playerChoice, setPlayerChoice] = useState<PlayerChoice>("kodik")
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
				<div className="text-2xl font-semibold">
					{locale === "ru"
						? "Создать комнату совместного просмотра"
						: locale === "uk"
						? "Створити кімнату спільного перегляду"
						: "Create a Watch Party room"}
				</div>
				<div className="mt-1 text-sm text-foreground-muted">
					{locale === "ru"
						? "Создайте комнату и пригласите других смотреть синхронно."
						: locale === "uk"
						? "Створіть кімнату та запросіть інших дивитися синхронно."
						: "Create a room and invite others to watch in sync."}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
				<div className="rounded-2xl border border-border/60 bg-background p-4">
					<div className="text-sm font-semibold">{locale === "ru" ? "Выбор аниме" : locale === "uk" ? "Вибір аніме" : "Pick anime"}</div>
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
							placeholder={locale === "ru" ? "Найти аниме..." : locale === "uk" ? "Знайти аніме..." : "Search anime..."}
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
								<div className="text-sm font-semibold truncate">{pickAnimeTitle(locale, a)}</div>
								<div className="text-xs text-foreground-muted truncate">
									{locale === "en" ? a.title_ru || a.title_uk || "" : a.title_en || ""}
								</div>
								</div>
							</button>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-border/60 bg-background p-4 space-y-4">
					<div>
						<div className="text-sm font-semibold">{locale === "ru" ? "Настройки комнаты" : locale === "uk" ? "Налаштування кімнати" : "Room settings"}</div>
						<div className="mt-2 text-xs text-foreground-muted">
							{locale === "ru"
								? "Доступ в комнату только по ссылке. Максимальная длительность: 12 часов. Комната удаляется, если в ней не остается участников."
								: locale === "uk"
								? "Доступ до кімнати лише за посиланням. Максимальна тривалість: 12 годин. Кімната видаляється, якщо в ній не залишається учасників."
								: "Access is by link only. Max duration: 12 hours. The room is removed when empty."}
						</div>
					</div>

					<div>
						<div className="text-sm font-semibold">{locale === "ru" ? "Плеер" : locale === "uk" ? "Плеєр" : "Player"}</div>
						<div className="mt-2 flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setPlayerChoice("kodik")}
								className={cn(
									"h-9 px-3 rounded-full text-sm font-semibold",
									playerChoice === "kodik" ? "bg-primary text-primary-foreground" : "bg-background-tertiary/30 hover:bg-background-tertiary/40"
								)}
							>
								Kodik
							</button>
							<button
								type="button"
								onClick={() => setPlayerChoice("moonanime")}
								className={cn(
									"h-9 px-3 rounded-full text-sm font-semibold",
									playerChoice === "moonanime" ? "bg-primary text-primary-foreground" : "bg-background-tertiary/30 hover:bg-background-tertiary/40"
								)}
							>
								Moonanime
							</button>
						</div>
						<div className="mt-2 text-xs text-foreground-muted">
							{locale === "ru"
								? "Плеер фиксируется при создании комнаты и не меняется."
								: locale === "uk"
								? "Плеєр фіксується при створенні кімнати та не змінюється."
								: "Player is locked when the room is created."}
						</div>
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
								const lockedLabel = playerChoice === "moonanime" ? "Moonanime" : "Kodik"
								const resp = await createWatchPartyRoom({
									is_public: true,
									password: "",
									content: {
										anime_slug: selected.url,
										selected_type: "dubbed",
										selected_episode_number: 1,
										selected_voice_group_id: null,
										selected_server_label: lockedLabel,
										locked_server_label: lockedLabel,
										selected_source_id: null,
									},
								})
								router.push(`/watch-party/${resp.room_id}`)
							} catch (e: any) {
								setError(
									e?.message ||
										(locale === "ru" ? "Не удалось создать комнату" : locale === "uk" ? "Не вдалося створити кімнату" : "Failed to create room")
								)
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
						{creating
							? locale === "ru"
								? "Создание..."
								: locale === "uk"
								? "Створення..."
								: "Creating..."
							: locale === "ru"
							? "Создать комнату"
							: locale === "uk"
							? "Створити кімнату"
							: "Create room"}
					</button>
				</div>
			</div>
			</main>
		</div>
	)
}
