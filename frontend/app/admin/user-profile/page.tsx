"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Trash2, PlusCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
	adminAssignAchievementToUser,
	adminAssignTitleToUser,
	adminGetUserProfileByUsername,
	adminListAchievements,
	adminListTitles,
	adminUnassignAchievementFromUser,
	adminUnassignTitleFromUser,
	type Achievement,
	type Title,
} from "@/lib/api"
import { cn } from "@/lib/utils"

export default function AdminUserProfilePage() {
	const { user: me, isLoading } = useAuth()
	const router = useRouter()

	const isRoot = me?.role === "root"

	const [username, setUsername] = useState("")
	const [isBusy, setIsBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const [profile, setProfile] = useState<any | null>(null)
	const [allAchievements, setAllAchievements] = useState<Achievement[] | null>(null)
	const [allTitles, setAllTitles] = useState<Title[] | null>(null)

	const [pickAchId, setPickAchId] = useState<string>("")
	const [pickTitleId, setPickTitleId] = useState<string>("")

	useEffect(() => {
		if (isLoading) return
		if (!me) {
			router.push("/")
			return
		}
		if (!isRoot) router.push("/admin")
	}, [isLoading, isRoot, me, router])

	const loadCatalog = useCallback(async () => {
		try {
			const [a, t] = await Promise.all([adminListAchievements(), adminListTitles()])
			setAllAchievements(a)
			setAllTitles(t)
		} catch {
			setAllAchievements([])
			setAllTitles([])
		}
	}, [])

	useEffect(() => {
		if (!isRoot) return
		void loadCatalog()
	}, [isRoot, loadCatalog])

	const fetchProfile = useCallback(async () => {
		const q = username.trim()
		if (!q) {
			setError("Enter username")
			return
		}
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			const p = await adminGetUserProfileByUsername({ username: q })
			setProfile(p)
		} catch (e: any) {
			setProfile(null)
			setError(e?.message || "Failed to load user")
		} finally {
			setIsBusy(false)
		}
	}, [username])

	const userId = profile?.user?.id as number | undefined

	const registeredUtc = useMemo(() => {
		const raw = profile?.user?.created_at
		if (!raw) return null
		const d = new Date(raw)
		if (Number.isNaN(d.getTime())) return String(raw)
		const iso = d.toISOString()
		return iso.replace("T", " ").replace(".000Z", " UTC")
	}, [profile?.user?.created_at])

	const assignedAchIds = useMemo(() => new Set<number>((profile?.achievements || []).map((a: any) => a.id)), [profile])
	const assignedTitleIds = useMemo(() => new Set<number>((profile?.titles || []).map((t: any) => t.id)), [profile])

	const onAssignAchievement = async () => {
		if (!userId) return
		const id = Number(pickAchId)
		if (!Number.isFinite(id) || id <= 0) {
			setError("Select achievement")
			return
		}
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminAssignAchievementToUser({ user_id: userId, achievement_id: id })
			await fetchProfile()
			setNotice("Assigned")
		} catch (e: any) {
			setError(e?.message || "Failed to assign")
		} finally {
			setIsBusy(false)
		}
	}

	const onUnassignAchievement = async (achId: number) => {
		if (!userId) return
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminUnassignAchievementFromUser({ user_id: userId, achievement_id: achId })
			await fetchProfile()
			setNotice("Unassigned")
		} catch (e: any) {
			setError(e?.message || "Failed to unassign")
		} finally {
			setIsBusy(false)
		}
	}

	const onAssignTitle = async () => {
		if (!userId) return
		const id = Number(pickTitleId)
		if (!Number.isFinite(id) || id <= 0) {
			setError("Select title")
			return
		}
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminAssignTitleToUser({ user_id: userId, title_id: id })
			await fetchProfile()
			setNotice("Assigned")
		} catch (e: any) {
			setError(e?.message || "Failed to assign")
		} finally {
			setIsBusy(false)
		}
	}

	const onUnassignTitle = async (titleId: number) => {
		if (!userId) return
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminUnassignTitleFromUser({ user_id: userId, title_id: titleId })
			await fetchProfile()
			setNotice("Unassigned")
		} catch (e: any) {
			setError(e?.message || "Failed to unassign")
		} finally {
			setIsBusy(false)
		}
	}

	if (!isRoot) {
		return (
			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-6">
				<div className="text-lg font-semibold text-foreground">Нет доступа</div>
				<div className="text-sm text-foreground-muted mt-1">Только root может просматривать профили пользователей.</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<div className="text-2xl font-bold text-foreground">User profile</div>
				<div className="text-sm text-foreground-muted">Lookup by username and manage titles/achievements.</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="flex-1">
						<div className="text-xs text-foreground-muted">Username</div>
						<div className="mt-1 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2">
							<Search className="w-4 h-4 text-foreground-subtle" />
							<input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="almeteru"
								className="w-full bg-transparent text-sm text-foreground outline-none"
								onKeyDown={(e) => {
									if (e.key === "Enter") void fetchProfile()
								}}
							/>
						</div>
					</div>
					<button
						type="button"
						onClick={() => void fetchProfile()}
						disabled={isBusy}
						className={cn(
							"h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						Load
					</button>
				</div>
				{error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
				{notice ? <div className="mt-2 text-sm text-foreground-muted">{notice}</div> : null}
			</div>

			{profile?.user ? (
				<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div>
							<div className="text-sm font-semibold text-foreground">User</div>
							<div className="mt-3 space-y-2 text-sm">
								<div className="flex items-center justify-between gap-4"><span className="text-foreground-muted">Username</span><span className="text-foreground font-semibold">{profile.user.username}</span></div>
								<div className="flex items-center justify-between gap-4"><span className="text-foreground-muted">Email</span><span className="text-foreground">{profile.user.email}</span></div>
								<div className="flex items-center justify-between gap-4"><span className="text-foreground-muted">Role</span><span className="text-foreground">{profile.user.role}</span></div>
								<div className="flex items-center justify-between gap-4"><span className="text-foreground-muted">Registered (UTC)</span><span className="text-foreground">{registeredUtc}</span></div>
							</div>
						</div>

						<div className="space-y-4">
							<div className="rounded-2xl border border-border/60 bg-background p-4">
								<div className="text-sm font-semibold text-foreground">Achievements</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{(profile.achievements || []).length === 0 ? (
										<div className="text-sm text-foreground-muted">No achievements</div>
									) : (
										(profile.achievements as Achievement[]).map((a) => (
											<div key={a.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background-secondary/40 px-3 py-2">
												<span className="text-xs text-foreground">{a.code}</span>
												<button
													type="button"
													onClick={() => void onUnassignAchievement(a.id)}
													disabled={isBusy}
													className={cn(
														"h-8 w-8 inline-flex items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/15",
														isBusy && "opacity-60 cursor-not-allowed"
													)}
													aria-label="Remove"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										))
									)}
								</div>
								<div className="mt-3 flex flex-col sm:flex-row gap-2">
									<select
										value={pickAchId}
										onChange={(e) => setPickAchId(e.target.value)}
										className="h-10 flex-1 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
									>
										<option value="">Select achievement…</option>
										{(allAchievements || []).map((a) => (
											<option key={a.id} value={String(a.id)} disabled={assignedAchIds.has(a.id)}>
												{a.code}
											</option>
										))}
									</select>
									<button
										type="button"
										onClick={() => void onAssignAchievement()}
										disabled={isBusy}
										className={cn(
											"h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2",
											isBusy && "opacity-60 cursor-not-allowed"
										)}
									>
										<PlusCircle className="w-4 h-4" />
										Add
									</button>
								</div>
							</div>

							<div className="rounded-2xl border border-border/60 bg-background p-4">
								<div className="text-sm font-semibold text-foreground">Titles</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{(profile.titles || []).length === 0 ? (
										<div className="text-sm text-foreground-muted">No titles</div>
									) : (
										(profile.titles as Title[]).map((t) => (
											<div key={t.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background-secondary/40 px-3 py-2">
												<span className="text-xs text-foreground">{t.code}</span>
												<button
													type="button"
													onClick={() => void onUnassignTitle(t.id)}
													disabled={isBusy}
													className={cn(
														"h-8 w-8 inline-flex items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/15",
														isBusy && "opacity-60 cursor-not-allowed"
													)}
													aria-label="Remove"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										))
									)}
								</div>
								<div className="mt-3 flex flex-col sm:flex-row gap-2">
									<select
										value={pickTitleId}
										onChange={(e) => setPickTitleId(e.target.value)}
										className="h-10 flex-1 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
									>
										<option value="">Select title…</option>
										{(allTitles || []).map((t) => (
											<option key={t.id} value={String(t.id)} disabled={assignedTitleIds.has(t.id)}>
												{t.code}
											</option>
										))}
									</select>
									<button
										type="button"
										onClick={() => void onAssignTitle()}
										disabled={isBusy}
										className={cn(
											"h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2",
											isBusy && "opacity-60 cursor-not-allowed"
										)}
									>
										<PlusCircle className="w-4 h-4" />
										Add
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	)
}
