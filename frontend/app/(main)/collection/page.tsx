import { CatalogClient } from "@/components/catalog/catalog-client"
import { CollectionHeader } from "@/components/collection/collection-header"
import { getAnimes, getCatalogMeta, type GetAnimesParams } from "@/lib/api"

export const dynamic = "force-dynamic"

type CollectionPageProps = {
	searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

function getFirst(value: string | string[] | undefined): string | undefined {
	if (Array.isArray(value)) return value[0]
	return value
}

function parseCsv(value: string | undefined): string[] {
	if (!value) return []
	return value
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean)
}

function normalizeKind(raw: string | undefined): "genre" | "theme" | "rating" | null {
	const v = (raw || "").toLowerCase()
	if (v === "genre" || v === "theme" || v === "rating") return v
	return null
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
	const sp = (await Promise.resolve(searchParams)) || {}

	const kind = normalizeKind(getFirst(sp.kind))
	const value = (getFirst(sp.value) || "").trim()

	const params: GetAnimesParams = {
		q: getFirst(sp.q),
		genres: parseCsv(getFirst(sp.genres)),
		themes: parseCsv(getFirst(sp.themes)),
		producers: parseCsv(getFirst(sp.producers)),
		types: parseCsv(getFirst(sp.types)),
		statuses: parseCsv(getFirst(sp.statuses)),
		studios: parseCsv(getFirst(sp.studios)),
		sources: parseCsv(getFirst(sp.sources)),
		ratings: parseCsv(getFirst(sp.ratings)),
	}

	if (kind && value) {
		if (kind === "genre" && !params.genres?.length) params.genres = [value]
		if (kind === "theme" && !params.themes?.length) params.themes = [value]
		if (kind === "rating" && !params.ratings?.length) params.ratings = [value]
	}

	const yearFrom = getFirst(sp.year_from)
	const yearTo = getFirst(sp.year_to)
	const minRating = getFirst(sp.min_rating)
	const releaseUnknown = getFirst(sp.release_unknown)

	if (yearFrom && !Number.isNaN(Number(yearFrom))) params.year_from = Number(yearFrom)
	if (yearTo && !Number.isNaN(Number(yearTo))) params.year_to = Number(yearTo)
	if (minRating && !Number.isNaN(Number(minRating))) params.min_rating = Number(minRating)
	if (releaseUnknown && (releaseUnknown === "1" || String(releaseUnknown).toLowerCase() === "true")) {
		params.release_unknown = true
	}

	const [animes, meta] = await Promise.all([getAnimes(params), getCatalogMeta()])

	const headerKind =
		kind ||
		(params.genres?.[0] ? "genre" : params.themes?.[0] ? "theme" : params.ratings?.[0] ? "rating" : "genre")
	const headerValue = value || params.genres?.[0] || params.themes?.[0] || params.ratings?.[0] || ""

	return (
		<div className="pt-20">
			<main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
				{headerValue ? (
					<CollectionHeader kind={headerKind} value={headerValue} meta={meta} resultCount={animes.length} />
				) : (
					<div className="mb-8 lg:mb-10">
						<h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Подборка</h1>
					</div>
				)}

				<CatalogClient
					initialAnimes={animes}
					meta={meta}
					initialSearchParams={sp}
					basePath="/collection"
					extraQuery={headerValue ? { kind: headerKind, value: headerValue } : undefined}
				/>
			</main>
		</div>
	)
}
