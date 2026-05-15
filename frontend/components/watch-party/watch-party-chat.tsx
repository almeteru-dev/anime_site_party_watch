"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { WatchPartyMessage } from "@/hooks/use-watch-party-room"

export function WatchPartyChat({
	messages,
	onSend,
}: {
	messages: WatchPartyMessage[]
	onSend: (message: string) => void
}) {
	const [text, setText] = useState("")
	const listRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const el = listRef.current
		if (!el) return
		el.scrollTop = el.scrollHeight
	}, [messages.length])

	const canSend = useMemo(() => text.trim().length > 0, [text])

	return (
		<div className="h-full flex flex-col rounded-2xl border border-border/60 bg-background">
			<div className="px-4 py-3 border-b border-border/60">
				<div className="text-sm font-semibold">Chat</div>
				<div className="text-xs text-foreground-muted">Real-time messages</div>
			</div>
			<div ref={listRef} className="flex-1 overflow-auto px-4 py-3 space-y-3">
				{messages.length === 0 ? (
					<div className="text-sm text-foreground-muted">Say hi to the room.</div>
				) : (
					messages.map((m) => (
						<div key={m.id} className="flex items-start gap-3">
							<div className="w-8 h-8 rounded-full bg-background-tertiary/40 overflow-hidden shrink-0">
								{m.avatar_url ? (
									<img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
								) : null}
							</div>
							<div className="min-w-0">
								<div className="flex items-baseline gap-2">
									<div className="text-sm font-semibold truncate">{m.username}</div>
									<div className="text-xs text-foreground-subtle">{new Date(m.created_at).toLocaleTimeString()}</div>
								</div>
								<div className="text-sm text-foreground break-words">{m.message}</div>
							</div>
						</div>
					))
				)}
			</div>
			<form
				className="p-3 border-t border-border/60"
				onSubmit={(e) => {
					e.preventDefault()
					const v = text.trim()
					if (!v) return
					onSend(v)
					setText("")
				}}
			>
				<div className="flex items-center gap-2">
					<input
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Write a message…"
						className="flex-1 h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
					/>
					<button
						type="submit"
						disabled={!canSend}
						className={cn(
							"h-11 px-4 rounded-xl text-sm font-semibold transition-colors",
							canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background-tertiary/30 text-foreground-muted"
						)}
					>
						Send
					</button>
				</div>
			</form>
		</div>
	)
}

