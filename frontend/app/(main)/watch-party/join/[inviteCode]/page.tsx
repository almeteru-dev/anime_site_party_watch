"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { resolveWatchPartyInvite } from "@/lib/api"

export default function WatchPartyJoinInvitePage() {
	const router = useRouter()
	const params = useParams()
	const inviteCode = String((params as any).inviteCode || "")
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		resolveWatchPartyInvite(inviteCode)
			.then((r) => {
				if (cancelled) return
				router.replace(`/watch-party/${r.room_id}?invite=${encodeURIComponent(inviteCode)}`)
			})
			.catch((e: any) => {
				if (cancelled) return
				setError(e?.message || "Room not available")
			})
		return () => {
			cancelled = true
		}
	}, [inviteCode, router])

	if (error) {
		return (
			<div className="pt-20">
				<main className="p-6 text-sm text-red-300">{error}</main>
			</div>
		)
	}
	return (
		<div className="pt-20">
			<main className="p-6 text-sm text-foreground-muted">Joining room…</main>
		</div>
	)
}
