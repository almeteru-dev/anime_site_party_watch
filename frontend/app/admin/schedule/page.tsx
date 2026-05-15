"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { adminCreateSchedule, adminDeleteSchedule, adminListOngoingAnimes, adminListSchedule, adminUpdateSchedule, getPublicSettings, type OngoingAnimeItem, type ScheduleItem } from "@/lib/api"
import { WeekdayPicker } from "@/components/admin/schedule/WeekdayPicker"
import { addDays, formatDateTimeInTimeZone, formatYMDInTimeZone, getDatePartsInTimeZone, weekdayIndexInTimeZone } from "@/lib/timezone"

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function isTimePartialValid(v: string): boolean {
  if (v === "") return true
  return (
    /^(?:[0-1]?\d|2[0-3])$/.test(v) ||
    /^(?:[0-1]?\d|2[0-3]):$/.test(v) ||
    /^(?:[0-1]?\d|2[0-3]):[0-5]$/.test(v) ||
    /^(?:[0-1]?\d|2[0-3]):[0-5]\d$/.test(v)
  )
}

function normalizeTimeInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9:]/g, "")
  const firstColon = cleaned.indexOf(":")
  const withoutExtraColons =
    firstColon === -1
      ? cleaned
      : cleaned.slice(0, firstColon + 1) + cleaned.slice(firstColon + 1).replace(/:/g, "")
  return withoutExtraColons.slice(0, 5)
}

