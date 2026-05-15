"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import { searchAnimes, type AnimeSearchItem } from "@/lib/api"

export function NavbarAnimeSearch() {
	const router = useRouter()
	const { locale, t } = useLanguage()
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState("")
	const [items, setItems] = useState<AnimeSearchItem[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [activeIndex, setActiveIndex] = useState(-1)
	const rootRef = useRef<HTMLDivElement | null>(null)
	const inputRef = useRef<HTMLInputElement | null>(null)

	const canSearch = useMemo(() => query.trim().length >= 2, [query])

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 0)
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		const onDown = (e: MouseEvent) => {
			const el = rootRef.current
			if (!el) return
			if (e.target instanceof Node && el.contains(e.target)) return
			setIsOpen(false)
		}
		document.addEventListener("mousedown", onDown)
		return () => document.removeEventListener("mousedown", onDown)
	}, [isOpen])

	useEffect(() => {
		let cancelled = false
		if (!isOpen) return
		if (!canSearch) {
			setItems([])
			setActiveIndex(-1)
			return
		}
		setIsLoading(true)
		const handle = setTimeout(() => {
			;(async () => {
				try {
					const data = await searchAnimes({ q: query })
					if (cancelled) return
					setItems(data)
					setActiveIndex(data.length ? 0 : -1)
				} catch {
					if (cancelled) return
					setItems([])
					setActiveIndex(-1)
				} finally {
					if (!cancelled) setIsLoading(false)
				}
			})()
		}, 300)
		return () => {
			cancelled = true
			clearTimeout(handle)
		}
	}, [canSearch, isOpen, query])

	const displayTitle = (item: AnimeSearchItem) => {
		if (locale === "ru") return item.title_ru?.trim() || item.title_en?.trim() || item.url
		return item.title_en?.trim() || item.title_ru?.trim() || item.url
	}

	const secondaryTitle = (item: AnimeSearchItem) => {
		if (locale === "ru") {
			const v = item.title_en?.trim()
			return v && v !== displayTitle(item) ? v : ""
		}
		const v = item.title_ru?.trim()
		return v && v !== displayTitle(item) ? v : ""
	}

	const go = (item: AnimeSearchItem) => {
		setIsOpen(false)
		setQuery("")
		setItems([])
		setActiveIndex(-1)
		router.push(`/anime/${encodeURIComponent(item.url)}`)
	}

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			e.preventDefault()
			setIsOpen(false)
			return
		}
		if (!items.length) return
		if (e.key === "ArrowDown") {
			e.preventDefault()
			setActiveIndex((i) => {
				const next = i < 0 ? 0 : i + 1
				return next >= items.length ? 0 : next
			})
		}
		if (e.key === "ArrowUp") {
			e.preventDefault()
			setActiveIndex((i) => {
				const next = i <= 0 ? items.length - 1 : i - 1
				return next
			})
		}
		if (e.key === "Enter") {
			if (activeIndex >= 0 && activeIndex < items.length) {
				e.preventDefault()
				go(items[activeIndex])
			}
		}
	}

	return (
		<div ref={rootRef} className="relative">
			<div
				className={cn(
					"flex items-center transition-all duration-300 overflow-hidden",
					isOpen ? "w-56 lg:w-72" : "w-10"
				)}
			>
				{isOpen ? (
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={onKeyDown}
						placeholder={t.nav.searchPlaceholder}
						className="w-full h-10 pl-4 pr-10 bg-muted border border-border rounded-full text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
					/>
				) : null}
				<button
					onClick={() => setIsOpen((v) => !v)}
					className={cn(
						"w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200",
						isOpen ? "absolute right-0 hover:bg-transparent" : "hover:bg-muted"
					)}
					aria-label={isOpen ? "Close search" : "Open search"}
				>
					{isOpen ? (
						<X className="w-5 h-5 text-foreground-muted" />
					) : (
						<Search className="w-5 h-5 text-foreground-muted hover:text-primary transition-colors" />
					)}
				</button>
			</div>

			{isOpen ? (
				<div
					className={cn(
						"absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-background-secondary/95 backdrop-blur-xl shadow-xl overflow-hidden",
						"max-h-[360px] overflow-y-auto"
					)}
				>
					{!canSearch ? (
						<div className="px-4 py-3 text-sm text-foreground-muted">Type at least 2 characters.</div>
					) : isLoading ? (
						<div className="px-4 py-3 text-sm text-foreground-muted">Searching…</div>
					) : items.length === 0 ? (
						<div className="px-4 py-3 text-sm text-foreground-muted">No matches.</div>
					) : (
						<div className="py-2">
							{items.map((item, idx) => {
								const title = displayTitle(item)
								const sub = secondaryTitle(item)
								const isActive = idx === activeIndex
								return (
									<button
										key={item.id}
										onMouseEnter={() => setActiveIndex(idx)}
										onClick={() => go(item)}
										className={cn(
											"w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
											isActive ? "bg-primary/10" : "hover:bg-background-tertiary/40"
										)}
									>
										<div className="w-10 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
											{item.image_url ? (
												<img src={item.image_url} alt="" className="w-full h-full object-cover" />
											) : null}
										</div>
										<div className="min-w-0">
											<div className="text-sm font-semibold text-foreground truncate">{title}</div>
											{sub ? <div className="mt-0.5 text-xs text-foreground-muted truncate">{sub}</div> : null}
										</div>
									</button>
								)
							})}
						</div>
					)}
				</div>
			) : null}
		</div>
	)
}

