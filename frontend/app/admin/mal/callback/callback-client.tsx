"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { adminMalOAuthCallback } from "@/lib/api"
import { cn } from "@/lib/utils"

export function AdminMALCallbackClient() {
	const sp = useSearchParams()
	const router = useRouter()
	const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
	const [message, setMessage] = useState<string>("Connecting…")

	useEffect(() => {
		const code = String(sp.get("code") || "")
		const state = String(sp.get("state") || "")
		if (!code || !state) {
			setStatus("error")
			setMessage("Missing code/state")
			return
		}
		let mounted = true
		;(async () => {
			try {
				await adminMalOAuthCallback({ code, state })
				if (!mounted) return
				setStatus("ok")
				setMessage("Connected")
				setTimeout(() => router.replace("/admin/mal"), 900)
			} catch (e: any) {
				if (!mounted) return
				setStatus("error")
				setMessage(e?.message || "Failed")
			}
		})()
		return () => {
			mounted = false
		}
	}, [router, sp])

	return (
		<div className="pt-24">
			<main className="mx-auto max-w-xl px-4">
				<div
					className={cn(
						"rounded-2xl border px-5 py-4",
						status === "ok"
							? "border-primary/30 bg-primary/10"
							: status === "error"
								? "border-red-500/40 bg-red-500/10"
								: "border-border/60 bg-background-secondary/40"
					)}
				>
					<div className="text-sm font-semibold text-foreground">MyAnimeList OAuth</div>
					<div className={cn("mt-2 text-sm", status === "error" ? "text-red-300" : "text-foreground-muted")}>{message}</div>
					<div className="mt-4 flex justify-end">
						<Link
							href="/admin/mal"
							className="h-10 inline-flex items-center justify-center rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-secondary/40"
						>
							Back
						</Link>
					</div>
				</div>
			</main>
		</div>
	)
}

