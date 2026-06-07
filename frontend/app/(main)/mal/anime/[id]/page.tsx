import Link from "next/link"
import { publicMalAnimeDetails } from "@/lib/api"

export const dynamic = "force-dynamic"

export default async function MalAnimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const animeId = Number(id)
	if (!Number.isFinite(animeId) || animeId <= 0) {
		return (
			<div className="pt-20">
				<main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
					<div className="text-sm text-red-300">Invalid id</div>
				</main>
			</div>
		)
	}

	const data = await publicMalAnimeDetails(animeId)
	const title = String((data as any)?.title || "Anime")
	const picture = (data as any)?.main_picture?.large || (data as any)?.main_picture?.medium || ""
	const synopsis = String((data as any)?.synopsis || "")

	return (
		<div className="pt-20">
			<main className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
				<div className="mb-6">
					<Link href="/mal" className="text-sm text-foreground-muted hover:text-foreground">
						← Назад к поиску
					</Link>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
					<div className="rounded-2xl border border-border/60 bg-background-secondary/40 overflow-hidden">
						<div className="aspect-[2/3] bg-background-tertiary/40">
							{picture ? <img src={picture} alt="" className="w-full h-full object-cover" /> : null}
						</div>
						<div className="p-4">
							<a
								href={`https://myanimelist.net/anime/${animeId}`}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center justify-center w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
							>
								Open on MyAnimeList
							</a>
						</div>
					</div>

					<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
						<h1 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
						<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground-muted">
							<div>Type: {String((data as any)?.media_type || "—")}</div>
							<div>Status: {String((data as any)?.status || "—")}</div>
							<div>Episodes: {String((data as any)?.num_episodes ?? "—")}</div>
							<div>Score: {String((data as any)?.mean ?? "—")}</div>
						</div>
						{synopsis ? (
							<p className="mt-4 text-sm text-foreground-muted leading-relaxed whitespace-pre-line">{synopsis}</p>
						) : null}
					</div>
				</div>
			</main>
		</div>
	)
}

