import type { Metadata } from "next"
import { LegalDocumentPage } from "@/components/legal/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: `LycorisLib — ${legalDocuments.dmca.title}`,
  description: legalDocuments.dmca.description,
}

export const dynamic = "force-dynamic"

export default function DmcaPage() {
  return (
    <LegalDocumentPage
      title={legalDocuments.dmca.title}
      filename={legalDocuments.dmca.filename}
    />
  )
}
