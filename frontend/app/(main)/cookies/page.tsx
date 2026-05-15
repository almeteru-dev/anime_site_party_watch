import type { Metadata } from "next"
import { LegalDocumentPage } from "@/components/legal/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: `LycorisLib — ${legalDocuments.cookies.title}`,
  description: legalDocuments.cookies.description,
}

export const dynamic = "force-dynamic"

export default function CookiesPage() {
  return (
    <LegalDocumentPage
      title={legalDocuments.cookies.title}
      filename={legalDocuments.cookies.filename}
    />
  )
}
