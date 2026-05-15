"use client";

import { useEffect, useMemo, useState } from "react";
import { DayTabs } from "@/components/schedule/day-tabs";
import { ReleaseList } from "@/components/schedule/release-list";
import { CalendarDays } from "lucide-react";
import { getPublicSettings, getSchedule, type ScheduleItem } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import { addDays, formatTimeInTimeZone, formatYMDInTimeZone, labelForScheduleTimezone } from "@/lib/timezone";

export default function ReleasesPage() {
	const { locale, t } = useLanguage()
	const [scheduleTimezone, setScheduleTimezone] = useState<string>("Etc/GMT-5")

  const windowStart = useMemo(() => addDays(new Date(), -2), [])
  const windowEnd = useMemo(() => addDays(new Date(), 7), [])

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const s = await getPublicSettings()
				if (!mounted) return
				setScheduleTimezone(s.schedule_timezone)
			} catch {
				;
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

  const days = useMemo(() => {
    const out: { key: string; weekday: string; label: string; isToday: boolean }[] = []
    const todayKey = formatYMDInTimeZone(new Date(), scheduleTimezone)
    for (let i = 0; i < 10; i++) {
      const d = addDays(windowStart, i)
      const key = formatYMDInTimeZone(d, scheduleTimezone)
      out.push({
        key,
        weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: scheduleTimezone }).format(d),
        label: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: scheduleTimezone }).format(d),
        isToday: key === todayKey,
      })
    }
    return out
  }, [locale, scheduleTimezone, windowStart])

  const [selectedKey, setSelectedKey] = useState(() => formatYMDInTimeZone(new Date(), "UTC"))

	useEffect(() => {
		setSelectedKey(formatYMDInTimeZone(new Date(), scheduleTimezone))
	}, [scheduleTimezone])

  const [items, setItems] = useState<ScheduleItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
			const from = formatYMDInTimeZone(windowStart, scheduleTimezone)
			const to = formatYMDInTimeZone(windowEnd, scheduleTimezone)
        const data = await getSchedule({ from, to })
        if (!mounted) return
        setItems(data)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || t.schedule.failedToLoad)
        setItems([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [scheduleTimezone, windowEnd, windowStart])

  const releasesForDay = useMemo(() => {
    const list = (items || []).filter((x) => formatYMDInTimeZone(new Date(x.release_datetime), scheduleTimezone) === selectedKey)
    return list.map((x) => {
      const dt = new Date(x.release_datetime)
      return {
        time: formatTimeInTimeZone(dt, locale, scheduleTimezone),
        title: x.anime?.name || (locale === "ru" ? "Аниме" : "Anime"),
        episode: x.episode_number,
        posterUrl: x.anime?.image || `https://placehold.co/112x160/F1F5F9/00D2FF?text=${encodeURIComponent(x.anime?.name || "Anime")}`,
        slug: x.anime?.url || "",
      }
    })
  }, [items, locale, scheduleTimezone, selectedKey])

  return (
    <div className="pt-20">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
                {t.schedule.title}
              </h1>
            </div>
            <p className="text-foreground-subtle text-sm sm:text-base">
              {t.schedule.subtitle}
            </p>
				<div className="mt-2 text-xs text-foreground-muted">
					{t.schedule.timezone}: {labelForScheduleTimezone(scheduleTimezone)}
				</div>
          </div>
        </div>

        <div className="space-y-6">
          <DayTabs days={days} selectedKey={selectedKey} onDayChange={setSelectedKey} />

          {error ? <div className="text-sm text-destructive">{error}</div> : null}

          <ReleaseList releases={releasesForDay} />
        </div>
      </main>
    </div>
  );
}
