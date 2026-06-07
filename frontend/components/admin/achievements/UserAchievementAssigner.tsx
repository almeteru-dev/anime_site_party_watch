"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Search, User, X, Plus } from "lucide-react"
import {
	adminAssignAchievementToUser,
	adminGetUserAchievements,
	adminListAchievements,
	adminListUsers,
	adminUnassignAchievementFromUser,
	type Achievement,
	type AdminUser,
} from "@/lib/api"
import { cn } from "@/lib/utils"

function sortById<T extends { id: number }>(items: T[]): T[] {
	return [...items].sort((a, b) => a.id - b.id)
}

export function UserAchievementAssigner() {
	const [query, setQuery] = useState("")
	const [userResults, setUserResults] = useState<AdminUser[] | null>(null)
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

	const [all, setAll] = useState<Achievement[] | null>(null)
	const [assigned, setAssigned] = useState<Achievement[] | null>(null)

	const [error, setError] = useState<string | null>(null)
	const [isBusy, setIsBusy] = useState(false)

	const fetchSeq = useRef(0)
	const debounce = useRef<number | null>(null)

	const loadAllAchievements = useCallback(async () => {
		try {
			const items = await adminListAchievements()
			setAll(sortById(items))
		} catch (e: any) {
			setError(e?.message || "Failed to load achievements")
			setAll([])
		}
	}, [])

	const loadAssigned = useCallback(async (userId: number) => {
		try {
			const items = await adminGetUserAchievements({ user_id: userId })
			setAssigned(sortById(items))
		} catch (e: any) {
			setError(e?.message || "Failed to load user achievements")
			setAssigned([])
		}
	}, [])

	useEffect(() => {
		void loadAllAchievements()
	}, [loadAllAchievements])

	useEffect(() => {
		if (!selectedUser) return
		void loadAssigned(selectedUser.id)
	}, [selectedUser, loadAssigned])

	const effectiveQuery = useMemo(() => query.trim(), [query])

	useEffect(() => {
		if (debounce.current) window.clearTimeout(debounce.current)
		if (!effectiveQuery) {
			setUserResults(null)
			return
		}
		debounce.current = window.setTimeout(async () => {
			const seq = ++fetchSeq.current
			setError(null)
			try {
				const res = await adminListUsers({ q: effectiveQuery, role: "all", status: "all", page: 1, limit: 15 })
				if (seq !== fetchSeq.current) return
				setUserResults(res.users)
			} catch (e: any) {
				if (seq !== fetchSeq.current) return
				setError(e?.message || "Failed to search users")
				setUserResults([])
			}
		}, 250)
		return () => {
			if (debounce.current) window.clearTimeout(debounce.current)
		}
	}, [effectiveQuery])

	const assignedIds = useMemo(() => new Set((assigned || []).map((a) => a.id)), [assigned])
	const available = useMemo(() => {
		if (!all) return null
		return all.filter((a) => !assignedIds.has(a.id))
	}, [all, assignedIds])

	const assign = useCallback(
		async (achievementId: number) => {
			if (!selectedUser) return
			setIsBusy(true)
			setError(null)
			try {
				await adminAssignAchievementToUser({ user_id: selectedUser.id, achievement_id: achievementId })
				await loadAssigned(selectedUser.id)
			} catch (e: any) {
				setError(e?.message || "Failed to assign achievement")
			} finally {
				setIsBusy(false)
			}
		},
		[selectedUser, loadAssigned]
	)

	const unassign = useCallback(
		async (achievementId: number) => {
			if (!selectedUser) return
			setIsBusy(true)
			setError(null)
			try {
				await adminUnassignAchievementFromUser({ user_id: selectedUser.id, achievement_id: achievementId })
				await loadAssigned(selectedUser.id)
			} catch (e: any) {
				setError(e?.message || "Failed to unassign achievement")
			} finally {
				setIsBusy(false)
			}
		},
		[selectedUser, loadAssigned]
	)

	const assignedContent = useMemo(() => {
		if (assigned === null) return <div className="text-sm text-foreground-muted">Loading…</div>
		if (assigned.length === 0) return <div className="text-sm text-foreground-muted">No achievements assigned.</div>
		return assigned.map((a) => (
			<div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3">
				<div className="min-w-0">
					<div className="text-sm font-semibold text-foreground truncate">{a.name_ru || a.name_en}</div>
					<div className="text-xs text-foreground-muted truncate">{a.code}</div>
				</div>
				<button
					onClick={() => unassign(a.id)}
					disabled={isBusy}
					className={cn(
						"h-9 rounded-xl border border-border/60 bg-background px-3 text-xs font-semibold text-foreground hover:bg-background-tertiary/40",
						isBusy && "opacity-60 cursor-not-allowed"
					)}
				>
					Unassign
				</button>
			</div>
		))
	}, [assigned, isBusy, unassign])

	const availableContent = useMemo(() => {
		if (available === null) return <div className="text-sm text-foreground-muted">Loading…</div>
		if (available.length === 0) return <div className="text-sm text-foreground-muted">No available achievements.</div>
		return available.map((a) => (
			<div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3">
				<div className="min-w-0">
					<div className="text-sm font-semibold text-foreground truncate">{a.name_ru || a.name_en}</div>
					<div className="text-xs text-foreground-muted truncate">{a.code}</div>
				</div>
				<button
					onClick={() => assign(a.id)}
					disabled={isBusy}
					className={cn(
						"inline-flex items-center gap-2 h-9 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90",
						isBusy && "opacity-60 cursor-not-allowed"
					)}
				>
					<Plus className="w-4 h-4" />
					Assign
				</button>
			</div>
		))
	}, [available, assign, isBusy])

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div className="rounded-2xl border border-border/60 bg-background-secondary/40">
				<div className="px-5 py-4 border-b border-border/50">
					<div className="text-sm font-semibold text-foreground">User</div>
					<div className="text-xs text-foreground-muted mt-1">Найди пользователя и выбери его для назначения</div>
				</div>
				<div className="p-5 space-y-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="w-full h-11 rounded-xl bg-background border border-border/60 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary/50"
							placeholder="email или username"
						/>
					</div>

					{userResults ? (
						<div className="max-h-72 overflow-auto rounded-xl border border-border/60 bg-background">
							{userResults.length === 0 ? (
								<div className="p-4 text-sm text-foreground-muted">No users found.</div>
							) : (
								userResults.map((u) => (
									<button
										key={u.id}
										onClick={() => {
											setSelectedUser(u)
											setUserResults(null)
											setQuery("")
										}}
										className="w-full text-left px-4 py-3 border-b border-border/40 hover:bg-background-tertiary/40"
									>
										<div className="flex items-center gap-3">
											<div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
												<User className="w-4 h-4 text-primary" />
											</div>
											<div className="min-w-0">
												<div className="text-sm font-semibold text-foreground truncate">{u.username}</div>
												<div className="text-xs text-foreground-muted truncate">{u.email}</div>
											</div>
										</div>
									</button>
								))
							)}
						</div>
					) : null}

					{selectedUser ? (
						<div className="rounded-xl border border-border/60 bg-background p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="text-sm font-semibold text-foreground truncate">{selectedUser.username}</div>
									<div className="text-xs text-foreground-muted truncate">{selectedUser.email}</div>
									<div className="mt-1 text-xs text-foreground-muted">ID: {selectedUser.id}</div>
								</div>
								<button
									onClick={() => {
										setSelectedUser(null)
										setAssigned(null)
									}}
									className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-background-tertiary/40"
								>
									<X className="w-4 h-4" />
									Clear
								</button>
							</div>
						</div>
					) : (
						<div className="text-sm text-foreground-muted">Выбери пользователя, чтобы увидеть назначения.</div>
					)}

					{error ? <div className="text-sm text-red-300">{error}</div> : null}
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40">
				<div className="px-5 py-4 border-b border-border/50">
					<div className="text-sm font-semibold text-foreground">Assignments</div>
					<div className="text-xs text-foreground-muted mt-1">Назначенные и доступные достижения</div>
				</div>
				<div className="p-5">
					{!selectedUser ? (
						<div className="text-sm text-foreground-muted">Сначала выбери пользователя.</div>
					) : (
						<div className="grid grid-cols-1 gap-6">
							<div>
								<div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Assigned</div>
								<div className="mt-3 space-y-2">
									{assignedContent}
								</div>
							</div>
							<div>
								<div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Available</div>
								<div className="mt-3 space-y-2">
									{availableContent}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
