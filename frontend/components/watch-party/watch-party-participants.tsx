"use client"

import { cn } from "@/lib/utils"
import type { WatchPartyMember } from "@/hooks/use-watch-party-room"
import type { WatchPartyRole } from "@/lib/api"

export function WatchPartyParticipants({
	members,
	selfRole,
	onSetRole,
}: {
	members: WatchPartyMember[]
	selfRole: WatchPartyRole
	onSetRole: (userId: number, role: "moderator" | "viewer") => void
}) {
	return (
		<div className="rounded-2xl border border-border/60 bg-background">
			<div className="px-4 py-3 border-b border-border/60">
				<div className="text-sm font-semibold">Participants</div>
				<div className="text-xs text-foreground-muted">Room ends if the owner leaves.</div>
			</div>
			<div className="p-3 space-y-2">
				{members.length === 0 ? (
					<div className="text-sm text-foreground-muted">No participants.</div>
				) : (
					members.map((m) => (
						<div key={m.user_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background-secondary/10 px-3 py-2">
							<div className="flex items-center gap-3 min-w-0">
								<div className="w-8 h-8 rounded-full bg-background-tertiary/40 overflow-hidden shrink-0">
									{m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : null}
								</div>
								<div className="min-w-0">
									<div className="text-sm font-semibold truncate">{m.username}</div>
									<div className="text-xs text-foreground-subtle">{m.role}</div>
								</div>
							</div>
							{selfRole === "owner" && m.role !== "owner" ? (
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => onSetRole(m.user_id, m.role === "moderator" ? "viewer" : "moderator")}
										className={cn(
											"h-9 px-3 rounded-xl text-xs font-semibold border transition-colors",
											"border-border/60 bg-background hover:bg-background-tertiary/30"
										)}
									>
										{m.role === "moderator" ? "Make viewer" : "Make moderator"}
									</button>
								</div>
							) : null}
						</div>
					))
				)}
			</div>
		</div>
	)
}

