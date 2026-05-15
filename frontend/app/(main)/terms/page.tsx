import type { Metadata } from "next"
import { LegalDocumentPage } from "@/components/legal/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: `LycorisLib — ${legalDocuments.terms.title}`,
  description: legalDocuments.terms.description,
}

export const dynamic = "force-dynamic"

export default function TermsPage() {
  return (
    <LegalDocumentPage
      title={legalDocuments.terms.title}
      filename={legalDocuments.terms.filename}
    />
  )
}
