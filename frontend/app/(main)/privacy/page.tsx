import type { Metadata } from "next"
import { LegalDocumentPage } from "@/components/legal/legal-document-page"
import { legalDocuments } from "@/lib/legal-documents"

export const metadata: Metadata = {
  title: `LycorisLib — ${legalDocuments.privacy.title}`,
  description: legalDocuments.privacy.description,
}

export const dynamic = "force-dynamic"

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title={legalDocuments.privacy.title}
      filename={legalDocuments.privacy.filename}
    />
  )
}
