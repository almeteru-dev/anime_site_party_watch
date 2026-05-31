"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"

import { AnimeCard as CatalogAnimeCard } from "@/components/catalog/anime-card"
import { getMALTopAnimeCatalog, type Anime } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

export default function TopPage() {
	const { t } = useLanguage()
	const [animes, setAnimes] = useState<Anime[]>([])
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		let mounted = true
		getMALTopAnimeCatalog()
			.then((data) => {
				if (!mounted) return
				setAnimes(data)
			})
			.catch(() => {
				if (!mounted) return
				setFailed(true)
			})
		return () => {
			mounted = false
		}
	}, [])

	return (
		<div className="pt-20">
			<main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
				<div className="mb-8 lg:mb-12">
					<div className="flex items-center gap-2 mb-2">
						<Trophy className="h-5 w-5 text-accent-primary" />
						<span className="text-sm font-medium text-accent-primary">
							{t.nav.top100} 100
						</span>
					</div>
					<h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">100</h1>
				</div>

				{animes.length === 0 ? (
					<div className="rounded-2xl border border-border/50 bg-background-secondary/30 p-8 text-center text-foreground-muted">
						{failed ? "Нет данных." : "Загрузка..."}
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
						{animes.map((anime) => (
							<CatalogAnimeCard key={anime.id} anime={anime} />
						))}
					</div>
				)}
			</main>
		</div>
	)
}
