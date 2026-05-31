"use client"

import { useEffect, useMemo, useState } from "react"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  SkipBack, 
  SkipForward,
  Subtitles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { getPublicSettings } from "@/lib/api"

interface VideoPlayerProps {
  posterImage: string
  title: string
  episode: number
  source?: { type: "iframe" | "video"; src: string } | null
}

export function VideoPlayer({ posterImage, title, episode, source }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState([0])
  const [volume, setVolume] = useState([80])
  const [showControls, setShowControls] = useState(true)
	const [kodikSettings, setKodikSettings] = useState<{
		geoblock: string
		hide_selectors: boolean
		skip_enabled: boolean
		skip_value: string
	} | null>(null)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const s = await getPublicSettings()
				if (!mounted) return
				setKodikSettings({
					geoblock: s.kodik_geoblock,
					hide_selectors: s.kodik_hide_selectors,
					skip_enabled: s.kodik_skip_enabled,
					skip_value: s.kodik_skip_value,
				})
			} catch {
				if (mounted) setKodikSettings(null)
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	const iframeSrc = useMemo(() => {
		if (!source || source.type !== "iframe") return null
		const raw = source.src
		if (!raw) return raw
		let normalized = raw
		if (normalized.startsWith("//")) normalized = `https:${normalized}`
		let u: URL
		try {
			u = new URL(normalized)
		} catch {
			return raw
		}
		if (!u.hostname.toLowerCase().includes("kodik")) return raw

		const sp = u.searchParams
		sp.set("translations", "false")
		if (!kodikSettings) {
			u.search = sp.toString()
			return u.toString()
		}
		const geoblock = (kodikSettings.geoblock || "")
			.split(",")
			.map((x) => x.trim().toUpperCase())
			.filter(Boolean)
			.join(",")
		if (geoblock) sp.set("geoblock", geoblock)
		else sp.delete("geoblock")

		if (kodikSettings.hide_selectors) sp.set("hide_selectors", "true")
		else sp.delete("hide_selectors")

		if (kodikSettings.skip_enabled && (kodikSettings.skip_value || "").trim()) {
			sp.set("skip_button", (kodikSettings.skip_value || "").trim())
		} else {
			sp.delete("skip_button")
		}
		u.search = sp.toString()
		return u.toString()
	}, [kodikSettings, source])

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Player Container */}
        <div 
          className="relative w-full aspect-video bg-background-secondary rounded-2xl overflow-hidden border border-border shadow-sm group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => !isPlaying && setShowControls(true)}
        >
          {/* Player */}
          {source ? (
            source.type === "iframe" ? (
              <iframe
                src={iframeSrc || source.src}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                className="absolute inset-0 w-full h-full"
                src={source.src}
                poster={posterImage}
                controls
              />
            )
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${posterImage})` }}
            >
              <div className="absolute inset-0 bg-background/40" />
            </div>
          )}

          {/* Episode Info Overlay */}
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-background-secondary/85 backdrop-blur-sm rounded-lg px-4 py-2 border border-border shadow-sm">
              <p className="text-foreground font-semibold">{title}</p>
              <p className="text-foreground-subtle text-sm">Episode {episode}</p>
            </div>
          </div>

          {/* Big Play Button (Center) */}
          {!source && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110"
              >
                <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
              </button>
            </div>
          )}

          {/* Bottom Controls (visual only when embedded) */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Progress Bar */}
            <div className="mb-4 px-2">
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={1}
                className="[&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-track]]:bg-border [&_[data-slot=slider-range]]:bg-primary"
              />
              <div className="flex justify-between text-xs text-foreground-subtle mt-1">
                <span>0:00</span>
                <span>24:30</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => {}}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-primary hover:bg-primary/10 w-12 h-12"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => {}}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                {/* Volume */}
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="w-20 hidden sm:block">
                    <Slider
                      value={isMuted ? [0] : volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                      className="[&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-track]]:bg-border [&_[data-slot=slider-range]]:bg-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Subtitles className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
