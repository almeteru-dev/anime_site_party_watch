"use client"

import type { MutableRefObject } from "react"

export type MoonanimeMethodGet = "is_playing" | "get_time" | "get_duration"
export type MoonanimeMethodSet = "player_play" | "player_pause" | "player_seek" | "player_next" | "player_prev"
export type MoonanimeMethod = MoonanimeMethodGet | MoonanimeMethodSet

export type MoonanimeOutgoingMessage = {
	method: MoonanimeMethod
	value?: unknown
	request_id?: number
}

export type MoonanimeIncomingMessage = Record<string, any>

type Pending = {
	method: MoonanimeMethodGet
	resolve: (v: unknown) => void
	reject: (e: unknown) => void
	timer: number
}

function asNumber(v: unknown): number | null {
	const n = typeof v === "number" ? v : Number(v)
	return Number.isFinite(n) ? n : null
}

function asBool(v: unknown): boolean | null {
	if (typeof v === "boolean") return v
	if (v === 1 || v === "1") return true
	if (v === 0 || v === "0") return false
	const s = String(v || "").trim().toLowerCase()
	if (s === "true") return true
	if (s === "false") return false
	return null
}

export class MoonanimeIframeController {
	private reqSeq = 0
	private pending = new Map<number, Pending>()
	private lastTimeSec: number = 0
	private lastDurationSec: number = 0
	private lastIsPlaying: boolean | null = null

	constructor(private iframeWindowRef: MutableRefObject<Window | null>, private debugPush?: (e: any) => void) {}

	private post(msg: any) {
		const win = this.iframeWindowRef.current
		if (!win) return
		this.debugPush?.({ dir: "out", at: Date.now(), msg })
		win.postMessage(msg, "*")
	}

	// Send a command or request into the iframe.
	send(method: MoonanimeMethod, value?: unknown) {
		if (method === "player_seek") {
			const seconds = typeof value === "number" ? value : Number(value)
			const base = { method: "player_seek", value: seconds }
			this.post(base)
			this.post({ method: "player_seek", seconds })
			this.post({ method: "player_seek", time: seconds })
			this.post({ event: "player_seek", value: seconds })
			this.post({ event: "player_seek", seconds })
			this.post({ event: "player_seek", time: seconds })
			this.post({ action: "player_seek", value: seconds })
			this.post({ action: "player_seek", seconds })
			this.post({ action: "player_seek", time: seconds })
			this.post({ key: "frame_api", value: base })
			return
		}
		if (method === "player_play" || method === "player_pause" || method === "player_next" || method === "player_prev") {
			const base = { method }
			this.post(base)
			this.post({ event: method })
			this.post({ action: method })
			this.post({ key: "frame_api", value: base })
			return
		}
		const base: MoonanimeOutgoingMessage = { method, value }
		this.post(base)
		this.post({ event: method })
		this.post({ action: method })
		this.post({ key: "frame_api", value: base })
	}

	// Request a value from the iframe. Some players may not respond with payloads;
	// in that case we fall back to last known state from events.
	request(method: MoonanimeMethodGet, timeoutMs = 350): Promise<unknown> {
		const win = this.iframeWindowRef.current
		if (!win) return Promise.reject(new Error("missing iframe"))
		const requestId = ++this.reqSeq
		return new Promise((resolve, reject) => {
			const timer = window.setTimeout(() => {
				this.pending.delete(requestId)
				this.debugPush?.({ dir: "timeout", at: Date.now(), method, request_id: requestId })
				reject(new Error("timeout"))
			}, timeoutMs)
			this.pending.set(requestId, { method, resolve, reject, timer })
			this.send(method, undefined)
		})
	}

	// Call this from a window "message" event listener.
	handleMessage(eventData: MoonanimeIncomingMessage): void {
		const data = eventData || {}
		this.debugPush?.({ dir: "in", at: Date.now(), data })

		const reqId = typeof data.request_id === "number" ? data.request_id : typeof data.requestId === "number" ? data.requestId : null
		if (typeof reqId === "number") {
			const p = this.pending.get(reqId)
			if (p) {
				window.clearTimeout(p.timer)
				this.pending.delete(reqId)
				p.resolve(data.value ?? data.data ?? data.time ?? data.result ?? null)
				return
			}
		}

		const ev = typeof data.event === "string" ? data.event : ""
		if (ev === "time") {
			const t = asNumber(data.time ?? data.data)
			if (t != null) this.lastTimeSec = t
			return
		}
		if (ev === "duration") {
			const d = asNumber(data.duration ?? data.data)
			if (d != null) this.lastDurationSec = d
			return
		}
		if (ev === "player_play") {
			this.lastIsPlaying = true
			return
		}
		if (ev === "player_pause") {
			this.lastIsPlaying = false
			return
		}

		if (ev === "get_time") {
			const p = this.findPendingByMethod("get_time")
			if (!p) return
			const t = asNumber(data.time ?? data.data)
			if (t != null) this.lastTimeSec = t
			window.clearTimeout(p.timer)
			this.pending.delete(p.request_id)
			p.resolve(t ?? this.lastTimeSec)
			return
		}
		if (ev === "get_duration") {
			const p = this.findPendingByMethod("get_duration")
			if (!p) return
			const d = asNumber(data.duration ?? data.data)
			if (d != null) this.lastDurationSec = d
			window.clearTimeout(p.timer)
			this.pending.delete(p.request_id)
			p.resolve(d ?? this.lastDurationSec)
			return
		}
		if (ev === "is_playing") {
			const p = this.findPendingByMethod("is_playing")
			if (!p) return
			const b = asBool(data.value ?? data.data)
			if (b != null) this.lastIsPlaying = b
			window.clearTimeout(p.timer)
			this.pending.delete(p.request_id)
			p.resolve(b ?? this.lastIsPlaying ?? false)
			return
		}
	}

	private findPendingByMethod(method: MoonanimeMethodGet): { request_id: number; resolve: (v: unknown) => void; reject: (e: unknown) => void; timer: number } | null {
		for (const [id, p] of this.pending) {
			if (p.method !== method) continue
			return { request_id: id, resolve: p.resolve, reject: p.reject, timer: p.timer }
		}
		return null
	}

	async getTimeSec(): Promise<number> {
		if (this.lastTimeSec > 0) return this.lastTimeSec
		try {
			await this.request("get_time")
		} catch {}
		return this.lastTimeSec
	}

	async isPlaying(): Promise<boolean> {
		if (this.lastIsPlaying != null) return this.lastIsPlaying
		try {
			await this.request("is_playing")
		} catch {}
		return this.lastIsPlaying ?? false
	}

	async getDurationSec(): Promise<number> {
		if (this.lastDurationSec > 0) return this.lastDurationSec
		try {
			await this.request("get_duration")
		} catch {}
		return this.lastDurationSec
	}
}
