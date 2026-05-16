	"use client"

	import { useEffect, useMemo, useRef, useState } from "react"
	import { useParams } from "next/navigation"
	import { useRouter } from "next/navigation"
	import { getAnimeBySlug, getWatchPartyWsUrl, type AnimeDetailsResponse } from "@/lib/api"

	type PlayerState = {
		isPlaying: boolean
		time: number
		season: number | null
		episode: number | null
		translationId: number | null
	}

	type ContentState = {
		anime_slug?: string
		selected_type?: "dubbed" | "subbed"
		selected_episode_number?: number | null
		selected_season?: number | null
		selected_voice_group_id?: number | null
		selected_server_label?: string
		selected_source_id?: number | null
	}

	type RoomUser = {
		id: string
		name: string
		isOwner: boolean
	}

	type WSMessage =
		| { type: "init_state"; payload: { self_id?: string; is_owner: boolean; state: { is_playing: boolean; time: number; season: number; episode: number; translationId: number }; chat?: { id: string; user_id: number; name: string; message: string; sent_at: string }[] } }
		| { type: "users_update"; payload: RoomUser[] }
		| { type: "content_state"; payload: ContentState }
			| { type: "chat_message"; payload: { id: string; user_id: number; name: string; message: string; sent_at: string } }
			| { type: "room_closed"; payload: { reason?: string } }
			| { type: "role_update"; payload: { is_owner: boolean } }
		| { type: "play" }
		| { type: "pause" }
		| { type: "seek" | "time"; payload: { time: number } }
		| { type: "change_episode"; payload: { season?: number; episode?: number; translationId?: number } }
		| { type: "error"; payload: string }

	function postToPlayer(iframe: Window, value: any) {
		iframe.postMessage({ key: "kodik_player_api", value }, "*")
	}

	function normalizeIframeUrl(input: string): string {
		const s = String(input || "").trim()
		if (!s) return ""
		const m1 = s.match(/src\s*=\s*"([^"]+)"/i)
		if (m1?.[1]) return normalizeIframeUrl(m1[1])
		const m2 = s.match(/src\s*=\s*'([^']+)'/i)
		if (m2?.[1]) return normalizeIframeUrl(m2[1])
		const abs = s.startsWith("//") ? `https:${s}` : s
		try {
			const u = new URL(abs)
			if (u.hostname.includes("kodikplayer.com")) {
				u.searchParams.set("translations", "false")
				u.searchParams.set("hide_selectors", "true")
			}
			return u.toString()
		} catch {
			return abs
		}
	}

	function isSameContent(a: ContentState, b: ContentState): boolean {
		return (
			(a.anime_slug || "") === (b.anime_slug || "") &&
			(a.selected_type || "dubbed") === (b.selected_type || "dubbed") &&
			(a.selected_episode_number ?? null) === (b.selected_episode_number ?? null) &&
			(a.selected_season ?? null) === (b.selected_season ?? null) &&
			(a.selected_voice_group_id ?? null) === (b.selected_voice_group_id ?? null) &&
			(a.selected_server_label || "") === (b.selected_server_label || "") &&
			(a.selected_source_id ?? null) === (b.selected_source_id ?? null)
		)
	}

	function pickKodikUrl(details: AnimeDetailsResponse, content: ContentState): string {
		const byServer = details?.episodes || {}
		const serverKeys = Object.keys(byServer)
		if (serverKeys.length === 0) return ""
		const serverLabel = content.selected_server_label && byServer[content.selected_server_label] ? content.selected_server_label : serverKeys[0]
		const kind = content.selected_type === "subbed" ? "sub" : "dub"
		const groups = (byServer[serverLabel]?.[kind] || []) as any[]
		if (groups.length === 0) return ""
		const group =
			typeof content.selected_voice_group_id === "number"
				? groups.find((g) => g?.id === content.selected_voice_group_id) || groups[0]
				: groups[0]
		const episodes = (group?.episodes || []) as any[]
		if (episodes.length === 0) return ""
		const epNumber = typeof content.selected_episode_number === "number" ? content.selected_episode_number : null
		const ep = epNumber ? episodes.find((e) => e?.number === epNumber) || episodes[0] : episodes[0]
		const sources = (ep?.video_sources || []) as any[]
		if (sources.length === 0) return ""
		const src =
			typeof content.selected_source_id === "number"
				? sources.find((s) => s?.id === content.selected_source_id) || sources.find((s) => s?.is_default && s?.is_active) || sources.find((s) => s?.is_active) || sources[0]
				: sources.find((s) => s?.is_default && s?.is_active) || sources.find((s) => s?.is_active) || sources[0]
		return normalizeIframeUrl(String(src?.url || ""))
	}

	export default function WatchPartyRoom() {
		const params = useParams<{ roomId: string }>()
		const roomId = typeof params?.roomId === "string" ? params.roomId : ""
		const router = useRouter()
		const socketRef = useRef<WebSocket | null>(null)
		const playerIframeElRef = useRef<HTMLIFrameElement | null>(null)
		const playerWindowRef = useRef<Window | null>(null)
		const selfIdRef = useRef<string | null>(null)
		const isOwnerRef = useRef(false)
		const suppressUntilRef = useRef(0)
		const currentStateRef = useRef<PlayerState>({
			isPlaying: false,
			time: 0,
			season: null,
			episode: null,
			translationId: null,
		})

		const [isOwner, setIsOwner] = useState(false)
		const [users, setUsers] = useState<RoomUser[]>([])
		const [isConnected, setIsConnected] = useState(false)
		const [joined, setJoined] = useState(false)
		const joinedRef = useRef(false)
		const [error, setError] = useState<string | null>(null)
		const [iframeSrc, setIframeSrc] = useState<string>("")
		const iframeSrcRef = useRef<string>("")
		const [loadingPlayer, setLoadingPlayer] = useState(true)
		const [ownerActivated, setOwnerActivated] = useState(false)
		const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "err">("idle")
		const copyTimerRef = useRef<number | null>(null)
		const contentRef = useRef<ContentState>({})
		const detailsRef = useRef<AnimeDetailsResponse | null>(null)
		const [animeDetails, setAnimeDetails] = useState<AnimeDetailsResponse | null>(null)
		const [contentUi, setContentUi] = useState<ContentState>({})
		const [episodesVisibleCount, setEpisodesVisibleCount] = useState(30)
		const [showAllVoiceGroups, setShowAllVoiceGroups] = useState(false)
		type ChatMessage = { id: string; user_id: number; name: string; message: string; sent_at: string }
		const [chat, setChat] = useState<ChatMessage[]>([])
		const chatSeenRef = useRef<Set<string>>(new Set())
		const [chatText, setChatText] = useState("")

		const wsUrl = useMemo(() => (roomId ? getWatchPartyWsUrl(roomId) : ""), [roomId])
		const pageTitle = roomId ? roomId.slice(0, 8) : "…"

		useEffect(() => {
			iframeSrcRef.current = iframeSrc
		}, [iframeSrc])

		useEffect(() => {
			joinedRef.current = joined
		}, [joined])

		useEffect(() => {
			return () => {
				if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
			}
		}, [])

		const canChat = isConnected && (isOwner || joined)

		const sendChat = () => {
			const ws = socketRef.current
			if (!ws || ws.readyState !== WebSocket.OPEN) return
			if (!canChat) return
			const msg = chatText.trim()
			if (!msg) return
			ws.send(JSON.stringify({ type: "chat_message", payload: { message: msg } }))
			setChatText("")
		}

		const copyInvite = async () => {
			if (!roomId) return
			const url = `${window.location.origin}/watch-party/${roomId}`
			try {
				await navigator.clipboard.writeText(url)
				setCopyStatus("ok")
			} catch {
				try {
					const ta = document.createElement("textarea")
					ta.value = url
					ta.style.position = "fixed"
					ta.style.opacity = "0"
					document.body.appendChild(ta)
					ta.focus()
					ta.select()
					document.execCommand("copy")
					document.body.removeChild(ta)
					setCopyStatus("ok")
				} catch {
					setCopyStatus("err")
				}
			}
			if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
			copyTimerRef.current = window.setTimeout(() => setCopyStatus("idle"), 1200)
		}

		const dissolveRoom = () => {
			const ws = socketRef.current
			if (!ws || ws.readyState !== WebSocket.OPEN) return
			if (!isOwnerRef.current) return
			ws.send(JSON.stringify({ type: "dissolve" }))
			router.push("/")
		}

		useEffect(() => {
			let cancelled = false
			;(async () => {
				if (!roomId) return
				setLoadingPlayer(true)
				setError(null)
				try {
					const res = await fetch(`/api/watch-party/rooms/${encodeURIComponent(roomId)}`, { credentials: "include" })
					const data = (await res.json().catch(() => ({}))) as any
					if (!res.ok) throw new Error(data?.error || "Failed to load room")
					const content = (data?.room?.content_state || {}) as ContentState
					if (!content?.anime_slug) throw new Error("Room has no content yet")
					contentRef.current = content
					setContentUi(content)
					const details = await getAnimeBySlug(content.anime_slug)
					detailsRef.current = details
					setAnimeDetails(details)
					const src = pickKodikUrl(details, content)
					if (!src) throw new Error("No video sources found for this anime")
					if (cancelled) return
					setIframeSrc(src)
				} catch (e: any) {
					if (cancelled) return
					setError(e?.message || "Failed to load")
					setIframeSrc("")
				} finally {
					if (!cancelled) setLoadingPlayer(false)
				}
			})()
			return () => {
				cancelled = true
			}
		}, [roomId])

		const sendOwnerCommand = (msg: any) => {
			const ws = socketRef.current
			if (!ws || ws.readyState !== WebSocket.OPEN) return
			if (!isOwnerRef.current) return
			ws.send(JSON.stringify(msg))
		}

		const handleOwnerPlay = () => {
			const iframeWin = playerWindowRef.current
			if (!iframeWin) return
			setOwnerActivated(true)
			suppressUntilRef.current = Date.now() + 900
			postToPlayer(iframeWin, { method: "play" })
			sendOwnerCommand({ type: "play" })
		}

		const handleOwnerPause = () => {
			const iframeWin = playerWindowRef.current
			if (!iframeWin) return
			setOwnerActivated(true)
			suppressUntilRef.current = Date.now() + 900
			postToPlayer(iframeWin, { method: "pause" })
			sendOwnerCommand({ type: "pause" })
		}

		const handleOwnerSeek = (seconds: number) => {
			const iframeWin = playerWindowRef.current
			if (!iframeWin || !Number.isFinite(seconds)) return
			setOwnerActivated(true)
			suppressUntilRef.current = Date.now() + 900
			postToPlayer(iframeWin, { method: "seek", seconds })
			currentStateRef.current.time = seconds
			sendOwnerCommand({ type: "seek", payload: { seconds } })
		}

		const handleViewerJoin = () => {
			joinedRef.current = true
			setJoined(true)
			const iframeWin = playerWindowRef.current
			if (!iframeWin) return
			suppressUntilRef.current = Date.now() + 1500
			postToPlayer(iframeWin, { method: "seek", seconds: currentStateRef.current.time })
			if (currentStateRef.current.isPlaying) {
				postToPlayer(iframeWin, { method: "play" })
			} else {
				postToPlayer(iframeWin, { method: "pause" })
			}
		}

		const applyOwnerSelection = (next: Partial<ContentState>) => {
			if (!isOwnerRef.current) return
			const prev = contentRef.current
			const merged: ContentState = { ...prev, ...next }
			const same =
				merged.selected_type === prev.selected_type &&
				merged.selected_server_label === prev.selected_server_label &&
				merged.selected_voice_group_id === prev.selected_voice_group_id &&
				merged.selected_episode_number === prev.selected_episode_number &&
				merged.selected_season === prev.selected_season &&
				merged.selected_source_id === prev.selected_source_id
			if (same) return
			contentRef.current = merged
			setContentUi(merged)
			const details = detailsRef.current
			if (details) {
				const nextSrc = pickKodikUrl(details, merged)
				if (nextSrc && nextSrc !== iframeSrcRef.current) setIframeSrc(nextSrc)
			}
			const iframeWin = playerWindowRef.current
			if (iframeWin && typeof merged.selected_episode_number === "number") {
				setOwnerActivated(true)
				suppressUntilRef.current = Date.now() + 1200
				postToPlayer(iframeWin, { method: "change_episode", season: merged.selected_season ?? undefined, episode: merged.selected_episode_number })
			}
			sendOwnerCommand({
				type: "content_state",
				payload: { content: merged },
			})
			sendOwnerCommand({
				type: "change_episode",
				payload: {
					season: typeof merged.selected_season === "number" ? merged.selected_season : undefined,
					episode: typeof merged.selected_episode_number === "number" ? merged.selected_episode_number : undefined,
					translationId: typeof merged.selected_voice_group_id === "number" ? merged.selected_voice_group_id : undefined,
				},
			})
		}

		useEffect(() => {
			if (!wsUrl) return
			const ws = new WebSocket(wsUrl)
			socketRef.current = ws

			ws.onopen = () => setIsConnected(true)
			ws.onclose = () => setIsConnected(false)
			ws.onerror = () => setIsConnected(false)

			const onSocketMessage = (event: MessageEvent) => {
				let data: WSMessage
				try {
					data = JSON.parse(String(event.data))
				} catch {
					return
				}

				const iframeWin = playerWindowRef.current
				if (data.type === "error") {
					setError(data.payload)
					return
				}

				if (data.type === "users_update") {
					const list = Array.isArray(data.payload) ? data.payload : []
					setUsers(list)
					const selfId = selfIdRef.current
					if (selfId) {
						const me = list.find((u) => u?.id === selfId)
						if (me && typeof me.isOwner === "boolean" && me.isOwner !== isOwnerRef.current) {
							isOwnerRef.current = me.isOwner
							setIsOwner(me.isOwner)
							if (me.isOwner) setOwnerActivated(false)
						}
					}
					return
				}

				if (data.type === "room_closed") {
					setError(data.payload?.reason || "Комната закрыта")
					router.push("/")
					return
				}

				if (data.type === "role_update") {
					const nextIsOwner = !!data.payload?.is_owner
					isOwnerRef.current = nextIsOwner
					setIsOwner(nextIsOwner)
					if (nextIsOwner) setOwnerActivated(false)
					return
				}

				if (data.type === "chat_message") {
					const m = data.payload
					if (!m || typeof m.id !== "string") return
					if (chatSeenRef.current.has(m.id)) return
					chatSeenRef.current.add(m.id)
					setChat((prev) => {
						const next = [...prev, m]
						if (next.length > 200) return next.slice(-200)
						return next
					})
					return
				}

				if (data.type === "content_state") {
					const incoming = (data.payload || {}) as ContentState
					const prev = contentRef.current
					if (isSameContent(prev, incoming)) return
					contentRef.current = incoming
					setContentUi(incoming)
					const details = detailsRef.current
					if (!details) return
					const nextSrc = pickKodikUrl(details, incoming)
					if (!nextSrc) return
					if (nextSrc !== iframeSrcRef.current) setIframeSrc(nextSrc)
					return
				}

				if (data.type === "init_state") {
					if (typeof data.payload?.self_id === "string") {
						selfIdRef.current = data.payload.self_id
					}
					const nextIsOwner = !!data.payload?.is_owner
					isOwnerRef.current = nextIsOwner
					setIsOwner(nextIsOwner)
					currentStateRef.current = {
						isPlaying: !!data.payload.state.is_playing,
						time: Number(data.payload.state.time) || 0,
						season: Number.isFinite(data.payload.state.season) ? data.payload.state.season : null,
						episode: Number.isFinite(data.payload.state.episode) ? data.payload.state.episode : null,
						translationId: Number.isFinite((data.payload.state as any).translationId) ? (data.payload.state as any).translationId : null,
					}
					const incomingChat = Array.isArray((data as any).payload?.chat) ? ((data as any).payload.chat as any[]) : []
					if (incomingChat.length) {
						setChat(() => {
							const unique: ChatMessage[] = []
							chatSeenRef.current.clear()
							for (const raw of incomingChat) {
								if (!raw || typeof raw.id !== "string") continue
								if (chatSeenRef.current.has(raw.id)) continue
								chatSeenRef.current.add(raw.id)
								unique.push(raw as ChatMessage)
							}
							return unique.slice(-200)
						})
					}

					if (!iframeWin) return
					suppressUntilRef.current = Date.now() + 1200
					postToPlayer(iframeWin, { method: "seek", seconds: currentStateRef.current.time })
					return
				}

				if (!iframeWin) return
				if (!joinedRef.current && !isOwnerRef.current) {
					return
				}

				suppressUntilRef.current = Date.now() + 900

				if (data.type === "play") {
					currentStateRef.current.isPlaying = true
					postToPlayer(iframeWin, { method: "play" })
					return
				}
				if (data.type === "pause") {
					currentStateRef.current.isPlaying = false
					postToPlayer(iframeWin, { method: "pause" })
					return
				}
				if (data.type === "change_episode") {
					const nextSeason = typeof data.payload?.season === "number" ? data.payload.season : null
					const nextEpisode = typeof data.payload?.episode === "number" ? data.payload.episode : null
					if (nextSeason === currentStateRef.current.season && nextEpisode === currentStateRef.current.episode) return
					currentStateRef.current.season = nextSeason
					currentStateRef.current.episode = nextEpisode
					if (nextEpisode !== null) {
						postToPlayer(iframeWin, { method: "change_episode", season: nextSeason ?? undefined, episode: nextEpisode })
					}
					return
				}
				if (data.type === "seek" || data.type === "time") {
					const serverTime = Number(data.payload?.time)
					if (!Number.isFinite(serverTime)) return
					const clientTime = currentStateRef.current.time
					if (Math.abs(serverTime - clientTime) > 3) {
						postToPlayer(iframeWin, { method: "seek", seconds: serverTime })
					}
					currentStateRef.current.time = serverTime
					return
				}
			}

			const onKodikMessage = (event: MessageEvent) => {
				const iframeWin = playerWindowRef.current
				const wsNow = socketRef.current
				if (!iframeWin || event.source !== iframeWin) return
				if (!wsNow || wsNow.readyState !== WebSocket.OPEN) return
				if (!isOwnerRef.current) return
				if (Date.now() < suppressUntilRef.current) return
				if (!event.data || typeof event.data.key !== "string") return

				try {
					switch (event.data.key) {
						case "kodik_player_play":
							wsNow.send(JSON.stringify({ type: "play" }))
							break
						case "kodik_player_pause":
							wsNow.send(JSON.stringify({ type: "pause" }))
							break
						case "kodik_player_seek": {
							const t = Number(event.data.value?.time)
							if (!Number.isFinite(t)) return
							currentStateRef.current.time = t
							wsNow.send(JSON.stringify({ type: "seek", payload: { seconds: t } }))
							break
						}
						case "kodik_player_time_update": {
							const t = Number(event.data.value)
							if (!Number.isFinite(t)) return
							currentStateRef.current.time = t
							wsNow.send(JSON.stringify({ type: "time", payload: { seconds: t } }))
							break
						}
						case "kodik_player_current_episode": {
							const season = typeof event.data.value?.season === "number" ? event.data.value.season : null
							const episode = typeof event.data.value?.episode === "number" ? event.data.value.episode : null
							const translationId = typeof event.data.value?.translation?.id === "number" ? event.data.value.translation.id : null
							if (season === null || episode === null) return
							if (season === currentStateRef.current.season && episode === currentStateRef.current.episode) return
							currentStateRef.current.season = season
							currentStateRef.current.episode = episode
							currentStateRef.current.translationId = translationId
							wsNow.send(JSON.stringify({ type: "change_episode", payload: { season, episode, translationId: translationId ?? undefined } }))
							break
						}
					}
				} catch {
					return
				}
			}

			ws.addEventListener("message", onSocketMessage)
			window.addEventListener("message", onKodikMessage)

			return () => {
				window.removeEventListener("message", onKodikMessage)
				ws.removeEventListener("message", onSocketMessage)
				ws.close()
			}
		}, [wsUrl])

		const transferOwnership = (userId: string) => {
			const ws = socketRef.current
			if (!ws || ws.readyState !== WebSocket.OPEN) return
			if (!isOwnerRef.current) return
			ws.send(JSON.stringify({ type: "transfer_ownership", payload: { newOwnerId: userId } }))
		}

		return (
			<div className="min-h-screen bg-gray-950 text-white p-4 pt-20">
				<div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Основная колонка с плеером */}
        <div className="flex-1">
          {/* Заголовок комнаты */}
          <div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Watch Party #{pageTitle}</h1>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={copyInvite}
									className="h-9 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold"
								>
									{copyStatus === "ok" ? "Скопировано" : copyStatus === "err" ? "Ошибка" : "Скопировать ссылку"}
								</button>
								{isOwner ? (
									<button
										type="button"
										onClick={() => {
											if (confirm("Распустить комнату?")) dissolveRoom()
										}}
										className="h-9 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold"
									>
										Распустить
									</button>
								) : null}
								<span className={`px-3 py-1 rounded-full text-sm ${isConnected ? "bg-green-600" : "bg-red-600"}`}>
									{isConnected ? "Онлайн" : "Отключено"}
								</span>
							</div>
          </div>
				{error ? <div className="mb-4 text-sm text-red-300">{error}</div> : null}

          {/* Kodik плеер */}
			<div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
            <iframe
              ref={(el) => {
					playerIframeElRef.current = el
					playerWindowRef.current = el?.contentWindow ?? null
				}}
				  src={iframeSrc}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
					allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
              className="w-full h-full"
            />
				{loadingPlayer ? (
					<div className="absolute inset-0 flex items-center justify-center text-sm text-foreground-muted bg-black/40">Загрузка плеера…</div>
				) : null}
            {/* Для зрителей: оверлей блокирующий клики по плееру */}
            {!isOwner && (
              <div className="absolute inset-0 bg-transparent cursor-default" />
            )}
				{!isOwner && !joined ? (
					<div className="absolute inset-0 flex items-center justify-center bg-black/60">
						<button
							type="button"
							onClick={handleViewerJoin}
							className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
						>
							Войти в трансляцию
						</button>
					</div>
				) : null}
				{isOwner && !ownerActivated ? (
					<div className="absolute inset-0 flex items-center justify-center bg-black/60">
						<button
							type="button"
							onClick={() => setOwnerActivated(true)}
							className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
						>
							Активировать управление
						</button>
					</div>
				) : null}
          </div>

			{/* Панель управления - только для владельца */}
			{isOwner ? (
				<div className="mt-6 space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={handleOwnerPlay} className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold">
							Play
						</button>
						<button type="button" onClick={handleOwnerPause} className="h-10 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-sm font-semibold">
							Pause
						</button>
						<button
							type="button"
							onClick={() => handleOwnerSeek(Math.max(0, (currentStateRef.current.time || 0) - 10))}
							className="h-10 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold"
						>
							-10s
						</button>
						<button
							type="button"
							onClick={() => handleOwnerSeek((currentStateRef.current.time || 0) + 10)}
							className="h-10 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold"
						>
							+10s
						</button>
					</div>

					{(() => {
						const details = animeDetails
						const byServer = details?.episodes || {}
						const serverKeys = Object.keys(byServer)
						const currentType = contentUi.selected_type === "subbed" ? "sub" : "dub"
						const serverLabel =
							contentUi.selected_server_label && byServer[contentUi.selected_server_label]
								? contentUi.selected_server_label
								: serverKeys[0] || ""
						const groups: any[] = serverLabel ? ((byServer as any)[serverLabel]?.[currentType] || []) : []
						const selectedGroupId =
							typeof contentUi.selected_voice_group_id === "number" ? contentUi.selected_voice_group_id : (groups[0]?.id as number | undefined)
						const group = selectedGroupId ? groups.find((g) => g?.id === selectedGroupId) || groups[0] : groups[0]
						const episodes: any[] = (group?.episodes || []) as any[]
						const maxEpisodes = episodes.length
						const visibleEpisodes = episodes.slice(0, Math.max(1, Math.min(maxEpisodes, episodesVisibleCount)))
						const activeEpisode = typeof contentUi.selected_episode_number === "number" ? contentUi.selected_episode_number : (episodes[0]?.number as number | undefined)

						return (
							<div className="space-y-4">
								{serverKeys.length > 1 ? (
									<div>
										<div className="text-sm font-semibold text-foreground mb-2">Сервер</div>
										<div className="flex flex-wrap gap-2">
											{serverKeys.map((k) => (
												<button
													key={k}
													type="button"
													onClick={() => {
														setEpisodesVisibleCount(30)
														setShowAllVoiceGroups(false)
														applyOwnerSelection({ selected_server_label: k, selected_voice_group_id: null, selected_source_id: null, selected_episode_number: null })
													}}
													className={`h-9 px-3 rounded-full text-sm font-semibold ${k === serverLabel ? "bg-primary text-primary-foreground" : "bg-gray-800 hover:bg-gray-700"}`}
												>
													{k}
												</button>
											))}
										</div>
									</div>
								) : null}

								<div>
									<div className="text-sm font-semibold text-foreground mb-2">Язык</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => {
												setEpisodesVisibleCount(30)
												setShowAllVoiceGroups(false)
												applyOwnerSelection({ selected_type: "dubbed", selected_voice_group_id: null, selected_source_id: null, selected_episode_number: null })
											}}
											className={`h-10 px-4 rounded-full text-sm font-semibold ${contentUi.selected_type !== "subbed" ? "bg-primary text-primary-foreground" : "bg-gray-800 hover:bg-gray-700"}`}
										>
											Озвучка
										</button>
										<button
											type="button"
											onClick={() => {
												setEpisodesVisibleCount(30)
												setShowAllVoiceGroups(false)
												applyOwnerSelection({ selected_type: "subbed", selected_voice_group_id: null, selected_source_id: null, selected_episode_number: null })
											}}
											className={`h-10 px-4 rounded-full text-sm font-semibold ${contentUi.selected_type === "subbed" ? "bg-primary text-primary-foreground" : "bg-gray-800 hover:bg-gray-700"}`}
										>
											Субтитры
										</button>
									</div>
								</div>

								{groups.length > 0 ? (
									<div>
										<div className="flex items-center justify-between mb-2">
											<div className="text-sm font-semibold text-foreground">{contentUi.selected_type === "subbed" ? "Субтитры" : "Озвучка"}</div>
											{groups.length > 6 ? (
												<button
													type="button"
													onClick={() => setShowAllVoiceGroups((p) => !p)}
													className="h-8 px-3 rounded-full bg-gray-800 hover:bg-gray-700 text-xs font-semibold"
												>
													{showAllVoiceGroups ? "Скрыть" : "Показать все"}
												</button>
											) : null}
										</div>
										<div className="flex flex-wrap gap-2">
											{(showAllVoiceGroups ? groups : groups.slice(0, 6)).map((g) => (
												<button
													key={String(g.id)}
													type="button"
													onClick={() => {
														setEpisodesVisibleCount(30)
														applyOwnerSelection({ selected_voice_group_id: g.id, selected_source_id: null, selected_episode_number: (g.episodes?.[0]?.number as number | undefined) ?? null })
													}}
													className={`h-9 px-3 rounded-full text-sm font-semibold ${g.id === selectedGroupId ? "bg-primary text-primary-foreground" : "bg-gray-800 hover:bg-gray-700"}`}
												>
													{String(g.name || g.id)}
												</button>
											))}
										</div>
									</div>
								) : null}

								{visibleEpisodes.length > 0 ? (
									<div>
										<div className="text-sm font-semibold text-foreground mb-2">Серии</div>
										<div className="flex flex-wrap gap-2">
											{visibleEpisodes.map((ep) => (
												<button
													key={String(ep.id || ep.number)}
													type="button"
													onClick={() => applyOwnerSelection({ selected_episode_number: ep.number })}
													className={`h-9 min-w-9 px-3 rounded-lg text-sm font-semibold ${ep.number === activeEpisode ? "bg-primary text-primary-foreground" : "bg-gray-800 hover:bg-gray-700"}`}
												>
													{ep.number}
												</button>
											))}
										</div>
										{maxEpisodes > 30 ? (
											<div className="mt-3 flex gap-2">
												<button
													type="button"
													onClick={() => setEpisodesVisibleCount((p) => Math.min(maxEpisodes, p + 30))}
													className="h-9 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold"
													disabled={episodesVisibleCount >= maxEpisodes}
												>
													Показать еще
												</button>
												<button
													type="button"
													onClick={() => setEpisodesVisibleCount(maxEpisodes)}
													className="h-9 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold"
													disabled={episodesVisibleCount >= maxEpisodes}
												>
													Показать все
												</button>
											</div>
										) : null}
									</div>
								) : null}
							</div>
						)
					})()}
				</div>
			) : null}
        </div>

        {/* Панель участников */}
					<div className="w-full lg:w-80 bg-gray-900 rounded-xl p-5 flex flex-col gap-4 max-h-[70vh] lg:max-h-none lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] overflow-hidden min-h-0">
						<div>
							<h2 className="text-xl font-bold mb-4">Участники ({users.length})</h2>
							<div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-white">{user.name}</span>
                  {user.isOwner && <span className="text-yellow-400">👑</span>}
                </div>
                {isOwner && !user.isOwner && (
                  <button
                    onClick={() => transferOwnership(user.id)}
                    className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
                  >
                    Передать права
                  </button>
                )}
              </div>
            ))}
          </div>
						</div>
							<div className="border-t border-white/10 pt-4 flex flex-col min-h-0 flex-1 overflow-hidden">
							<div className="text-lg font-bold mb-3">Чат</div>
								<div className="flex-1 min-h-0 overflow-auto space-y-2 pr-1">
								{chat.map((m) => (
										<div key={m.id} className="text-sm break-words whitespace-pre-wrap">
										<span className="text-foreground-muted">{m.name}: </span>
										<span className="text-foreground">{m.message}</span>
									</div>
								))}
							</div>
								<div className="mt-3 flex gap-2 items-center">
								<input
									value={chatText}
									onChange={(e) => setChatText(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") sendChat()
									}}
									disabled={!canChat}
									placeholder={canChat ? "Напишите сообщение…" : "Войдите в трансляцию"}
										className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-50"
								/>
								<button
									type="button"
									onClick={sendChat}
									disabled={!canChat || !chatText.trim()}
										className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 shrink-0"
								>
										Отправить
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
