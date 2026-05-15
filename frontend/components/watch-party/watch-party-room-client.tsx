"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
	type EpisodesByServer,
	getAnimeBySlug,
	getWatchPartyRoom,
	joinWatchPartyRoom,
	setWatchPartyMemberRole,
	type WatchPartyContentState,
} from "@/lib/api"
import { AnimeStreamPlayer } from "@/components/anime/anime-stream-player"
import { WatchPartyChat } from "@/components/watch-party/watch-party-chat"
import { WatchPartyParticipants } from "@/components/watch-party/watch-party-participants"
import { WatchPartyRoomHeader } from "@/components/watch-party/watch-party-room-header"
import { useWatchPartyRoom } from "@/hooks/use-watch-party-room"

export function WatchPartyRoomClient() {
	const params = useParams()
	const roomId = String((params as any).roomId || "")
	const router = useRouter()
	const sp = useSearchParams()
	const { user, isLoading: authLoading } = useAuth()
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [needsJoin, setNeedsJoin] = useState(false)
	const [requiresPassword, setRequiresPassword] = useState(false)
	const [password, setPassword] = useState("")
	const [animeSlug, setAnimeSlug] = useState<string | null>(null)
	const [animeData, setAnimeData] = useState<any>(null)
	const [restRoom, setRestRoom] = useState<any>(null)
	const [restRole, setRestRole] = useState<any>(null)

	const { room, selfRole, canControl, members, messages, ended, connect, disconnect, sendChat, sendStateUpdate, sendBuffering, dissolve } =
		useWatchPartyRoom(roomId)

	const effectiveRoom = room || restRoom
	const effectiveRole = (selfRole || restRole) as any

	const pickDefaultContent = (slug: string, episodesByServer: EpisodesByServer): WatchPartyContentState => {
		const serverData = (episodesByServer as any)?.default || (Object.values(episodesByServer || {})[0] as any)
		const dubGroups: any[] = serverData?.dub || []
		const subGroups: any[] = serverData?.sub || []

		const firstPlayable = (groups: any[]) => {
			for (const g of groups) {
				for (const ep of g?.episodes || []) {
					const sources = (ep?.video_sources || []) as any[]
					const active = sources.filter((s) => s?.is_active)
					const direct = active.filter((s) => s?.type === "direct")
					const preferred =
						direct.find((s) => s?.is_integrated_player && s?.is_default) ||
						direct.find((s) => s?.is_integrated_player) ||
						direct.find((s) => s?.is_default) ||
						direct[0]
					if (!preferred) continue
					return { ep, source: preferred }
				}
			}
			return null
		}

		const dubPick = firstPlayable(dubGroups)
		const subPick = firstPlayable(subGroups)
		const pickedType: "dubbed" | "subbed" = dubPick ? "dubbed" : "subbed"
		const pick = dubPick || subPick
		if (!pick) {
			return {
				anime_slug: slug,
				selected_type: "dubbed",
				selected_episode_number: null,
				selected_voice_group_id: null,
				selected_server_label: "",
				selected_source_id: null,
			}
		}

		return {
			anime_slug: slug,
			selected_type: pickedType,
			selected_episode_number: typeof pick.ep?.number === "number" ? pick.ep.number : null,
			selected_voice_group_id: typeof pick.source?.voice_group_id === "number" ? pick.source.voice_group_id : null,
			selected_server_label: typeof pick.source?.label === "string" ? pick.source.label : "",
			selected_source_id: typeof pick.source?.id === "number" ? pick.source.id : null,
		}
	}

	useEffect(() => {
		if (authLoading) return
		if (!user) {
			router.replace(`/login?next=${encodeURIComponent(`/watch-party/${roomId}`)}`)
			return
		}
		let cancelled = false
		setLoading(true)
		setError(null)
		getWatchPartyRoom(roomId)
			.then(async (r) => {
				if (cancelled) return
				setRestRoom(r.room)
				setRestRole(r.self_role)
				setRequiresPassword(r.requires_password)
				setNeedsJoin(r.needs_join)
				const s = (r.room.content_state as any)?.anime_slug
				if (typeof s === "string" && s.trim()) setAnimeSlug(s)
				if (!r.needs_join) {
					connect()
					return
				}
				if (!r.requires_password) {
					await joinWatchPartyRoom(roomId, "")
					setNeedsJoin(false)
					connect()
					return
				}
			})
			.catch((e: any) => {
				if (cancelled) return
				setError(e?.message || "Failed to load room")
			})
			.finally(() => {
				if (cancelled) return
				setLoading(false)
			})
		return () => {
			cancelled = true
			disconnect()
		}
	}, [authLoading, connect, disconnect, roomId, router, user])

	useEffect(() => {
		const slug = (effectiveRoom?.content_state as any)?.anime_slug
		if (typeof slug === "string" && slug.trim() && slug !== animeSlug) setAnimeSlug(slug)
	}, [effectiveRoom?.content_state, animeSlug])

	useEffect(() => {
		if (!animeSlug) return
		let cancelled = false
		setAnimeData(null)
		getAnimeBySlug(animeSlug)
			.then((d) => {
				if (cancelled) return
				setAnimeData(d)
			})
			.catch((e: any) => {
				if (cancelled) return
				setError(e?.message || "Failed to load anime")
			})
		return () => {
			cancelled = true
		}
	}, [animeSlug])

	const inviteUrl = useMemo(() => {
		const code = (effectiveRoom as any)?.invite_code
		if (!code) return ""
		if (typeof window === "undefined") return ""
		return `${window.location.origin}/watch-party/join/${code}`
	}, [(effectiveRoom as any)?.invite_code])

	const sync = useMemo(() => {
		if (!effectiveRoom) return null
		return {
			enabled: true,
			canControl,
			selection: effectiveRoom.content_state,
			playback: {
				is_playing: effectiveRoom.is_playing,
				playback_rate: effectiveRoom.playback_rate,
				playback_position_sec: effectiveRoom.playback_position_sec,
				playback_seq: effectiveRoom.playback_seq,
			},
			onSelectionChange: (content: WatchPartyContentState) => {
				const next = { ...content, anime_slug: (content as any)?.anime_slug || (effectiveRoom.content_state as any)?.anime_slug }
				sendStateUpdate({ content: next })
			},
			onPlaybackChange: (p: { is_playing: boolean; playback_rate: number; playback_position_sec: number }) => {
				sendStateUpdate(p)
			},
			onBufferingChange: (p: { is_buffering: boolean; playback_position_sec: number }) => {
				sendBuffering(p)
			},
		}
	}, [canControl, effectiveRoom, sendBuffering, sendStateUpdate])

	if (loading) {
		return (
			<div className="pt-20">
				<main className="p-6 text-sm text-foreground-muted">Loading…</main>
			</div>
		)
	}

	if (error) {
		return (
			<div className="pt-20">
				<main className="p-6 text-sm text-red-300">{error}</main>
			</div>
		)
	}

	if (!effectiveRoom || !effectiveRole) {
		return (
			<div className="pt-20">
				<main className="p-6 text-sm text-foreground-muted">
					Room not available.
				</main>
			</div>
		)
	}

	if (ended || effectiveRoom.status !== "active") {
		return (
			<div className="pt-20">
				<main className="max-w-2xl mx-auto p-6 pb-10">
				<div className="rounded-2xl border border-border/60 bg-background p-6">
					<div className="text-lg font-semibold">Room ended</div>
					<div className="mt-1 text-sm text-foreground-muted">
						Reason: {ended?.reason || effectiveRoom.status}
					</div>
					<div className="mt-4 flex gap-2">
						<button
							type="button"
							onClick={() => router.push("/")}
							className="h-10 px-4 rounded-xl text-sm font-semibold border border-border/60 bg-background hover:bg-background-tertiary/30"
						>
							Back home
						</button>
						<button
							type="button"
							onClick={() => router.push("/watch-party/new")}
							className="h-10 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
						>
							Create new
						</button>
					</div>
				</div>
				</main>
			</div>
		)
	}

	if (requiresPassword && needsJoin) {
		const invite = sp.get("invite")
		return (
			<div className="pt-20">
				<main className="max-w-xl mx-auto p-6 pb-10">
				<div className="rounded-2xl border border-border/60 bg-background p-6">
					<div className="text-lg font-semibold">Private room</div>
					<div className="mt-1 text-sm text-foreground-muted">
						Enter password to join {invite ? `(${invite})` : ""}.
					</div>
					<form
						className="mt-4 space-y-3"
						onSubmit={async (e) => {
							e.preventDefault()
							setError(null)
							try {
								await joinWatchPartyRoom(roomId, password)
								setNeedsJoin(false)
								connect()
							} catch (err: any) {
								setError(err?.message || "Failed to join")
							}
						}}
					>
						<input
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Room password"
							type="password"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
						<button type="submit" className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
							Join room
						</button>
					</form>
				</div>
				</main>
			</div>
		)
	}

	return (
		<div className="pt-20">
			<main className="max-w-[1200px] mx-auto p-4 md:p-6 pb-10 space-y-4">
			<WatchPartyRoomHeader
					room={effectiveRoom}
					selfRole={effectiveRole}
				inviteUrl={inviteUrl}
				onLeave={() => router.push("/")}
				onDissolve={() => dissolve()}
				onChangeContent={async (newSlug) => {
					try {
						setError(null)
						setAnimeSlug(newSlug)
						const d = await getAnimeBySlug(newSlug)
						setAnimeData(d)
						const content = pickDefaultContent(newSlug, d.episodes)
						sendStateUpdate({
							content,
							is_playing: false,
							playback_rate: 1,
							playback_position_sec: 0,
						})
					} catch (e: any) {
						setError(e?.message || "Failed to change content")
					}
				}}
			/>

			<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4 items-start">
				<div className="space-y-4">
					<WatchPartyParticipants
						members={members}
							selfRole={effectiveRole}
						onSetRole={async (uid, role) => {
							try {
									await setWatchPartyMemberRole(effectiveRoom.id, uid, role)
							} catch (e: any) {
								setError(e?.message || "Failed to update role")
							}
						}}
					/>
				</div>

				<div className="rounded-2xl border border-border/60 bg-background p-3 md:p-4">
					{animeData ? (
						<AnimeStreamPlayer anime={animeData.anime} episodesByServer={animeData.episodes} startWatchingNonce={0} sync={sync} />
					) : (
						<div className="p-6 text-sm text-foreground-muted">Loading content…</div>
					)}
				</div>

				<div className="h-[70vh]">
					<WatchPartyChat
						messages={messages}
						onSend={(m) => {
							sendChat(m)
						}}
					/>
				</div>
			</div>
			</main>
		</div>
	)
}
