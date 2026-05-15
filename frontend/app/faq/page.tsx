"use client"

import { useEffect, useMemo, useState } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getPublicFAQ, type FAQItem } from "@/lib/api"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

export default function FAQPage() {
	const { locale, t } = useLanguage()
	const [items, setItems] = useState<FAQItem[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [open, setOpen] = useState<string | undefined>(undefined)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const data = await getPublicFAQ()
				if (!mounted) return
				setItems(data)
			} catch (e: any) {
				if (!mounted) return
				setError(e.message || "Failed to load")
				setItems([])
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	useEffect(() => {
		const id = window.location.hash.replace(/^#/, "")
		if (!id) return
		setOpen(id)
	}, [])

	const sorted = useMemo(() => {
		return (items || []).slice().sort((a, b) => {
			if (a.priority !== b.priority) return a.priority - b.priority
			return b.id - a.id
		})
	}, [items])

	return (
		<div className="min-h-screen pt-24 pb-16">
			<div className="max-w-3xl mx-auto px-4 sm:px-6">
				<div className="mb-4">
					<Link
						href="/"
						className="inline-flex h-10 items-center justify-center rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-secondary/60"
					>
						{t.faqPage.back}
					</Link>
				</div>
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground">FAQ</h1>
					<p className="mt-2 text-sm text-foreground-muted">
						{t.faqPage.subtitle}
					</p>
				</div>

				{error ? (
					<div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
						{error}
					</div>
				) : null}

				{items === null ? (
					<div className="rounded-2xl border border-border/60 bg-background-secondary/40 px-5 py-8 text-sm text-foreground-muted">
						Loading…
					</div>
				) : sorted.length === 0 ? (
					<div className="rounded-2xl border border-border/60 bg-background-secondary/40 px-5 py-8 text-sm text-foreground-muted">
						{t.faqPage.empty}
					</div>
				) : (
					<div className="rounded-2xl border border-border/60 bg-background-secondary/40 overflow-hidden">
						<Accordion
							type="single"
							collapsible
							value={open}
							onValueChange={(v) => {
								setOpen(v)
								if (typeof window !== "undefined") {
									if (v) window.history.replaceState(null, "", `#${v}`)
									else window.history.replaceState(null, "", window.location.pathname)
								}
							}}
						>
							{sorted.map((item) => {
								const value = `faq-${item.id}`
								const q =
									locale === "ru" && item.question_ru && item.question_ru.trim()
										? item.question_ru
										: item.question
								const a =
									locale === "ru" && item.answer_ru && item.answer_ru.trim()
										? item.answer_ru
										: item.answer
								return (
									<AccordionItem key={item.id} value={value} id={value} className="px-4 sm:px-6">
										<AccordionTrigger className="text-base text-foreground hover:no-underline">
											{q}
										</AccordionTrigger>
										<AccordionContent className="text-foreground-muted">
											<div className="whitespace-pre-wrap leading-relaxed">{a}</div>
										</AccordionContent>
									</AccordionItem>
								)
							})}
						</Accordion>
					</div>
				)}
			</div>
		</div>
	)
}
