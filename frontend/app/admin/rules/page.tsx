"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Save, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { adminCreateRule, adminDeleteRule, adminListRules, adminUpdateRule, type RuleItem } from "@/lib/api"
import { cn } from "@/lib/utils"

type RuleForm = {
	body_en: string
	body_ru: string
	body_uk: string
}

const emptyForm: RuleForm = { body_en: "", body_ru: "", body_uk: "" }

function trimOrEmpty(s: string): string {
	return (s || "").trim()
}

export default function AdminRulesPage() {
	const { user: me, isLoading } = useAuth()
	const router = useRouter()
	const isRoot = me?.role === "root"

	const [items, setItems] = useState<RuleItem[] | null>(null)
	const [isBusy, setIsBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const [form, setForm] = useState<RuleForm>(emptyForm)
	const [editingId, setEditingId] = useState<number | null>(null)

	useEffect(() => {
		if (isLoading) return
		if (!me) {
			router.push("/")
			return
		}
		if (!isRoot) router.push("/admin")
	}, [isLoading, isRoot, me, router])

	const load = async () => {
		setError(null)
		try {
			const res = await adminListRules()
			setItems(res)
		} catch (e: any) {
			setError(e?.message || "Failed to load rules")
			setItems([])
		}
	}

	useEffect(() => {
		if (!isRoot) return
		void load()
	}, [isRoot])

	const isValid = useMemo(() => {
		const en = trimOrEmpty(form.body_en)
		if (!en) return false
		if (en.length > 10000) return false
		if (trimOrEmpty(form.body_ru).length > 10000) return false
		if (trimOrEmpty(form.body_uk).length > 10000) return false
		return true
	}, [form])

	const openCreate = () => {
		setEditingId(null)
		setForm(emptyForm)
		setError(null)
		setNotice(null)
	}

	const openEdit = (r: RuleItem) => {
		setEditingId(r.id)
		setForm({ body_en: r.body_en, body_ru: r.body_ru || "", body_uk: r.body_uk || "" })
		setError(null)
		setNotice(null)
	}

	const onSave = async () => {
		const en = trimOrEmpty(form.body_en)
		const ru = trimOrEmpty(form.body_ru)
		const uk = trimOrEmpty(form.body_uk)
		if (!en) {
			setError("English text is required")
			return
		}
		if (en.length > 10000 || ru.length > 10000 || uk.length > 10000) {
			setError("Text is too long")
			return
		}

		setIsBusy(true)
		setError(null)
		setNotice(null)
		try {
			if (editingId === null) {
				await adminCreateRule({ body_en: en, body_ru: ru, body_uk: uk })
				setNotice("Created")
			} else {
				await adminUpdateRule({ id: editingId, input: { body_en: en, body_ru: ru, body_uk: uk } })
				setNotice("Saved")
			}
			await load()
			openCreate()
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setIsBusy(false)
		}
	}

	const onDelete = async (id: number) => {
		const ok = window.confirm("Delete this rule?")
		if (!ok) return
		setIsBusy(true)
		setError(null)
		setNotice(null)
		try {
			await adminDeleteRule({ id })
			await load()
			setNotice("Deleted")
			if (editingId === id) openCreate()
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setIsBusy(false)
		}
	}

	if (!isRoot) {
		return (
			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-6">
				<div className="text-lg font-semibold text-foreground">Нет доступа</div>
				<div className="text-sm text-foreground-muted mt-1">Только root может управлять правилами.</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="text-2xl font-bold text-foreground">Rules</div>
					<div className="text-sm text-foreground-muted">Manage /rules content (root)</div>
				</div>
				<button
					type="button"
					onClick={openCreate}
					className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
				>
					<PlusCircle className="w-4 h-4" />
					New rule
				</button>
			</div>

			{error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
			{notice ? <div className="text-sm text-foreground-muted">{notice}</div> : null}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
					<div className="text-sm font-semibold text-foreground">Editor</div>
					<div className="mt-1 text-xs text-foreground-muted">EN required. RU/UK optional; fallback to EN. Limit: 10,000 chars.</div>
					<div className="mt-4 space-y-3">
						<div>
							<div className="text-xs text-foreground-muted">EN</div>
							<textarea
								value={form.body_en}
								onChange={(e) => setForm({ ...form, body_en: e.target.value })}
								maxLength={10000}
								className="mt-1 min-h-40 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none"
							/>
							<div className="mt-1 text-xs text-foreground-muted">{form.body_en.length}/10000</div>
						</div>
						<div>
							<div className="text-xs text-foreground-muted">RU</div>
							<textarea
								value={form.body_ru}
								onChange={(e) => setForm({ ...form, body_ru: e.target.value })}
								maxLength={10000}
								className="mt-1 min-h-28 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none"
							/>
							<div className="mt-1 text-xs text-foreground-muted">{form.body_ru.length}/10000</div>
						</div>
						<div>
							<div className="text-xs text-foreground-muted">UK</div>
							<textarea
								value={form.body_uk}
								onChange={(e) => setForm({ ...form, body_uk: e.target.value })}
								maxLength={10000}
								className="mt-1 min-h-28 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none"
							/>
							<div className="mt-1 text-xs text-foreground-muted">{form.body_uk.length}/10000</div>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={onSave}
							disabled={isBusy || !isValid}
							className={cn(
								"h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2",
								(isBusy || !isValid) && "opacity-60 cursor-not-allowed"
							)}
						>
							<Save className="w-4 h-4" />
							Save
						</button>
					</div>
				</div>

				<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
					<div className="text-sm font-semibold text-foreground">Rules list</div>
					<div className="mt-4 space-y-3">
						{items === null ? (
							<div className="text-sm text-foreground-muted">Loading…</div>
						) : items.length === 0 ? (
							<div className="text-sm text-foreground-muted">No rules yet.</div>
						) : (
							items.map((r) => (
								<div key={r.id} className="rounded-2xl border border-border/60 bg-background p-4">
									<div className="flex items-start justify-between gap-3">
										<div>
											<div className="text-xs text-foreground-muted">#{r.id}</div>
											<div className="mt-1 text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{r.body_en}</div>
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => openEdit(r)}
												disabled={isBusy}
												className={cn(
													"h-9 rounded-xl border border-border/60 bg-background px-3 text-xs font-semibold text-foreground hover:bg-background-secondary/40",
													isBusy && "opacity-60 cursor-not-allowed"
												)}
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => void onDelete(r.id)}
												disabled={isBusy}
												className={cn(
													"h-9 rounded-xl border border-red-500/40 bg-red-500/10 px-3 text-xs font-semibold text-red-300 hover:bg-red-500/15",
													isBusy && "opacity-60 cursor-not-allowed"
												)}
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

