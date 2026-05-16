"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { WatchPartyContentState, WatchPartyRole, WatchPartyRoomState } from "@/lib/api"
import { getWatchPartyWsUrl } from "@/lib/api"

export type WatchPartyMember = {
	user_id: number
	username: string
	avatar_url: string
	role: WatchPartyRole
	joined_at: string
	last_seen_at: string
}

export type WatchPartyMessage = {
	id: number
	user_id: number
	username: string
	avatar_url: string
	message: string
	created_at: string
}

type SnapshotMsg = {
	type: "snapshot"
	room: WatchPartyRoomState
	self: { user_id: number; role: WatchPartyRole }
	members: WatchPartyMember[]
	messages: WatchPartyMessage[]
}

type PresenceMsg = { type: "presence"; members: WatchPartyMember[] }

type StateUpdateMsg = {
	type: "state_update"
	content_state: WatchPartyContentState
	is_playing: boolean
	playback_rate: number
	playback_position_sec: number
	playback_seq: number
	last_state_at: string
	by_user_id: number
}

type ChatMsg = {
	type: "chat_message"
	id: number
	user_id: number
	username: string
	avatar_url: string
	message: string
	created_at: string
}

type RoomEndedMsg = { type: "room_ended"; status: string; reason: string; at: string }
type RoleUpdatedMsg = { type: "role_updated"; user_id: number; role: WatchPartyRole }

type Incoming = SnapshotMsg | PresenceMsg | StateUpdateMsg | ChatMsg | RoomEndedMsg | RoleUpdatedMsg | { type: string }

