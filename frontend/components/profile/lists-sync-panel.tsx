"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { clearMyCollections, downloadShikimoriExport, importCollectionsFromJson, importShikimoriCollections, type ShikimoriImportMode } from "@/lib/api"
import { cn } from "@/lib/utils"

export function ListsSyncPanel({
	onChanged,
}: {
	onChanged?: () => Promise<void> | void
}) {
	const { user } = useAuth()
	const { t } = useLanguage()
	const [onExisting, setOnExisting] = useState<ShikimoriImportMode>("replace")
	const [isImportingShiki, setIsImportingShiki] = useState(false)
	const [isImportingJson, setIsImportingJson] = useState(false)
	const [isClearing, setIsClearing] = useState(false)
	const [jsonFile, setJsonFile] = useState<File | null>(null)
	const [msg, setMsg] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleExport = async () => {
		if (!user) return
		setError(null)
		try {
			const blob = await downloadShikimoriExport()
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = `shikimori_animes_${user.id}.json`
			a.click()
			URL.revokeObjectURL(url)
		} catch (e: any) {
			setError(e?.message || "Failed")
		}
	}

	const handleClear = async () => {
		if (!user) return
		setError(null)
		setMsg(null)
		setIsClearing(true)
		try {
			await clearMyCollections()
			await onChanged?.()
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setIsClearing(false)
		}
	}

	const handleShikiImport = async () => {
		if (!user) return
		setError(null)
		setMsg(null)
		setIsImportingShiki(true)
		try {
			const res = await importShikimoriCollections({ onExisting })
			setMsg(`${res.imported + res.updated} · +${res.created_anime} · ${res.skipped_existing}`)
			await onChanged?.()
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setIsImportingShiki(false)
		}
	}

	const handleJsonImport = async () => {
		if (!user) return
		if (!jsonFile) return
		setError(null)
		setMsg(null)
		setIsImportingJson(true)
		try {
			const res = await importCollectionsFromJson({ file: jsonFile, onExisting })
			setMsg(`${res.imported + res.updated} · +${res.created_anime} · ${res.skipped_existing}`)
			await onChanged?.()
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setIsImportingJson(false)
		}
	}

	if (!user) return null

	return (
		<div className="rounded-2xl border border-border/50 bg-background-secondary/40 p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="text-sm font-semibold text-foreground">{t.profile.importFromShikimori}</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleExport}
						className="h-10 rounded-xl border border-border/60 bg-background-secondary/40 px-4 text-sm font-semibold text-foreground-muted hover:text-foreground"
					>
						{t.profile.exportToJson}
					</button>
					<button
						type="button"
						onClick={handleClear}
						disabled={isClearing}
						className={cn(
							"h-10 rounded-xl border px-4 text-sm font-semibold",
							isClearing
								? "border-red-500/20 bg-red-500/10 text-red-300/70 cursor-not-allowed"
								: "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/15"
						)}
					>
						{isClearing ? t.profile.clearing : t.profile.clearLists}
					</button>
				</div>
			</div>

			<div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
				<div className="min-w-0">
					<div className="h-10 w-full rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground flex items-center">
						{t.profile.shikimoriUsername}: {user.username || "—"}
					</div>

					<div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-xs text-foreground-subtle">{t.profile.importExistingLabel}</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setOnExisting("replace")}
								className={cn(
									"h-10 rounded-xl border px-4 text-sm font-semibold transition-colors",
									onExisting === "replace"
										? "bg-primary text-primary-foreground border-primary/30"
										: "bg-background-secondary/40 text-foreground-muted border-border/60 hover:text-foreground"
								)}
							>
								{t.profile.importReplace}
							</button>
							<button
								type="button"
								onClick={() => setOnExisting("skip")}
								className={cn(
									"h-10 rounded-xl border px-4 text-sm font-semibold transition-colors",
									onExisting === "skip"
										? "bg-primary text-primary-foreground border-primary/30"
										: "bg-background-secondary/40 text-foreground-muted border-border/60 hover:text-foreground"
								)}
							>
								{t.profile.importSkip}
							</button>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3">
					{msg ? <div className="text-xs text-foreground-subtle">{msg}</div> : null}
					<button
						type="button"
						onClick={handleShikiImport}
						disabled={isImportingShiki}
						className={cn(
							"h-10 rounded-xl px-5 text-sm font-semibold whitespace-nowrap",
							isImportingShiki
								? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
								: "bg-primary text-primary-foreground hover:bg-primary/90"
						)}
					>
						{isImportingShiki ? t.profile.importingShikimori : t.profile.importFromShikimori}
					</button>
				</div>
			</div>

			<div className="mt-4 border-t border-border/40 pt-4">
				<div className="text-sm font-semibold text-foreground">{t.profile.importFromJson}</div>
				<div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
					<div className="min-w-0">
						<input
							type="file"
							accept="application/json"
							onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
							className="h-10 w-full rounded-xl bg-background border border-border/60 px-3 text-sm text-foreground outline-none focus:border-primary/50 file:mr-4 file:rounded-lg file:border-0 file:bg-muted/40 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
						/>
					</div>
					<div className="flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={handleJsonImport}
							disabled={isImportingJson || !jsonFile}
							className={cn(
								"h-10 rounded-xl px-5 text-sm font-semibold whitespace-nowrap",
								isImportingJson || !jsonFile
									? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
									: "bg-primary text-primary-foreground hover:bg-primary/90"
							)}
						>
							{isImportingJson ? t.profile.importingJson : t.profile.importFromJson}
						</button>
					</div>
				</div>
			</div>

			{error ? <div className="mt-3 text-xs text-red-400">{error}</div> : null}
		</div>
	)
}

