"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, RefreshCw, ShieldCheck, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminMalOAuthStart, adminMalRefreshTokens, adminMalRevokeTokens, adminMalTokenStatus } from "@/lib/api"

export default function AdminMALPage() {
	const [status, setStatus] = useState<Awaited<ReturnType<typeof adminMalTokenStatus>> | null>(null)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const s = await adminMalTokenStatus()
				if (mounted) setStatus(s)
			} catch (e: any) {
				if (mounted) setError(e?.message || "Failed to load")
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	const connected = !!status?.connected
	const expiresText = useMemo(() => {
		const v = status?.expires_at
		if (!v) return ""
		const d = new Date(v)
		if (Number.isNaN(d.getTime())) return v
		return d.toLocaleString()
	}, [status?.expires_at])

	const reload = async () => {
		try {
			const s = await adminMalTokenStatus()
			setStatus(s)
		} catch (e: any) {
			setError(e?.message || "Failed to load")
		}
	}

	const onConnect = async () => {
		setError(null)
		setNotice(null)
		setBusy(true)
		try {
			const r = await adminMalOAuthStart()
			if (r.authorize_url) window.location.href = r.authorize_url
			else setError("Missing authorize URL")
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setBusy(false)
		}
	}

	const onRefresh = async () => {
		setError(null)
		setNotice(null)
		setBusy(true)
		try {
			const s = await adminMalRefreshTokens()
			setStatus(s)
			setNotice("Token refreshed")
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setBusy(false)
		}
	}

	const onRevoke = async () => {
		setError(null)
		setNotice(null)
		setBusy(true)
		try {
			await adminMalRevokeTokens()
			setNotice("Tokens cleared")
			await reload()
		} catch (e: any) {
			setError(e?.message || "Failed")
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground">MyAnimeList OAuth</h1>
					<div className="mt-1 text-sm text-foreground-muted">
						Подключение MAL через OAuth2 PKCE. Токены хранятся только на сервере.
					</div>
				</div>
				<a
					href="https://myanimelist.net/apiconfig/references/api/v2"
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground"
				>
					<ExternalLink className="w-4 h-4" />
					Docs
				</a>
			</div>

			{error ? <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
			{notice ? (
				<div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">{notice}</div>
			) : null}

			<div className="mt-6 grid grid-cols-1 gap-4">
				<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
					<div className="flex items-center justify-between gap-4">
						<div className="min-w-0">
							<div className="text-sm font-semibold text-foreground">Status</div>
							<div className="mt-1 text-xs text-foreground-muted">
								{status === null ? "Loading…" : connected ? "Connected" : "Not connected"}
							</div>
							{connected && expiresText ? (
								<div className="mt-2 text-xs text-foreground-muted">Expires: {expiresText}</div>
							) : null}
						</div>
						<div className="inline-flex items-center gap-2">
							<button
								type="button"
								onClick={reload}
								disabled={busy}
								className={cn(
									"h-10 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
									busy && "opacity-60 cursor-not-allowed"
								)}
							>
								<RefreshCw className="w-4 h-4 inline-block mr-2" />
								Reload
							</button>
							<button
								type="button"
								onClick={onConnect}
								disabled={busy}
								className={cn(
									"h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
									busy && "opacity-60 cursor-not-allowed"
								)}
							>
								<ShieldCheck className="w-4 h-4 inline-block mr-2" />
								{connected ? "Reconnect" : "Connect"}
							</button>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
					<div className="text-sm font-semibold text-foreground">Token actions</div>
					<div className="mt-1 text-xs text-foreground-muted">Refresh или сброс токенов на сервере.</div>
					<div className="mt-4 flex flex-wrap gap-2 justify-end">
						<button
							type="button"
							onClick={onRefresh}
							disabled={busy || !connected}
							className={cn(
								"h-10 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
								(busy || !connected) && "opacity-60 cursor-not-allowed"
							)}
						>
							Refresh
						</button>
						<button
							type="button"
							onClick={onRevoke}
							disabled={busy}
							className={cn(
								"h-10 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/15",
								busy && "opacity-60 cursor-not-allowed"
							)}
						>
							<Trash2 className="w-4 h-4 inline-block mr-2" />
							Clear tokens
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

