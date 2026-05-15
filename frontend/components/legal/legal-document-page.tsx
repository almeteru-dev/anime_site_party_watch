import { loadDocxAsHtml } from "@/lib/docx"

type LegalDocumentPageProps = {
  title: string
  filename: string
}

export async function LegalDocumentPage({ title, filename }: LegalDocumentPageProps) {
  let html: string | null = null

  try {
    html = await loadDocxAsHtml(filename)
  } catch (err) {
    console.error("LegalDocumentPage failed to load doc", { title, filename, err })
    html = null
  }

  return (
    <main className="pt-20 lg:pt-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
        </header>
        {html ? (
          <article className="legal-content" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="rounded-xl border border-border bg-background-secondary p-6">
            <p className="text-foreground-muted leading-relaxed">
              Unable to load the document content.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
