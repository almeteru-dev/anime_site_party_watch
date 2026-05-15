"use client"

import { Sparkles } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function CatalogHeader() {
  const { t } = useLanguage()

  return (
    <div className="mb-8 lg:mb-12">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-accent-primary" />
        <span className="text-sm font-medium text-accent-primary">{t.catalog.explore}</span>
      </div>
      <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3 text-balance">
        {t.catalog.title}
      </h1>
      <p className="text-foreground-muted max-w-2xl text-pretty">{t.catalog.subtitle}</p>
    </div>
  )
}

