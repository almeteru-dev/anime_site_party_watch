"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { publicMalAnimeSearch, type MalAnimeSearchNode } from "@/lib/api"

export default function MalSearchPage() {
	const [q, setQ] = useState("")
	const [items, setItems] = useState<MalAnimeSearchNode[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const lastReq = useRef(0)

	const canSearch = useMemo(() => q.trim().length >= 2, [q])

	const run = async () => {
		const query = q.trim()
		if (query.length < 2) return
		setError(null)
		setLoading(true)
		const token = Date.now()
		lastReq.current = token
		try {
			const res = await publicMalAnimeSearch({ q: query, limit: 24 })
			if (lastReq.current !== token) return
			setItems((res.data || []).map((x) => x.node).filter(Boolean))
		} catch (e: any) {
			if (lastReq.current !== token) return
			setError(e?.message || "Failed")
			setItems([])
		} finally {
			if (lastReq.current === token) setLoading(false)
		}
	}

	return (
		<div className="pt-20">
			<main className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-12">
				<div className="mb-6">
					<h1 className="text-3xl lg:text-4xl font-bold text-foreground">Поиск в MyAnimeList</h1>
					<div className="mt-2 text-sm text-foreground-muted">
						Поиск работает через серверный прокси; токены не отправляются в браузер.
					</div>
				</div>

				<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-4">
					<div className="flex flex-col md:flex-row md:items-center gap-3">
						<div className="flex-1 relative">
							<Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								value={q}
								onChange={(e) => setQ(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault()
										run()
									}
								}}
								placeholder="Введите название аниме…"
								className="w-full h-11 rounded-xl bg-background border border-border/60 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary/50"
							/>
						</div>
						<button
							type="button"
							onClick={run}
							disabled={!canSearch || loading}
							className={cn(
								"h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
								(!canSearch || loading) && "opacity-60 cursor-not-allowed"
							)}
						>
							{loading ? "Поиск…" : "Найти"}
						</button>
					</div>

					{error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
					{!loading && !error && canSearch && items.length === 0 ? (
						<div className="mt-3 text-sm text-foreground-muted">Ничего не найдено.</div>
					) : null}
				</div>

				<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{items.map((a) => (
						<Link
							key={a.id}
							href={`/mal/anime/${a.id}`}
							className="group rounded-2xl border border-border/60 bg-background-secondary/40 overflow-hidden hover:border-primary/30 hover:bg-background-secondary/60 transition-colors"
						>
							<div className="aspect-[2/3] bg-background-tertiary/40">
								{a.main_picture?.large || a.main_picture?.medium ? (
									<img
										src={a.main_picture?.large || a.main_picture?.medium}
										alt=""
										className="w-full h-full object-cover"
									/>
								) : null}
							</div>
							<div className="p-3">
								<div className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
									{a.title}
								</div>
								<div className="mt-1 text-xs text-foreground-muted">
									{typeof a.mean === "number" ? `Score: ${a.mean}` : ""}
								</div>
							</div>
						</Link>
					))}
				</div>
			</main>
		</div>
	)
}

