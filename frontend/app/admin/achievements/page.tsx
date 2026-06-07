"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trophy } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
	adminCreateAchievement,
	adminDeleteAchievement,
	adminBulkAssignAchievementByRegisteredBefore,
	adminBulkAssignAchievementByRole,
	adminBulkUnassignAchievementByRole,
	adminListAchievements,
	adminUpdateAchievement,
	type Achievement,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { AchievementModal, type AchievementForm } from "@/components/admin/achievements/AchievementModal"
import { AchievementsTable } from "@/components/admin/achievements/AchievementsTable"
import { UserAchievementAssigner } from "@/components/admin/achievements/UserAchievementAssigner"

const emptyForm: AchievementForm = { code: "", name_en: "", name_ru: "", name_uk: "", color: "#3B82F6" }

type Tab = "catalog" | "assign"

export default function AdminAchievementsPage() {
	const { user: me, isLoading } = useAuth()
	const router = useRouter()

	const [tab, setTab] = useState<Tab>("catalog")
	const [items, setItems] = useState<Achievement[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [isBusy, setIsBusy] = useState(false)

	const [modalOpen, setModalOpen] = useState(false)
	const [modalError, setModalError] = useState<string | null>(null)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [form, setForm] = useState<AchievementForm>(emptyForm)
	const [bulkAchId, setBulkAchId] = useState<string>("")
	const [bulkRole, setBulkRole] = useState<"user" | "moderator" | "admin">("user")
	const [bulkDate, setBulkDate] = useState<string>("")
	const [bulkNotice, setBulkNotice] = useState<string | null>(null)
	const [bulkRemoveNotice, setBulkRemoveNotice] = useState<string | null>(null)

	const isRoot = me?.role === "root"

	useEffect(() => {
		if (isLoading) return
		if (!me) {
			router.push("/")
			return
		}
		if (!isRoot) {
			router.push("/admin")
		}
	}, [isLoading, me, isRoot, router])

	const load = useCallback(async () => {
		setError(null)
		try {
			const res = await adminListAchievements()
			setItems([...res].sort((a, b) => a.id - b.id))
		} catch (e: any) {
			setError(e?.message || "Failed to load achievements")
			setItems([])
		}
	}, [])

	useEffect(() => {
		if (!isRoot) return
		void load()
	}, [isRoot, load])

	const openCreate = () => {
		setModalError(null)
		setEditingId(null)
		setForm(emptyForm)
		setModalOpen(true)
	}

	const openEdit = (a: Achievement) => {
		setModalError(null)
		setEditingId(a.id)
		setForm({ code: a.code, name_en: a.name_en, name_ru: a.name_ru || "", name_uk: a.name_uk || "", color: a.color })
		setModalOpen(true)
	}

	const submit = async () => {
		const code = form.code.trim()
		const nameEn = form.name_en.trim()
		const color = form.color.trim()
		if (!code) {
			setModalError("Code is required")
			return
		}
		if (!nameEn) {
			setModalError("English name is required")
			return
		}
		if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
			setModalError("Color must be a hex value like #3B82F6")
			return
		}
		setIsBusy(true)
		setModalError(null)
		try {
			const input = {
				code,
				name_en: nameEn,
				name_ru: form.name_ru.trim(),
				name_uk: form.name_uk.trim(),
				color,
			}
			if (editingId === null) {
				await adminCreateAchievement(input)
			} else {
				await adminUpdateAchievement({ id: editingId, input })
			}
			setModalOpen(false)
			await load()
		} catch (e: any) {
			setModalError(e?.message || "Failed to save")
		} finally {
			setIsBusy(false)
		}
	}

	const onDelete = async (a: Achievement) => {
		const ok = window.confirm(`Delete achievement ${a.code}? This will unassign it from users.`)
		if (!ok) return
		setIsBusy(true)
		setError(null)
		try {
			await adminDeleteAchievement({ id: a.id })
			await load()
		} catch (e: any) {
			setError(e?.message || "Failed to delete")
		} finally {
			setIsBusy(false)
		}
	}

	const onBulkByRole = async () => {
		const id = Number(bulkAchId)
		if (!Number.isFinite(id) || id <= 0) {
			setError("Select an achievement")
			return
		}
		setError(null)
		setBulkNotice(null)
		const ok = window.confirm(`Assign this achievement to all users with role ${bulkRole}?`)
		if (!ok) return
		setIsBusy(true)
		try {
			const r = await adminBulkAssignAchievementByRole({ id, role: bulkRole })
			setBulkNotice(`Assigned to ${r.assigned_count} users`)
		} catch (e: any) {
			setError(e?.message || "Failed to assign")
		} finally {
			setIsBusy(false)
		}
	}

	const onBulkRemoveByRole = async () => {
		const id = Number(bulkAchId)
		if (!Number.isFinite(id) || id <= 0) {
			setError("Select an achievement")
			return
		}
		setError(null)
		setBulkRemoveNotice(null)
		const ok = window.confirm(`Remove this achievement from all users with role ${bulkRole}?`)
		if (!ok) return
		setIsBusy(true)
		try {
			const r = await adminBulkUnassignAchievementByRole({ id, role: bulkRole })
			setBulkRemoveNotice(`Removed from ${r.removed_count} users`)
		} catch (e: any) {
			setError(e?.message || "Failed to unassign")
		} finally {
			setIsBusy(false)
		}
	}

	const onBulkByDate = async () => {
		const id = Number(bulkAchId)
		if (!Number.isFinite(id) || id <= 0) {
			setError("Select an achievement")
			return
		}
		const date = bulkDate.trim()
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			setError("Pick a date")
			return
		}
		setError(null)
		setBulkNotice(null)
		const ok = window.confirm(`Assign this achievement to all users registered before ${date}?`)
		if (!ok) return
		setIsBusy(true)
		try {
			const r = await adminBulkAssignAchievementByRegisteredBefore({ id, registered_before: date })
			setBulkNotice(`Assigned to ${r.assigned_count} users`)
		} catch (e: any) {
			setError(e?.message || "Failed to assign")
		} finally {
			setIsBusy(false)
		}
	}

	const rows = items ?? []

	const tabs = useMemo(
		() =>
			[
				{ id: "catalog" as const, label: "Достижения" },
				{ id: "assign" as const, label: "Назначение" },
			],
		[]
	)

	if (!isRoot) {
		return (
			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-6">
				<div className="text-lg font-semibold text-foreground">Нет доступа</div>
				<div className="text-sm text-foreground-muted mt-1">Только root может управлять достижениями.</div>
			</div>
		)
	}

	return (
		<div>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Achievements</h1>
					<p className="text-sm text-foreground-muted">CRUD достижений и назначение пользователям (root)</p>
				</div>

				{tab === "catalog" ? (
					<button
						onClick={openCreate}
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
					>
						<PlusCircle className="w-4 h-4" />
						Create
					</button>
				) : null}
			</div>

			<div className="mt-6 rounded-2xl border border-border/60 bg-background-secondary/40">
				<div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
					<div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
						<Trophy className="w-4 h-4 text-primary" />
					</div>
					<div className="flex items-center gap-2">
						{tabs.map((t) => (
							<button
								key={t.id}
								onClick={() => setTab(t.id)}
								className={cn(
									"h-9 rounded-xl px-3 text-sm font-semibold border",
									tab === t.id
										? "bg-primary/15 border-primary/30 text-primary"
										: "bg-background border-border/60 text-foreground-muted hover:text-foreground hover:bg-background-tertiary/40"
								)}
							>
								{t.label}
							</button>
						))}
					</div>
					<div className="ml-auto text-xs text-foreground-muted">
						{items === null ? "Loading…" : `${rows.length} total`}
					</div>
				</div>

				{error ? <div className="px-4 py-3 text-sm text-red-400 border-b border-red-500/30 bg-red-500/10">{error}</div> : null}

				{tab === "catalog" ? (
					items === null ? (
						<div className="p-6 text-sm text-foreground-muted">Loading…</div>
					) : rows.length === 0 ? (
						<div className="p-6 text-sm text-foreground-muted">No achievements yet.</div>
					) : (
						<div className="p-4">
							<div className="rounded-2xl border border-border/60 bg-background p-4">
								<div className="text-sm font-semibold text-foreground">Bulk assign</div>
								<div className="mt-1 text-xs text-foreground-muted">Assign a selected achievement to many users at once.</div>
								<div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
									<div>
										<div className="text-xs text-foreground-muted">Achievement</div>
										<select
											value={bulkAchId}
											onChange={(e) => setBulkAchId(e.target.value)}
											className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
										>
											<option value="">Select…</option>
											{rows.map((a) => (
												<option key={a.id} value={String(a.id)}>
													{a.code}
												</option>
											))}
										</select>
									</div>
									<div>
										<div className="text-xs text-foreground-muted">Role</div>
										<select
											value={bulkRole}
											onChange={(e) => setBulkRole(e.target.value as any)}
											className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
										>
											<option value="user">User</option>
											<option value="moderator">Moderator</option>
											<option value="admin">Admin</option>
										</select>
										<button
											type="button"
											onClick={onBulkByRole}
											disabled={isBusy}
											className={cn(
												"mt-2 h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
												isBusy && "opacity-60 cursor-not-allowed"
											)}
										>
											Assign to role
										</button>
										<button
											type="button"
											onClick={onBulkRemoveByRole}
											disabled={isBusy}
											className={cn(
												"mt-2 h-10 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/15",
												isBusy && "opacity-60 cursor-not-allowed"
											)}
										>
											Unassign from role
										</button>
									</div>
									<div>
										<div className="text-xs text-foreground-muted">Registered before</div>
										<input
											type="date"
											value={bulkDate}
											onChange={(e) => setBulkDate(e.target.value)}
											className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
										/>
										<button
											type="button"
											onClick={onBulkByDate}
											disabled={isBusy}
											className={cn(
												"mt-2 h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
												isBusy && "opacity-60 cursor-not-allowed"
											)}
										>
											Assign by date
										</button>
									</div>
								</div>
								{bulkNotice ? <div className="mt-3 text-xs text-foreground-muted">{bulkNotice}</div> : null}
								{bulkRemoveNotice ? <div className="mt-1 text-xs text-foreground-muted">{bulkRemoveNotice}</div> : null}
							</div>

							<div className="mt-4">
								<AchievementsTable items={rows} isBusy={isBusy} onEdit={openEdit} onDelete={onDelete} />
							</div>
						</div>
					)
				) : (
					<div className="p-4">
						<UserAchievementAssigner />
					</div>
				)}
			</div>

			<AchievementModal
				open={modalOpen}
				title={editingId === null ? "Create achievement" : "Edit achievement"}
				isBusy={isBusy}
				error={modalError}
				form={form}
				onClose={() => setModalOpen(false)}
				onChange={setForm}
				onSubmit={submit}
			/>
		</div>
	)
}
