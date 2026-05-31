"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { addToMyCollection, getMyCollection, type Anime, type Episode, type WatchlistStatus } from "@/lib/api"
import { AddToUserList, type UserListStatus } from "@/components/anime/add-to-user-list"
import { ArtVideoPlayer, type ArtVideoPlayerHandle } from "@/components/anime/art-video-player"
import { SourceSelector, type PlayerSource } from "@/components/anime/source-selector"

function extractIframeSrc(input: string): string | null {
	const m1 = input.match(/src\s*=\s*"([^"]+)"/i)
	if (m1?.[1]) return m1[1]
	const m2 = input.match(/src\s*=\s*'([^']+)'/i)
	if (m2?.[1]) return m2[1]
	const m3 = input.match(/src\s*=\s*([^\s>]+)/i)
	return m3?.[1] || null
}

function toYouTubeEmbed(input: string): string | null {
  try {
    const u = new URL(input)
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "")
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return input
      const id = u.searchParams.get("v")
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

function normalizeIFrameUrl(url: string): string {
  const trimmed = url.trim().replace(/\.+$/, "")
  if (trimmed.includes("<iframe")) {
    const src = extractIframeSrc(trimmed)
    return src || trimmed
  }
  const yt = toYouTubeEmbed(trimmed)
  return yt || trimmed
}

function guessKind(url?: string): "iframe" | "direct" | "placeholder" {
  if (!url) return "placeholder"
  const u = url.trim()
  if (!u) return "placeholder"
  if (u.includes("<iframe")) return "iframe"
  if (/youtu\.be|youtube\.com|player\.vimeo\.com/i.test(u)) return "iframe"
  return "direct"
}

export function AnimePlayerContainer({
  anime,
  episode,
  startWatchingNonce,
}: {
  anime: Anime
  episode: Episode | null
  startWatchingNonce?: number
}) {
  const { user } = useAuth()
	const { t } = useLanguage()
	const [initialListStatus, setInitialListStatus] = useState<UserListStatus | null>(null)
	const [initialEpisodesWatched, setInitialEpisodesWatched] = useState<number>(0)

	useEffect(() => {
		if (!user) {
			setInitialListStatus(null)
			setInitialEpisodesWatched(0)
			return
		}
		let mounted = true
		getMyCollection()
			.then((list) => {
				if (!mounted) return
				const entry = list.find((x) => x.anime_id === anime.id)
				if (!entry) {
					setInitialListStatus(null)
					setInitialEpisodesWatched(0)
					return
				}
				setInitialListStatus(entry.collection_type.name.toLowerCase().replace(" ", "_") as UserListStatus)
				setInitialEpisodesWatched(entry.episodes_watched || 0)
			})
			.catch(() => {
				if (!mounted) return
				setInitialListStatus(null)
				setInitialEpisodesWatched(0)
			})
		return () => {
			mounted = false
		}
	}, [anime.id, user])
  const artRef = useRef<ArtVideoPlayerHandle | null>(null)
  const [selectedServer, setSelectedServer] = useState("")
  const [selectedAudio, setSelectedAudio] = useState("Subbed")
  const [activeTab, setActiveTab] = useState<"video" | "trailer">("video")
  const [resumeAt, setResumeAt] = useState<number>(0)
  const [resumePlay, setResumePlay] = useState(false)
  const [autoplay, setAutoplay] = useState(false)

  useEffect(() => {
    if (!startWatchingNonce) return
    if (!episode) setAutoplay(true)
  }, [episode, startWatchingNonce])

  const sources = useMemo<PlayerSource[]>(() => {
    const list: PlayerSource[] = []

    const vs = (episode?.video_sources || [])
      .filter((s) => s.is_active)
      .slice()
      .sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
        if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0)
        return a.id - b.id
      })

    for (const s of vs) {
      const baseUrl = (s.url || "").trim()
      if (!baseUrl) continue

      const kind = guessKind(baseUrl)
      const server = s.label || "Server"

      if (s.is_integrated_player) {
        list.push({ id: `vs_${s.id}_integrated`, server, audio: "Dub & Sub", kind, url: baseUrl })
        continue
      }

      const audio = s.audio === "dub" ? "Dubbed" : "Subbed"
      list.push({ id: `vs_${s.id}`, server, audio, kind, url: baseUrl })
    }

    if (list.length === 0) {
      list.push({ id: "no_source", server: "Video", audio: "Subbed", kind: "placeholder" })
    }

    return list
  }, [anime.trailer_url, episode?.video_sources])

	const trailerUrl = useMemo(() => {
		return (anime.trailer_url || "").trim()
	}, [anime.trailer_url])

	const trailerKind = useMemo(() => {
		return guessKind(trailerUrl)
	}, [trailerUrl])

	const trailerIframeSrc = useMemo(() => {
		if (trailerKind !== "iframe") return ""
		return normalizeIFrameUrl(trailerUrl)
	}, [trailerKind, trailerUrl])

  useEffect(() => {
    if (!sources.length) return
    const servers = Array.from(new Set(sources.map((s) => s.server)))
    const nextServer = selectedServer && servers.includes(selectedServer) ? selectedServer : servers[0]
    const audios = Array.from(new Set(sources.filter((s) => s.server === nextServer).map((s) => s.audio)))
    const nextAudio = audios.includes(selectedAudio) ? selectedAudio : audios[0] || "Subbed"

    if (nextServer !== selectedServer) setSelectedServer(nextServer)
    if (nextAudio !== selectedAudio) setSelectedAudio(nextAudio)
  }, [selectedAudio, selectedServer, sources])

  const active = useMemo(() => {
    return (
      sources.find((s) => s.server === selectedServer && s.audio === selectedAudio) ||
      sources[0]
    )
  }, [selectedAudio, selectedServer, sources])

	const hasPlayableVideo = useMemo(() => {
		return sources.some((s) => s.kind !== "placeholder")
	}, [sources])

  const iframeSrc = useMemo(() => {
    if (active.kind !== "iframe") return ""
    const src = normalizeIFrameUrl(active.url || "")
    if (!autoplay) return src
    try {
      const u = new URL(src)
      u.searchParams.set("autoplay", "1")
      u.searchParams.set("mute", "1")
      return u.toString()
    } catch {
      return src
    }
  }, [active.kind, active.url, autoplay])

  const onChangeServer = (server: string) => {
    if (active.kind === "direct") {
      const t = artRef.current?.getCurrentTime() || 0
      setResumeAt(t)
      setResumePlay(artRef.current?.isPlaying() || false)
    }
    setSelectedServer(server)
    const audios = Array.from(new Set(sources.filter((s) => s.server === server).map((s) => s.audio)))
    if (!audios.includes(selectedAudio)) {
      setSelectedAudio(audios[0] || "Subbed")
    }
  }

  const onChangeAudio = (audio: string) => {
    const next = sources.find((s) => s.server === selectedServer && s.audio === audio)
    if (active.kind === "direct" && next?.kind === "direct") {
      const t = artRef.current?.getCurrentTime() || 0
      setResumeAt(t)
      setResumePlay(artRef.current?.isPlaying() || false)
    } else {
      setResumeAt(0)
      setResumePlay(false)
    }
    setSelectedAudio(audio)
  }

  const handleUpdateList = async (animeId: string, status: UserListStatus) => {
    if (!user) {
      throw new Error("Unauthorized")
    }

    await addToMyCollection({ animeId, status: status as WatchlistStatus })
  }

  return (
    <section className="py-6 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-2 mb-3">
				<button
					type="button"
					onClick={() => setActiveTab("video")}
					className={
						activeTab === "video"
							? "h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
							: "h-9 rounded-xl border border-border/60 bg-background-secondary/40 px-4 text-sm font-semibold text-foreground-muted hover:text-foreground"
					}
				>
					{t.anime.videoTab}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("trailer")}
					disabled={!trailerUrl}
					className={
						!trailerUrl
							? "h-9 rounded-xl border border-border/60 bg-background-secondary/20 px-4 text-sm font-semibold text-foreground-muted/60 cursor-not-allowed"
							: activeTab === "trailer"
								? "h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
								: "h-9 rounded-xl border border-border/60 bg-background-secondary/40 px-4 text-sm font-semibold text-foreground-muted hover:text-foreground"
					}
				>
					{t.anime.trailerTab}
				</button>
			</div>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border bg-background-secondary">
				{activeTab === "trailer" ? (
					!trailerUrl ? (
						<div className="w-full h-full flex items-center justify-center text-foreground-subtle">{t.anime.noTrailer}</div>
					) : trailerKind === "iframe" ? (
						<iframe
							key={`trailer:${trailerUrl}`}
							src={trailerIframeSrc}
							className="absolute inset-0 w-full h-full"
							allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
							allowFullScreen
						/>
					) : (
						<ArtVideoPlayer key={`trailer:${trailerUrl}`} ref={artRef} url={trailerUrl} initialTime={0} autoPlay={false} />
					)
				) : active.kind === "placeholder" ? (
					<div className="w-full h-full flex items-center justify-center text-foreground-subtle">No episodes yet. Trailer is available.</div>
				) : active.kind === "iframe" ? (
					<iframe
						key={`${active.id}:${active.url || ""}`}
						src={iframeSrc}
						className="absolute inset-0 w-full h-full"
						allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
						allowFullScreen
					/>
				) : (
					<ArtVideoPlayer
						key={`${active.id}:${active.url || ""}`}
						ref={artRef}
						url={active.url || ""}
						initialTime={resumeAt}
						autoPlay={resumePlay}
					/>
				)}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
				{activeTab === "video" && hasPlayableVideo ? (
					<SourceSelector
						sources={sources}
						selectedServer={selectedServer}
						selectedAudio={selectedAudio}
						onChangeServer={onChangeServer}
						onChangeAudio={onChangeAudio}
					/>
				) : null}

          <AddToUserList
				animeId={String(anime.id)}
				onUpdate={handleUpdateList}
				initialStatus={initialListStatus}
				initialEpisodesWatched={initialEpisodesWatched}
				totalEpisodes={anime.episodes}
				animeStatusName={anime.status?.name || null}
			/>
        </div>
      </div>
    </section>
  )
}