export function useWatchPartyRoom(roomId: number | string) {
	const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "open" | "closed" | "error">("idle")
	const [room, setRoom] = useState<WatchPartyRoomState | null>(null)
	const [selfRole, setSelfRole] = useState<WatchPartyRole | null>(null)
	const [members, setMembers] = useState<WatchPartyMember[]>([])
	const [messages, setMessages] = useState<WatchPartyMessage[]>([])
	const [ended, setEnded] = useState<{ status: string; reason: string; at: string } | null>(null)
	const wsRef = useRef<WebSocket | null>(null)
	const pendingCloseRef = useRef(false)
	const lastSentRef = useRef<string>("")
	const reconnectAttemptRef = useRef(0)
	const reconnectTimerRef = useRef<number | null>(null)
	const debug = useMemo(() => {
		if (process.env.NODE_ENV === "production") return false
		if (typeof window === "undefined") return false
		return window.localStorage.getItem("wpDebug") === "1"
	}, [])

	const canControl = useMemo(() => selfRole === "owner" || selfRole === "moderator", [selfRole])

	const connect = useCallback(function connect() {
		if (wsRef.current) return
		if (reconnectTimerRef.current) {
			window.clearTimeout(reconnectTimerRef.current)
			reconnectTimerRef.current = null
		}
		pendingCloseRef.current = false
		setWsStatus("connecting")
		const url = getWatchPartyWsUrl(roomId)
		if (debug) console.log("[watch-party] ws connect", { roomId, url })
		const ws = new WebSocket(url)
		wsRef.current = ws
		ws.onopen = () => {
			reconnectAttemptRef.current = 0
			if (debug) console.log("[watch-party] ws open", { roomId })
			setWsStatus("open")
		}
		ws.onclose = () => {
			wsRef.current = null
			if (debug) console.log("[watch-party] ws close", { roomId })
			setWsStatus(pendingCloseRef.current ? "closed" : "closed")
			if (!pendingCloseRef.current) {
				reconnectAttemptRef.current += 1
				const delay = Math.min(8000, 500 * reconnectAttemptRef.current)
				reconnectTimerRef.current = window.setTimeout(() => {
					reconnectTimerRef.current = null
					connect()
				}, delay)
				if (debug) console.log("[watch-party] ws reconnect scheduled", { roomId, delay })
			}
		}
		ws.onerror = () => {
			if (debug) console.log("[watch-party] ws error", { roomId })
			setWsStatus("error")
		}
		ws.onmessage = (ev) => {
			let msg: Incoming
			try {
				msg = JSON.parse(ev.data)
			} catch {
				return
			}
			if (debug) console.log("[watch-party] ws recv", msg)
			if (msg.type === "snapshot") {
				const m = msg as SnapshotMsg
				setRoom(m.room)
				setSelfRole(m.self.role)
				setMembers(m.members || [])
				setMessages(m.messages || [])
				setEnded(null)
				return
			}
			if (msg.type === "presence") {
				setMembers((msg as PresenceMsg).members || [])
				return
			}
			if (msg.type === "role_updated") {
				const r = msg as RoleUpdatedMsg
				setMembers((prev) => prev.map((x) => (x.user_id === r.user_id ? { ...x, role: r.role } : x)))
				return
			}
			if (msg.type === "state_update") {
				const u = msg as StateUpdateMsg
				setRoom((prev) => {
					if (!prev) return prev
					if (u.playback_seq <= (prev.playback_seq || 0)) return prev
					return {
						...prev,
						content_state: u.content_state,
						is_playing: u.is_playing,
						playback_rate: u.playback_rate,
						playback_position_sec: u.playback_position_sec,
						playback_seq: u.playback_seq,
						last_state_at: u.last_state_at,
					}
				})
				return
			}
			if (msg.type === "chat_message") {
				const m = msg as ChatMsg
				setMessages((prev) => [...prev, m])
				return
			}
			if (msg.type === "room_ended") {
				const e = msg as RoomEndedMsg
				setEnded({ status: e.status, reason: e.reason, at: e.at })
				return
			}
		}
	}, [debug, roomId])

	const disconnect = useCallback(() => {
		pendingCloseRef.current = true
		if (reconnectTimerRef.current) {
			window.clearTimeout(reconnectTimerRef.current)
			reconnectTimerRef.current = null
		}
		wsRef.current?.close()
		wsRef.current = null
	}, [])

	useEffect(() => {
		return () => disconnect()
	}, [disconnect])

	const sendChat = useCallback((message: string) => {
		const ws = wsRef.current
		if (!ws || ws.readyState !== WebSocket.OPEN) return
		if (debug) console.log("[watch-party] ws send", { type: "chat_send", message })
		ws.send(JSON.stringify({ type: "chat_send", message }))
	}, [debug])

	const sendStateUpdate = useCallback(
		(p: { content?: WatchPartyContentState; is_playing?: boolean; playback_rate?: number; playback_position_sec?: number }) => {
			const ws = wsRef.current
			if (!ws || ws.readyState !== WebSocket.OPEN) return
			const payload = {
				type: "state_update",
				content: p.content,
				is_playing: p.is_playing,
				playback_rate: p.playback_rate,
				playback_position_sec: p.playback_position_sec,
			}
			const key = JSON.stringify(payload)
			if (key === lastSentRef.current) return
			lastSentRef.current = key
			if (debug) console.log("[watch-party] ws send", payload)
			ws.send(key)
		},
		[debug]
	)

	const sendBuffering = useCallback(
		(p: { is_buffering: boolean; playback_position_sec: number }) => {
			const ws = wsRef.current
			if (!ws || ws.readyState !== WebSocket.OPEN) return
			const payload = {
				type: "buffering",
				is_buffering: p.is_buffering,
				playback_position_sec: p.playback_position_sec,
			}
			if (debug) console.log("[watch-party] ws send", payload)
			ws.send(JSON.stringify(payload))
		},
		[debug]
	)

	const dissolve = useCallback(() => {
		const ws = wsRef.current
		if (!ws || ws.readyState !== WebSocket.OPEN) return
		if (debug) console.log("[watch-party] ws send", { type: "dissolve" })
		ws.send(JSON.stringify({ type: "dissolve" }))
	}, [debug])

	return {
		wsStatus,
		room,
		selfRole,
		canControl,
		members,
		messages,
		ended,
		connect,
		disconnect,
		sendChat,
		sendStateUpdate,
		sendBuffering,
		dissolve,
	}
}
