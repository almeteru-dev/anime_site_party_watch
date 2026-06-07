"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { listRules, type RuleItem } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"

function pickLocalized(locale: string, item: RuleItem): string {
	if (locale === "ru") return (item.body_ru && item.body_ru.trim()) || item.body_en
	if (locale === "uk") return (item.body_uk && item.body_uk.trim()) || item.body_en
	return item.body_en
}

export default function RulesPage() {
	const { locale, t } = useLanguage()
	const [items, setItems] = useState<RuleItem[] | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		void (async () => {
			try {
				const r = await listRules()
				if (!mounted) return
				setItems(r)
			} catch (e: any) {
				if (!mounted) return
				setError(e?.message || "Failed to load rules")
				setItems([])
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	const rendered = useMemo(() => {
		if (!items) return []
		return items.map((r) => ({ id: r.id, text: pickLocalized(locale, r) }))
	}, [items, locale])

	return (
		<div className="min-h-screen pt-24 pb-16">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-4">
					<Link
						href="/"
						className="inline-flex h-10 items-center justify-center rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-secondary/60"
					>
						{t.faqPage.back}
					</Link>
				</div>
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground">Rules</h1>
					<p className="mt-2 text-sm text-foreground-muted">Site rules and guidelines.</p>
				</div>
			{error ? <div className="mt-6 text-sm text-red-300">{error}</div> : null}
			<div className="mt-8 space-y-6">
				{items === null ? (
					<div className="text-sm text-foreground-muted">Loading…</div>
				) : rendered.length === 0 ? (
					<div className="text-sm text-foreground-muted">No rules yet.</div>
				) : (
					rendered.map((r) => (
						<div key={r.id} className="rounded-2xl border border-border/60 bg-background-secondary/40 p-6">
							<div className="whitespace-pre-wrap text-sm text-foreground">{r.text}</div>
						</div>
					))
				)}
			</div>
			</div>
		</div>
	)
}
