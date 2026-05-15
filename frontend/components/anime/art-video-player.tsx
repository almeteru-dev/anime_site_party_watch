"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import Artplayer from "artplayer"

export type ArtVideoPlayerHandle = {
  getCurrentTime: () => number
  isPlaying: () => boolean
	setCurrentTime: (t: number) => void
	play: () => void | Promise<void>
	pause: () => void
	setPlaybackRate: (r: number) => void
	getPlaybackRate: () => number
}

export type ArtVideoPlayerProps = {
  url: string
  poster?: string
  initialTime?: number
  autoPlay?: boolean
  onTimeUpdate?: (time: number) => void
	onState?: (s: { currentTime: number; isPlaying: boolean; playbackRate: number }) => void
	onBufferingChange?: (isBuffering: boolean, currentTime: number) => void
}

export const ArtVideoPlayer = forwardRef<ArtVideoPlayerHandle, ArtVideoPlayerProps>(
  function ArtVideoPlayer({ url, poster, initialTime, autoPlay, onTimeUpdate, onState, onBufferingChange }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const artRef = useRef<Artplayer | null>(null)
	  const lastEmitRef = useRef<string>("")

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        const art = artRef.current
        if (!art) return 0
        const time = Number(art.currentTime)
        return Number.isFinite(time) ? time : 0
      },
      isPlaying: () => {
        const art = artRef.current
        return !!art?.playing
      },
			setCurrentTime: (t: number) => {
				const art = artRef.current
				if (!art) return
				art.currentTime = t
			},
			play: () => {
				const art = artRef.current
				if (!art) return
				return art.play()
			},
			pause: () => {
				const art = artRef.current
				if (!art) return
				art.pause()
			},
			setPlaybackRate: (r: number) => {
				const art = artRef.current
				if (!art) return
				;(art as any).playbackRate = r
			},
			getPlaybackRate: () => {
				const art = artRef.current
				if (!art) return 1
				return Number((art as any).playbackRate || 1)
			},
    }))

		const emitState = () => {
			const art = artRef.current
			if (!art) return
			const currentTime = Number(art.currentTime || 0)
			const playbackRate = Number((art as any).playbackRate || 1)
			const isPlaying = Boolean(art.playing)
			const key = `${isPlaying ? 1 : 0}:${Math.round(currentTime * 10)}:${Math.round(playbackRate * 100)}`
			if (key === lastEmitRef.current) return
			lastEmitRef.current = key
			onState?.({ currentTime, isPlaying, playbackRate })
		}

    useEffect(() => {
      if (!containerRef.current) return

      const safePoster = typeof poster === "string" ? poster : ""

      const art = new Artplayer({
        container: containerRef.current,
        url,
        poster: safePoster,
        autoplay: false,
        muted: false,
        pip: true,
        fullscreen: true,
        fullscreenWeb: true,
        setting: true,
        loop: false,
        hotkey: true,
        playbackRate: true,
      })

      artRef.current = art

      const seek = () => {
        const t = typeof initialTime === "number" ? initialTime : 0
        if (t > 0) art.currentTime = t
        if (autoPlay) art.play()
			emitState()
      }

      const onVideoTimeUpdate = () => {
        if (!onTimeUpdate) return
        const time = Number(art.currentTime)
        if (Number.isFinite(time)) onTimeUpdate(time)
			emitState()
      }

      art.on("ready", seek)
      art.on("video:timeupdate", onVideoTimeUpdate)
		art.on("play", emitState)
		art.on("pause", emitState)
		art.on("seek", emitState)
		art.on("video:ratechange", emitState)
		const onWaiting = () => {
			const currentTime = Number(art.currentTime || 0)
			onBufferingChange?.(true, Number.isFinite(currentTime) ? currentTime : 0)
		}
		const onPlaying = () => {
			const currentTime = Number(art.currentTime || 0)
			onBufferingChange?.(false, Number.isFinite(currentTime) ? currentTime : 0)
		}
		art.on("video:waiting", onWaiting)
		art.on("video:playing", onPlaying)

      return () => {
        art.off("video:timeupdate", onVideoTimeUpdate)
			art.off("play", emitState)
			art.off("pause", emitState)
			art.off("seek", emitState)
			art.off("video:ratechange", emitState)
			art.off("video:waiting", onWaiting)
			art.off("video:playing", onPlaying)
        artRef.current = null
        art.destroy(false)
      }
    }, [autoPlay, initialTime, onBufferingChange, onTimeUpdate, onState, poster, url])

    return <div ref={containerRef} className="w-full h-full" />
  }
)
