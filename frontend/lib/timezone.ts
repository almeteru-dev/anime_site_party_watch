export type DateParts = {
	year: number
	month: number
	day: number
	hour: number
	minute: number
}

export type ScheduleTimezoneOption = {
	label: string
	value: string
}

export const SCHEDULE_TIMEZONE_OPTIONS: ScheduleTimezoneOption[] = Array.from({ length: 24 }, (_, idx) => {
	const offset = idx - 11
	const label = offset === 0 ? "UTC+0" : `UTC${offset > 0 ? "+" : ""}${offset}`
	if (offset === 0) {
		return { label, value: "UTC" }
	}
	const abs = Math.abs(offset)
	const value = offset > 0 ? `Etc/GMT-${abs}` : `Etc/GMT+${abs}`
	return { label, value }
})

const scheduleTimezoneLabelByValue = new Map(SCHEDULE_TIMEZONE_OPTIONS.map((o) => [o.value, o.label]))

export function labelForScheduleTimezone(timeZone: string): string {
	return scheduleTimezoneLabelByValue.get(timeZone) ?? timeZone
}

export function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
	const fmt = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	})
	const parts = fmt.formatToParts(date)
	const get = (type: string) => parts.find((p) => p.type === type)?.value
	return {
		year: Number(get("year") || "0"),
		month: Number(get("month") || "0"),
		day: Number(get("day") || "0"),
		hour: Number(get("hour") || "0"),
		minute: Number(get("minute") || "0"),
	}
}

export function formatYMDInTimeZone(date: Date, timeZone: string): string {
	const p = getDatePartsInTimeZone(date, timeZone)
	const m = String(p.month).padStart(2, "0")
	const d = String(p.day).padStart(2, "0")
	return `${p.year}-${m}-${d}`
}

export function formatTimeInTimeZone(date: Date, locale: string, timeZone: string): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date)
}

export function formatDateTimeInTimeZone(date: Date, locale: string, timeZone: string): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date)
}

const weekdayMap: Record<string, number> = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
}

export function weekdayIndexInTimeZone(date: Date, timeZone: string): number {
	const w = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date)
	return typeof weekdayMap[w] === "number" ? weekdayMap[w] : 0
}

export function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}
