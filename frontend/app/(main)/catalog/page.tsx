import { CatalogClient } from '@/components/catalog/catalog-client'
import { getAnimes, getCatalogMeta, type GetAnimesParams } from '@/lib/api'
import { CatalogHeader } from '@/components/catalog/catalog-header'

export const dynamic = "force-dynamic"

type CatalogPageProps = {
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

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const sp = (await Promise.resolve(searchParams)) || {}

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

  const [animes, meta] = await Promise.all([
    getAnimes(params),
    getCatalogMeta(),
  ])
  
  return (
    <div className="pt-20">
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <CatalogHeader />

        {/* Catalog Content */}
        <CatalogClient initialAnimes={animes} meta={meta} initialSearchParams={sp} />
      </main>
    </div>
  )
}
