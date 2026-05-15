"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { getMyAnimeRating, getMyCollection, rateAnime } from "@/lib/api"

export function AnimeRating({ animeId }: { animeId: number }) {
  const { user } = useAuth()
	const { t } = useLanguage()
  const [isWatched, setIsWatched] = useState<boolean | null>(null)
  const [value, setValue] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
	const didInitValue = useRef(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) {
        if (mounted) setIsWatched(null)
		if (mounted) setValue("")
		if (mounted) setError(null)
        didInitValue.current = false
        return
      }
      try {
        const itemsPromise = getMyCollection()
        const ratingPromise = getMyAnimeRating({ animeId }).catch(() => null)
        const items = await itemsPromise
        const myRating = await ratingPromise
        const entry = items.find((x) => x.anime_id === animeId)
        if (mounted) setIsWatched(entry?.collection_type?.name === "completed")
        if (mounted && !didInitValue.current) {
          if (typeof myRating === "number" && Number.isFinite(myRating)) {
            const n = Math.trunc(myRating)
			if (n >= 1 && n <= 10) {
              setValue(String(n))
            }
          }
          didInitValue.current = true
        }
      } catch {
        if (mounted) setIsWatched(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [animeId, user])

  const options = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => String(i + 1))
  }, [])

  const disabled = !user || isWatched !== true || isSaving

  const onChange = async (next: string) => {
    setValue(next)
    setError(null)
    if (!user) return
    if (isWatched !== true) return
    if (next === "") return

    const num = Number(next)
    if (!Number.isInteger(num) || num < 1 || num > 10) {
		setError("Rating must be between 1 and 10")
      return
    }

    setIsSaving(true)
    try {
      await rateAnime({ animeId, score: num })
    } catch (e: any) {
      setError(e?.message || "Failed to save rating")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="mt-2">
      <div className="text-xs text-foreground-subtle">{t.anime.yourRating}</div>
      <div className="mt-1 flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 rounded-lg border border-border bg-background-secondary px-3 text-sm text-foreground disabled:opacity-60"
        >
          <option value="">Select</option>
          {options.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        {isWatched === false ? (
          <div className="text-xs text-foreground-muted">{t.anime.onlyWatchedCanRate}</div>
        ) : null}
      </div>

      {error ? <div className="mt-1 text-xs text-red-400">{error}</div> : null}
    </div>
  )
}
