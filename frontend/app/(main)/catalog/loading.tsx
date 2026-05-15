export default function CatalogLoading() {
  return (
    <div className="pt-20">
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <div className="mb-8 lg:mb-12">
          <div className="h-4 w-24 rounded bg-background-tertiary/60 mb-3" />
          <div className="h-9 w-64 rounded bg-background-tertiary/60 mb-3" />
          <div className="h-4 w-full max-w-xl rounded bg-background-tertiary/40" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block w-72 shrink-0">
            <div className="rounded-xl border border-border/50 bg-background-secondary/50 backdrop-blur-sm card-shadow">
              <div className="border-b border-border/50 px-5 py-4" />
              <div className="px-5 py-4 space-y-4">
                <div className="h-4 w-20 rounded bg-background-tertiary/50" />
                <div className="h-24 w-full rounded bg-background-tertiary/30" />
                <div className="h-4 w-20 rounded bg-background-tertiary/50" />
                <div className="h-20 w-full rounded bg-background-tertiary/30" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="h-12 w-full rounded-xl border border-border/50 bg-background-secondary/50 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-xl border border-border/50 bg-background-secondary/30"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