export default function AdminSchedulePage() {
  const { user } = useAuth()
	const browserLocale = typeof navigator === "undefined" ? "en-US" : navigator.language
	const [scheduleTimezone, setScheduleTimezone] = useState<string>("Etc/GMT-5")
	const [selectedWeekday, setSelectedWeekday] = useState<number>(0)

  const [items, setItems] = useState<ScheduleItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [animeQuery, setAnimeQuery] = useState("")
  const [animeOptions, setAnimeOptions] = useState<OngoingAnimeItem[]>([])
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null)
  const [episodeNumber, setEpisodeNumber] = useState<number>(1)
  const [releaseDate, setReleaseDate] = useState<string>(toYMD(new Date()))
  const [releaseTime, setReleaseTime] = useState<string>("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const searchTimer = useRef<number | null>(null)

  const canAccess = user?.role === "root" || user?.role === "admin" || user?.role === "moderator"

  const range = useMemo(() => {
    return { from: "1970-01-01", to: "2100-01-01" }
  }, [])

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const s = await getPublicSettings()
				if (!mounted) return
				setScheduleTimezone(s.schedule_timezone)
				setSelectedWeekday(weekdayIndexInTimeZone(new Date(), s.schedule_timezone))
			} catch {
				;
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!canAccess) return
      try {
        const data = await adminListSchedule({ from: range.from, to: range.to })
        if (!mounted) return
        setItems(data)
      } catch (e: any) {
        if (!mounted) return
        setError(e.message || "Failed to load")
      }
    })()
    return () => {
      mounted = false
    }
  }, [canAccess, range.from, range.to])

  useEffect(() => {
    let mounted = true
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      ;(async () => {
        try {
          if (!canAccess) return
          const data = await adminListOngoingAnimes({ q: animeQuery.trim() })
          if (!mounted) return
          setAnimeOptions(data)
        } catch {
          if (!mounted) return
          setAnimeOptions([])
        }
      })()
    }, 250)
    return () => {
      mounted = false
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [animeQuery, canAccess])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!canAccess) return
      try {
        const data = await adminListOngoingAnimes({})
        if (!mounted) return
        setAnimeOptions(data)
      } catch {
        if (!mounted) return
        setAnimeOptions([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [canAccess])

  const submit = async () => {
    if (!selectedAnimeId) {
      setError("Select an anime")
      return
    }
	const t = releaseTime.trim()
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) {
		setError("Time must be in 24-hour format HH:MM")
		return
	}
    setError(null)
    setSaving(true)
    try {
      const payload = {
        anime_id: selectedAnimeId,
        episode_number: Math.max(1, Math.trunc(episodeNumber)),
        release_date: releaseDate,
        release_time: t,
      }
		if (editingId) {
			const updated = await adminUpdateSchedule({ id: editingId, ...payload })
			setItems((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)) : prev))
		} else {
			const created = await adminCreateSchedule(payload)
			setItems((prev) => ([created, ...(prev || [])]))
		}
		setIsModalOpen(false)
		setEditingId(null)
		setAnimeQuery("")
    } catch (e: any) {
      setError(e.message || "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
		const now = new Date()
		let next = formatYMDInTimeZone(now, scheduleTimezone)
		for (let i = 0; i < 7; i++) {
			const candidate = addDays(now, i)
			if (weekdayIndexInTimeZone(candidate, scheduleTimezone) === selectedWeekday) {
				next = formatYMDInTimeZone(candidate, scheduleTimezone)
				break
			}
		}
	setEditingId(null)
	setAnimeQuery("")
	setSelectedAnimeId(null)
	setEpisodeNumber(1)
	setReleaseDate(next)
	setReleaseTime("")
	setError(null)
	setIsModalOpen(true)
  }

  const openEdit = (it: ScheduleItem) => {
	setEditingId(it.id)
	setAnimeQuery("")
	setSelectedAnimeId(it.anime?.id || null)
	setEpisodeNumber(it.episode_number)
	const dt = new Date(it.release_datetime)
	setReleaseDate(formatYMDInTimeZone(dt, scheduleTimezone))
	const p = getDatePartsInTimeZone(dt, scheduleTimezone)
	setReleaseTime(`${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`)
	setError(null)
	setIsModalOpen(true)
  }

  const remove = async (id: number) => {
    setError(null)
    setSaving(true)
    try {
      await adminDeleteSchedule({ id })
      setItems((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
    } catch (e: any) {
      setError(e.message || "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  const sorted = useMemo(() => {
    return (items || []).slice().sort((a, b) => a.release_datetime.localeCompare(b.release_datetime))
  }, [items])

	const byWeekday = useMemo(() => {
		const groups: ScheduleItem[][] = [[], [], [], [], [], [], []]
		for (const it of sorted) {
			const idx = weekdayIndexInTimeZone(new Date(it.release_datetime), scheduleTimezone)
			groups[idx].push(it)
		}
		return groups
	}, [scheduleTimezone, sorted])

	const weekdayCounts = useMemo(() => byWeekday.map((g) => g.length), [byWeekday])
	const visible = useMemo(() => byWeekday[selectedWeekday] || [], [byWeekday, selectedWeekday])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Schedule Settings</h1>
			<p className="text-sm text-foreground-muted">Create and manage release schedule entries (timezone: {scheduleTimezone}).</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          disabled={!canAccess}
          className={cn(
            "h-11 rounded-xl px-4 text-sm font-semibold",
            !canAccess
              ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          Add to Schedule
        </button>
      </div>

		<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
			<div className="text-sm font-semibold text-foreground">Weekday view</div>
			<div className="mt-3">
				<WeekdayPicker selected={selectedWeekday} counts={weekdayCounts} onChange={setSelectedWeekday} />
			</div>
		</div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-border/60 bg-background-secondary/95 backdrop-blur p-5">
            <div className="text-sm font-semibold text-foreground mb-4">{editingId ? "Edit Schedule Entry" : "Add Schedule Entry"}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Anime (ongoing only)</label>
                <input
                  value={animeQuery}
                  onChange={(e) => setAnimeQuery(e.target.value)}
                  placeholder="Search anime…"
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50"
                />
                <select
                  value={selectedAnimeId || ""}
                  onChange={(e) => setSelectedAnimeId(e.target.value ? Number(e.target.value) : null)}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50"
                >
                  <option value="">Select…</option>
                  {animeOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted">Episode</label>
                <input
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50"
                />
                <label className="text-xs font-semibold text-foreground-muted">Date</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50"
                />
                <label className="text-xs font-semibold text-foreground-muted">Time (24h)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={releaseTime}
                  onChange={(e) => {
                    const next = normalizeTimeInput(e.target.value)
                    setReleaseTime((prev) => (isTimePartialValid(next) ? next : prev))
                  }}
                  placeholder="HH:MM"
                  pattern="([01]\d|2[0-3]):[0-5]\d"
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-11 rounded-xl px-4 text-sm font-semibold text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canAccess || saving}
                className={cn(
                  "h-11 rounded-xl px-4 text-sm font-semibold",
                  !canAccess || saving
                    ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {saving ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">Entries</div>
				<div className="text-xs text-foreground-muted">{visible.length} shown · {sorted.length} total</div>
        </div>

        {items === null ? (
          <div className="px-5 py-8 text-sm text-foreground-muted">Loading…</div>
			) : sorted.length === 0 ? (
          <div className="px-5 py-8 text-sm text-foreground-muted">No entries yet.</div>
        ) : (
          <div className="divide-y divide-border/40">
            {visible.map((it) => (
              <div key={it.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{it.anime?.name || "Anime"}</div>
                  <div className="mt-1 text-xs text-foreground-muted">
					{formatDateTimeInTimeZone(new Date(it.release_datetime), browserLocale, scheduleTimezone)} · Ep. {it.episode_number}
                  </div>
                </div>
				<div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(it)}
                    disabled={!canAccess || saving}
                    className="h-10 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-tertiary/40 disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    disabled={!canAccess || saving}
                    className="h-10 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-60"
                  >
                    Delete
                  </button>
				</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
