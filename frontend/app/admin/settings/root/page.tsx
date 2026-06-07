"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Save, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
	adminKodikBulkStart,
	adminKodikBulkStatus,
	adminMoonanimeBulkStart,
	adminMoonanimeBulkStatus,
  adminPurgeOldSchedules,
  adminSetDefaultPassword,
  adminSetFooterLinks,
	adminSetKodikPlayerSettings,
  adminSetPrivateMode,
  adminSetRegistrationDisabled,
  adminSetScheduleTimezone,
	adminSyncTopAnime,
	adminDeleteMALTopAnime,
	adminGetMALTopAnime,
	adminUpsertMALTopAnime,
	adminPurgeOfflineWatchPartyRooms,
  getPublicSettings,
	type AdminMALTopRow,
  type FooterSocialLinks,
	type KodikBulkStatus,
	type MoonanimeBulkStatus,
} from "@/lib/api"
import { PasswordChecklist } from "@/components/password-checklist"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { labelForScheduleTimezone, SCHEDULE_TIMEZONE_OPTIONS } from "@/lib/timezone"

function clientPasswordError(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters long"
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter"
  if (!/[0-9]/.test(pw)) return "Password must contain at least one digit"
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return "Password must contain at least one special character"
  return null
}

export default function RootSettingsPage() {
  const { user: me } = useAuth()
  const router = useRouter()

  const [pw, setPw] = useState("")
  const [show, setShow] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [privateMode, setPrivateMode] = useState<boolean | null>(null)
	const [registrationDisabled, setRegistrationDisabled] = useState<boolean | null>(null)
	const [scheduleTimezone, setScheduleTimezone] = useState<string>("Etc/GMT-5")
	const [timezoneDraft, setTimezoneDraft] = useState<string>("Etc/GMT-5")
	const [footerContactURL, setFooterContactURL] = useState<string>("")
	const [footerSocial, setFooterSocial] = useState<FooterSocialLinks>({
		telegram_url: "https://t.me/",
		vk: { enabled: false, url: "" },
		twitter: { enabled: false, url: "" },
		instagram: { enabled: false, url: "" },
		whatsapp: { enabled: false, url: "" },
	})
	const [kodikGeoblock, setKodikGeoblock] = useState<string>("")
	const [kodikHideSelectors, setKodikHideSelectors] = useState<boolean>(false)
	const [kodikSkipEnabled, setKodikSkipEnabled] = useState<boolean>(false)
	const [kodikSkipValue, setKodikSkipValue] = useState<string>("")
	const [kodikBulkState, setKodikBulkState] = useState<KodikBulkStatus | null>(null)
	const [kodikRangeFrom, setKodikRangeFrom] = useState<string>("")
	const [kodikRangeTo, setKodikRangeTo] = useState<string>("")
	const [kodikBulkError, setKodikBulkError] = useState<string | null>(null)
	const [moonanimeBulkState, setMoonanimeBulkState] = useState<MoonanimeBulkStatus | null>(null)
	const [moonanimeRangeFrom, setMoonanimeRangeFrom] = useState<string>("")
	const [moonanimeRangeTo, setMoonanimeRangeTo] = useState<string>("")
	const [moonanimeBulkError, setMoonanimeBulkError] = useState<string | null>(null)
	const [malTopRows, setMalTopRows] = useState<AdminMALTopRow[]>([])
	const [malTopRank, setMalTopRank] = useState<string>("")
	const [malTopAnimeId, setMalTopAnimeId] = useState<string>("")
	const [malTopTitle, setMalTopTitle] = useState<string>("")
	const [malTopImageUrl, setMalTopImageUrl] = useState<string>("")
	const [malTopError, setMalTopError] = useState<string | null>(null)
	const [purgeWpMinutes, setPurgeWpMinutes] = useState<string>("1440")
	const [purgeWpNotice, setPurgeWpNotice] = useState<string | null>(null)

  const pwError = useMemo(() => (pw.trim() ? clientPasswordError(pw) : null), [pw])

  useEffect(() => {
    if (me && me.role !== "root") {
      router.push("/admin/settings")
    }
  }, [me, router])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await getPublicSettings()
			if (!mounted) return
			setPrivateMode(s.private_mode)
			setRegistrationDisabled(s.registration_disabled)
			setScheduleTimezone(s.schedule_timezone)
			setTimezoneDraft(s.schedule_timezone)
				setFooterContactURL(s.footer_contact_url || "")
				setFooterSocial(s.footer_social_links)
					setKodikGeoblock(s.kodik_geoblock || "")
					setKodikHideSelectors(!!s.kodik_hide_selectors)
					setKodikSkipEnabled(!!s.kodik_skip_enabled)
					setKodikSkipValue(s.kodik_skip_value || "")
      } catch {
        if (mounted) setPrivateMode(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

	useEffect(() => {
		let mounted = true
		let timer: any
		const poll = async () => {
			try {
				const [k, m] = await Promise.all([adminKodikBulkStatus(), adminMoonanimeBulkStatus()])
				if (!mounted) return
				setKodikBulkState(k)
				setMoonanimeBulkState(m)
				if (k?.status === "running" || m?.status === "running") {
					timer = window.setTimeout(poll, 2000)
				}
			} catch {
				if (!mounted) return
			}
		}
		poll()
		return () => {
			mounted = false
			if (timer) window.clearTimeout(timer)
		}
	}, [])

	useEffect(() => {
		let mounted = true
		if (me?.role !== "root") return
		;(async () => {
			try {
				const rows = await adminGetMALTopAnime()
				if (!mounted) return
				setMalTopRows(rows)
			} catch {
				if (!mounted) return
			}
		})()
		return () => {
			mounted = false
		}
	}, [me?.role])

  const onSaveDefaultPassword = async () => {
    if (!isRootLike) {
      setError("Root access required")
      return
    }
    setError(null)
    setNotice(null)

    const next = pw.trim()
    if (!next) {
      setError("Password is required")
      return
    }
    if (pwError) {
      setError(pwError)
      return
    }

    setIsBusy(true)
    try {
      await adminSetDefaultPassword({ password: next })
      setNotice("Default password updated")
      setPw("")
      setShow(false)
    } catch (e: any) {
      setError(e?.message || "Failed to update default password")
    } finally {
      setIsBusy(false)
    }
  }

  const onSavePrivateMode = async () => {
    if (!isRootLike) {
      setError("Root access required")
      return
    }
    if (privateMode === null) return
    setError(null)
    setNotice(null)
    setIsBusy(true)
    try {
      await adminSetPrivateMode({ enabled: privateMode })
      setNotice("Private Mode updated")
    } catch (e: any) {
      setError(e?.message || "Failed to update private mode")
    } finally {
      setIsBusy(false)
    }
  }

	const onSaveRegistrationDisabled = async () => {
		if (!isRootLike) {
			setError("Root access required")
			return
		}
		if (registrationDisabled === null) return
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminSetRegistrationDisabled({ enabled: registrationDisabled })
			setNotice("Registration setting updated")
		} catch (e: any) {
			setError(e?.message || "Failed to update registration setting")
		} finally {
			setIsBusy(false)
		}
	}

	const onSaveFooterLinks = async () => {
		if (!isRootLike) {
			setError("Root access required")
			return
		}
		const telegram = footerSocial.telegram_url.trim()
		if (!telegram) {
			setError("Telegram URL is required")
			return
		}
		if (footerSocial.vk.enabled && !footerSocial.vk.url.trim()) {
			setError("VK URL is required when enabled")
			return
		}
		if (footerSocial.twitter.enabled && !footerSocial.twitter.url.trim()) {
			setError("Twitter URL is required when enabled")
			return
		}
		if (footerSocial.instagram.enabled && !footerSocial.instagram.url.trim()) {
			setError("Instagram URL is required when enabled")
			return
		}
		if (footerSocial.whatsapp.enabled && !footerSocial.whatsapp.url.trim()) {
			setError("WhatsApp URL is required when enabled")
			return
		}

		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminSetFooterLinks({
				contact_url: footerContactURL,
				social_links: {
					...footerSocial,
					telegram_url: telegram,
					vk: { ...footerSocial.vk, url: footerSocial.vk.url.trim() },
					twitter: { ...footerSocial.twitter, url: footerSocial.twitter.url.trim() },
					instagram: { ...footerSocial.instagram, url: footerSocial.instagram.url.trim() },
					whatsapp: { ...footerSocial.whatsapp, url: footerSocial.whatsapp.url.trim() },
				},
			})
			setNotice("Footer links updated")
		} catch (e: any) {
			setError(e?.message || "Failed to update footer links")
		} finally {
			setIsBusy(false)
		}
	}

	const onPurgeOfflineWatchPartyRooms = async () => {
		if (!isRootLike) {
			setError("Root access required")
			return
		}
		setError(null)
		setNotice(null)
		setPurgeWpNotice(null)
		const minutes = Number(purgeWpMinutes)
		if (!Number.isFinite(minutes) || minutes <= 0) {
			setError("Invalid minutes")
			return
		}
		setIsBusy(true)
		try {
			const r = await adminPurgeOfflineWatchPartyRooms({ older_than_minutes: Math.floor(minutes) })
			setPurgeWpNotice(`Deleted ${r.deleted_count} rooms`)
		} catch (e: any) {
			setError(e?.message || "Failed to purge rooms")
		} finally {
			setIsBusy(false)
		}
	}


	const onSaveKodikSettings = async () => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminSetKodikPlayerSettings({
				geoblock: kodikGeoblock,
				hide_selectors: kodikHideSelectors,
				skip_enabled: kodikSkipEnabled,
				skip_value: kodikSkipValue,
			})
			setNotice("Kodik player settings updated")
		} catch (e: any) {
			setError(e?.message || "Failed to update Kodik settings")
		} finally {
			setIsBusy(false)
		}
	}

	const onSaveTimezone = async () => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		const next = timezoneDraft.trim()
		if (!next) {
			setError("Timezone is required")
			return
		}
		setError(null)
		setNotice(null)
		const ok = window.confirm(
			"This will recalculate all existing schedules so their local times remain correct in the new timezone. Continue?"
		)
		if (!ok) return
		setIsBusy(true)
		try {
			const res = await adminSetScheduleTimezone({ timezone: next })
			setScheduleTimezone(res.timezone)
			setTimezoneDraft(res.timezone)
			const recalculated = typeof (res as any).recalculated === "number" ? (res as any).recalculated : 0
			setNotice(`Timezone updated to ${res.timezone}. Recalculated ${recalculated} schedules.`)
		} catch (e: any) {
			setError(e?.message || "Failed to update timezone")
		} finally {
			setIsBusy(false)
		}
	}

	const onPurgeSchedules = async () => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		setError(null)
		setNotice(null)
		const ok = window.confirm("Permanently delete schedules older than 1 month? This cannot be undone.")
		if (!ok) return
		setIsBusy(true)
		try {
			const res = await adminPurgeOldSchedules({})
			setNotice(`Deleted ${res.deleted_count} schedules older than 1 month.`)
		} catch (e: any) {
			setError(e?.message || "Failed to purge schedules")
		} finally {
			setIsBusy(false)
		}
	}

	const onSyncTopAnime = async () => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminSyncTopAnime()
			setNotice("MAL Top 100 anime synced")
		} catch (e: any) {
			setError(e?.message || "Failed to sync MAL top")
		} finally {
			setIsBusy(false)
		}
	}

	const reloadMalTop = async () => {
		if (me?.role !== "root") return
		try {
			const rows = await adminGetMALTopAnime()
			setMalTopRows(rows)
		} catch (e: any) {
			setMalTopError(e?.message || "Failed")
		}
	}

	const onUpsertMalTop = async () => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		setMalTopError(null)
		setError(null)
		setNotice(null)
		const rank = Number(malTopRank)
		const animeId = Number(malTopAnimeId)
		if (!Number.isFinite(rank) || rank <= 0 || rank > 100) {
			setMalTopError("Rank must be 1..100")
			return
		}
		if (!Number.isFinite(animeId) || animeId <= 0) {
			setMalTopError("anime_id must be > 0")
			return
		}
		setIsBusy(true)
		try {
			await adminUpsertMALTopAnime({
				rank,
				animeId,
				title: malTopTitle,
				imageUrl: malTopImageUrl,
			})
			setNotice("MAL Top row saved")
			await reloadMalTop()
		} catch (e: any) {
			setMalTopError(e?.message || "Failed")
		} finally {
			setIsBusy(false)
		}
	}

	const onDeleteMalTop = async (rank: number) => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		setMalTopError(null)
		setError(null)
		setNotice(null)
		setIsBusy(true)
		try {
			await adminDeleteMALTopAnime(rank)
			setNotice("MAL Top row deleted")
			await reloadMalTop()
		} catch (e: any) {
			setMalTopError(e?.message || "Failed")
		} finally {
			setIsBusy(false)
		}
	}

	const startKodikBulk = async (scope: "all" | "ongoing" | "range", mode: "add" | "sync") => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		setError(null)
		setNotice(null)
		setKodikBulkError(null)
		setIsBusy(true)
		try {
			if (scope === "range") {
				const fromId = Number(kodikRangeFrom)
				const toId = Number(kodikRangeTo)
				await adminKodikBulkStart({ scope: "range", mode, fromId, toId })
			} else {
				await adminKodikBulkStart({ scope, mode })
			}
			const st = await adminKodikBulkStatus()
			setKodikBulkState(st)
			setNotice("Kodik bulk job started")
		} catch (e: any) {
			setKodikBulkError(e?.message || "Failed")
		} finally {
			setIsBusy(false)
		}
	}

	const startMoonanimeBulk = async (scope: "all" | "ongoing" | "range", mode: "add" | "sync") => {
		if (me?.role !== "root") {
			setError("Root access required")
			return
		}
		setError(null)
		setNotice(null)
		setMoonanimeBulkError(null)
		setIsBusy(true)
		try {
			if (scope === "range") {
				const fromId = Number(moonanimeRangeFrom)
				const toId = Number(moonanimeRangeTo)
				await adminMoonanimeBulkStart({ scope: "range", mode, fromId, toId })
			} else {
				await adminMoonanimeBulkStart({ scope, mode })
			}
			const st = await adminMoonanimeBulkStatus()
			setMoonanimeBulkState(st)
			setNotice("Moonanime bulk job started")
		} catch (e: any) {
			setMoonanimeBulkError(e?.message || "Failed")
		} finally {
			setIsBusy(false)
		}
	}

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold text-foreground">Root Settings</div>
        <div className="text-sm text-foreground-muted">Root-only global settings.</div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
        <div className="text-sm font-semibold text-foreground">Default Password</div>
        <div className="mt-1 text-xs text-foreground-muted">Used by “Reset to Default” in user editing.</div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">New default password</label>
          <div className="relative">
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              type={show ? "text" : "password"}
              disabled={isBusy}
              className={cn(
                "w-full h-11 rounded-xl bg-background border px-4 pr-12 text-sm text-foreground outline-none focus:border-primary/50",
                error ? "border-red-500/50" : "border-border/60"
              )}
              placeholder="LycorisLib$1"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              disabled={isBusy}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pwError ? <div className="text-xs text-red-300">{pwError}</div> : null}
        </div>

        <div className="mt-3">
          <PasswordChecklist password={pw} />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onSaveDefaultPassword}
            disabled={isBusy}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
              isBusy && "opacity-60 cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

		<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
			<div className="text-sm font-semibold text-foreground">Schedule timezone</div>
			<div className="mt-1 text-xs text-foreground-muted">
				All schedule dates and times are managed and displayed in this timezone.
			</div>

			<div className="mt-4 space-y-2">
				<label className="text-xs font-semibold text-foreground-muted">Timezone</label>
				<select
					value={timezoneDraft}
					onChange={(e) => setTimezoneDraft(e.target.value)}
					disabled={isBusy}
					className={cn(
						"w-full h-11 rounded-xl bg-background border px-4 text-sm text-foreground outline-none focus:border-primary/50",
						error ? "border-red-500/50" : "border-border/60"
					)}
				>
					{SCHEDULE_TIMEZONE_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
				<div className="text-xs text-foreground-muted">Current: {labelForScheduleTimezone(scheduleTimezone)}</div>
			</div>

			<div className="mt-4 flex justify-end">
				<button
					type="button"
					onClick={onSaveTimezone}
					disabled={isBusy}
					className={cn(
						"inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
						isBusy && "opacity-60 cursor-not-allowed"
					)}
				>
					<Save className="w-4 h-4" />
					Save and recalculate
				</button>
			</div>
		</div>

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
        <div className="text-sm font-semibold text-foreground">Private Mode</div>
        <div className="mt-1 text-xs text-foreground-muted">When enabled, unauthenticated visitors are redirected to /login.</div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-sm text-foreground">Require login to view site</div>
          <input
            type="checkbox"
            checked={privateMode === true}
            onChange={(e) => setPrivateMode(e.target.checked)}
            disabled={isBusy || privateMode === null}
            className="h-5 w-5"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onSavePrivateMode}
            disabled={isBusy || privateMode === null}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
              (isBusy || privateMode === null) && "opacity-60 cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="text-sm font-semibold text-foreground">Disable Registration</div>
				<div className="mt-1 text-xs text-foreground-muted">When enabled, new user registration is disabled and /register redirects to /login.</div>

				<div className="mt-4 flex items-center justify-between gap-4">
					<div className="text-sm text-foreground">Disable /register</div>
					<input
						type="checkbox"
						checked={registrationDisabled === true}
						onChange={(e) => setRegistrationDisabled(e.target.checked)}
						disabled={isBusy || registrationDisabled === null}
						className="h-5 w-5"
					/>
				</div>

				<div className="mt-4 flex justify-end">
					<button
						type="button"
						onClick={onSaveRegistrationDisabled}
						disabled={isBusy || registrationDisabled === null}
						className={cn(
							"inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							(isBusy || registrationDisabled === null) && "opacity-60 cursor-not-allowed"
						)}
					>
						<Save className="w-4 h-4" />
						Save
					</button>
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="text-sm font-semibold text-foreground">Footer Links</div>
				<div className="mt-1 text-xs text-foreground-muted">Manage Contacts link and social icons in the footer.</div>

				<div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">Contacts URL</label>
						<input
							value={footerContactURL}
							onChange={(e) => setFooterContactURL(e.target.value)}
							disabled={isBusy}
							placeholder="https://... or /contact or #contact"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">Telegram URL (always active)</label>
						<input
							value={footerSocial.telegram_url}
							onChange={(e) => setFooterSocial((p) => ({ ...p, telegram_url: e.target.value }))}
							disabled={isBusy}
							placeholder="https://t.me/..."
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-xs font-semibold text-foreground-muted">VK</label>
							<input
								type="checkbox"
								checked={footerSocial.vk.enabled}
								onChange={(e) => setFooterSocial((p) => ({ ...p, vk: { ...p.vk, enabled: e.target.checked } }))}
								disabled={isBusy}
								className="h-5 w-5"
							/>
						</div>
						<input
							value={footerSocial.vk.url}
							onChange={(e) => setFooterSocial((p) => ({ ...p, vk: { ...p.vk, url: e.target.value } }))}
							disabled={isBusy || !footerSocial.vk.enabled}
							placeholder="https://vk.com/..."
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-xs font-semibold text-foreground-muted">Twitter</label>
							<input
								type="checkbox"
								checked={footerSocial.twitter.enabled}
								onChange={(e) => setFooterSocial((p) => ({ ...p, twitter: { ...p.twitter, enabled: e.target.checked } }))}
								disabled={isBusy}
								className="h-5 w-5"
							/>
						</div>
						<input
							value={footerSocial.twitter.url}
							onChange={(e) => setFooterSocial((p) => ({ ...p, twitter: { ...p.twitter, url: e.target.value } }))}
							disabled={isBusy || !footerSocial.twitter.enabled}
							placeholder="https://twitter.com/..."
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-xs font-semibold text-foreground-muted">Instagram</label>
							<input
								type="checkbox"
								checked={footerSocial.instagram.enabled}
								onChange={(e) => setFooterSocial((p) => ({ ...p, instagram: { ...p.instagram, enabled: e.target.checked } }))}
								disabled={isBusy}
								className="h-5 w-5"
							/>
						</div>
						<input
							value={footerSocial.instagram.url}
							onChange={(e) => setFooterSocial((p) => ({ ...p, instagram: { ...p.instagram, url: e.target.value } }))}
							disabled={isBusy || !footerSocial.instagram.enabled}
							placeholder="https://instagram.com/..."
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-xs font-semibold text-foreground-muted">WhatsApp</label>
							<input
								type="checkbox"
								checked={footerSocial.whatsapp.enabled}
								onChange={(e) => setFooterSocial((p) => ({ ...p, whatsapp: { ...p.whatsapp, enabled: e.target.checked } }))}
								disabled={isBusy}
								className="h-5 w-5"
							/>
						</div>
						<input
							value={footerSocial.whatsapp.url}
							onChange={(e) => setFooterSocial((p) => ({ ...p, whatsapp: { ...p.whatsapp, url: e.target.value } }))}
							disabled={isBusy || !footerSocial.whatsapp.enabled}
							placeholder="https://wa.me/..."
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60"
						/>
					</div>
				</div>

				<div className="mt-4 flex justify-end">
					<button
						type="button"
						onClick={onSaveFooterLinks}
						disabled={isBusy}
						className={cn(
							"inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						<Save className="w-4 h-4" />
						Save
					</button>
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="text-sm font-semibold text-foreground">Kodik Player Settings</div>
				<div className="mt-1 text-xs text-foreground-muted">Global iframe parameters applied to Kodik sources.</div>

				<div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">Geoblock (countries)</label>
						<input
							value={kodikGeoblock}
							onChange={(e) => setKodikGeoblock(e.target.value)}
							disabled={isBusy}
							placeholder="RU,UA"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
						<div className="text-xs text-foreground-muted">Comma-separated ISO codes, e.g. RU,UA</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between gap-4">
							<div className="text-sm text-foreground">Hide selectors (season/episode/translation)</div>
							<input
								type="checkbox"
								checked={kodikHideSelectors}
								onChange={(e) => setKodikHideSelectors(e.target.checked)}
								disabled={isBusy}
								className="h-5 w-5"
							/>
						</div>

						<div className="flex items-center justify-between gap-4">
							<div className="text-sm text-foreground">Enable skip opening/ending</div>
							<input
								type="checkbox"
								checked={kodikSkipEnabled}
								onChange={(e) => setKodikSkipEnabled(e.target.checked)}
								disabled={isBusy}
								className="h-5 w-5"
							/>
						</div>

						<input
							value={kodikSkipValue}
							onChange={(e) => setKodikSkipValue(e.target.value)}
							disabled={isBusy || !kodikSkipEnabled}
							placeholder="[opening]12-60,[ending]24:12-26:15"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60"
						/>
						<div className="text-xs text-foreground-muted">Optional: Kodik skip_button value. Leave empty to disable.</div>
					</div>
				</div>

				<div className="mt-4 flex justify-end">
					<button
						type="button"
						onClick={onSaveKodikSettings}
						disabled={isBusy}
						className={cn(
							"inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						<Save className="w-4 h-4" />
						Save
					</button>
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="text-sm font-semibold text-foreground">Kodik bulk</div>
				<div className="mt-1 text-xs text-foreground-muted">
					Run Kodik Add/Sync for many animes. Use with care (root only).
				</div>

				<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
					<button
						type="button"
						onClick={() => startKodikBulk("all", "add")}
						disabled={isBusy}
						className={cn(
							"rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For all anime Add kodik
					</button>
					<button
						type="button"
						onClick={() => startKodikBulk("all", "sync")}
						disabled={isBusy}
						className={cn(
							"rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For all anime Sync kodik
					</button>
					<button
						type="button"
						onClick={() => startKodikBulk("ongoing", "add")}
						disabled={isBusy}
						className={cn(
							"rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For ongoing anime Add kodik
					</button>
					<button
						type="button"
						onClick={() => startKodikBulk("ongoing", "sync")}
						disabled={isBusy}
						className={cn(
							"rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For ongoing anime Sync kodik
					</button>
				</div>

				<div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">From anime id</label>
						<input
							value={kodikRangeFrom}
							onChange={(e) => setKodikRangeFrom(e.target.value)}
							disabled={isBusy}
							placeholder="130"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">To anime id</label>
						<input
							value={kodikRangeTo}
							onChange={(e) => setKodikRangeTo(e.target.value)}
							disabled={isBusy}
							placeholder="230"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<button
						type="button"
						onClick={() => startKodikBulk("range", "add")}
						disabled={isBusy}
						className={cn(
							"h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						Add kodik by id range
					</button>
					<button
						type="button"
						onClick={() => startKodikBulk("range", "sync")}
						disabled={isBusy}
						className={cn(
							"h-11 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						Sync kodik by id range
					</button>
				</div>
				<div className="mt-1 text-xs text-foreground-muted">Range size must be 100 or less.</div>

				{kodikBulkError ? <div className="mt-3 text-sm text-red-300">{kodikBulkError}</div> : null}
				{kodikBulkState ? (
					<div className="mt-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground">
						<div className="flex flex-wrap gap-x-4 gap-y-1">
							<div>
								<span className="font-semibold">Status:</span> {kodikBulkState.status}
							</div>
							{kodikBulkState.scope ? (
								<div>
									<span className="font-semibold">Scope:</span> {kodikBulkState.scope}
								</div>
							) : null}
							{kodikBulkState.mode ? (
								<div>
									<span className="font-semibold">Mode:</span> {kodikBulkState.mode}
								</div>
							) : null}
							{typeof kodikBulkState.processed === "number" && typeof kodikBulkState.total === "number" ? (
								<div>
									<span className="font-semibold">Progress:</span> {kodikBulkState.processed}/{kodikBulkState.total}
								</div>
							) : null}
							{typeof kodikBulkState.created_sources === "number" ? (
								<div>
									<span className="font-semibold">Sources:</span> +{kodikBulkState.created_sources} / ~{kodikBulkState.updated_sources || 0}
								</div>
							) : null}
						</div>
						{kodikBulkState.errors?.length ? (
							<div className="mt-2 max-h-28 overflow-auto text-xs text-foreground-muted">
								{kodikBulkState.errors.slice(0, 20).map((e, i) => (
									<div key={i}>{e}</div>
								))}
								{kodikBulkState.errors.length > 20 ? <div>…</div> : null}
							</div>
						) : null}
					</div>
				) : null}
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="text-sm font-semibold text-foreground">Moonanime bulk</div>
				<div className="mt-1 text-xs text-foreground-muted">Run Moonanime Add/Sync for many animes. Use with care (root only).</div>

				<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
					<button
						type="button"
						onClick={() => startMoonanimeBulk("all", "add")}
						disabled={isBusy}
						className={cn(
							"rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For all anime Add moonanime
					</button>
					<button
						type="button"
						onClick={() => startMoonanimeBulk("all", "sync")}
						disabled={isBusy}
						className={cn(
							"rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For all anime Sync moonanime
					</button>
					<button
						type="button"
						onClick={() => startMoonanimeBulk("ongoing", "add")}
						disabled={isBusy}
						className={cn(
							"rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For ongoing anime Add moonanime
					</button>
					<button
						type="button"
						onClick={() => startMoonanimeBulk("ongoing", "sync")}
						disabled={isBusy}
						className={cn(
							"rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						For ongoing anime Sync moonanime
					</button>
				</div>

				<div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">From anime id</label>
						<input
							value={moonanimeRangeFrom}
							onChange={(e) => setMoonanimeRangeFrom(e.target.value)}
							disabled={isBusy}
							placeholder="130"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">To anime id</label>
						<input
							value={moonanimeRangeTo}
							onChange={(e) => setMoonanimeRangeTo(e.target.value)}
							disabled={isBusy}
							placeholder="230"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<button
						type="button"
						onClick={() => startMoonanimeBulk("range", "add")}
						disabled={isBusy}
						className={cn(
							"h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						Add moonanime by id range
					</button>
					<button
						type="button"
						onClick={() => startMoonanimeBulk("range", "sync")}
						disabled={isBusy}
						className={cn(
							"h-11 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-secondary/40",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						Sync moonanime by id range
					</button>
				</div>
				<div className="mt-1 text-xs text-foreground-muted">Range size must be 100 or less.</div>

				{moonanimeBulkError ? <div className="mt-3 text-sm text-red-300">{moonanimeBulkError}</div> : null}
				{moonanimeBulkState ? (
					<div className="mt-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground">
						<div className="flex flex-wrap gap-x-4 gap-y-1">
							<div>
								<span className="font-semibold">Status:</span> {moonanimeBulkState.status}
							</div>
							{moonanimeBulkState.scope ? (
								<div>
									<span className="font-semibold">Scope:</span> {moonanimeBulkState.scope}
								</div>
							) : null}
							{moonanimeBulkState.mode ? (
								<div>
									<span className="font-semibold">Mode:</span> {moonanimeBulkState.mode}
								</div>
							) : null}
							{typeof moonanimeBulkState.processed === "number" && typeof moonanimeBulkState.total === "number" ? (
								<div>
									<span className="font-semibold">Progress:</span> {moonanimeBulkState.processed}/{moonanimeBulkState.total}
								</div>
							) : null}
							{typeof moonanimeBulkState.created_sources === "number" ? (
								<div>
									<span className="font-semibold">Sources:</span> +{moonanimeBulkState.created_sources} / ~{moonanimeBulkState.updated_sources || 0}
								</div>
							) : null}
						</div>
						{moonanimeBulkState.errors?.length ? (
							<div className="mt-2 max-h-28 overflow-auto text-xs text-foreground-muted">
								{moonanimeBulkState.errors.slice(0, 20).map((e, i) => (
									<div key={i}>{e}</div>
								))}
								{moonanimeBulkState.errors.length > 20 ? <div>…</div> : null}
							</div>
						) : null}
					</div>
				) : null}
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="text-sm font-semibold text-foreground">MAL Top 100</div>
				<div className="mt-1 text-xs text-foreground-muted">Manually refresh cached Top 100 anime list.</div>
				<div className="mt-4 flex justify-end">
					<button
						type="button"
						onClick={onSyncTopAnime}
						disabled={isBusy}
						className={cn(
							"inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						<Save className="w-4 h-4" />
						Update top 100 anime
					</button>
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
				<div className="text-sm font-semibold text-foreground">MAL Top 100 (manual)</div>
				<div className="mt-1 text-xs text-foreground-muted">Add or edit cached ranking rows by rank (1..100).</div>

				<div className="mt-4 grid grid-cols-1 lg:grid-cols-[120px_160px_1fr_1fr_auto] gap-2 items-end">
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">Rank</label>
						<input
							value={malTopRank}
							onChange={(e) => setMalTopRank(e.target.value)}
							disabled={isBusy}
							placeholder="1"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">MAL anime_id</label>
						<input
							value={malTopAnimeId}
							onChange={(e) => setMalTopAnimeId(e.target.value)}
							disabled={isBusy}
							placeholder="5114"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">Title (optional)</label>
						<input
							value={malTopTitle}
							onChange={(e) => setMalTopTitle(e.target.value)}
							disabled={isBusy}
							placeholder="Leave empty to auto-fill"
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">Image URL (optional)</label>
						<input
							value={malTopImageUrl}
							onChange={(e) => setMalTopImageUrl(e.target.value)}
							disabled={isBusy}
							placeholder=""
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						/>
					</div>
					<button
						type="button"
						onClick={onUpsertMalTop}
						disabled={isBusy}
						className={cn(
							"h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
							isBusy && "opacity-60 cursor-not-allowed"
						)}
					>
						Save
					</button>
				</div>

				{malTopError ? <div className="mt-3 text-sm text-red-300">{malTopError}</div> : null}

				<div className="mt-4 rounded-xl border border-border/60 bg-background/40 overflow-hidden">
					<div className="max-h-64 overflow-auto">
						<table className="w-full text-sm">
							<thead className="text-xs text-foreground-muted border-b border-border/60">
								<tr>
									<th className="px-3 py-2 text-left">Rank</th>
									<th className="px-3 py-2 text-left">MAL ID</th>
									<th className="px-3 py-2 text-left">Title</th>
									<th className="px-3 py-2 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{malTopRows.map((r) => (
									<tr key={r.rank} className="border-b border-border/40 last:border-0">
										<td className="px-3 py-2">{r.rank}</td>
										<td className="px-3 py-2">{r.anime_id}</td>
										<td className="px-3 py-2 truncate max-w-[420px]">{r.title}</td>
										<td className="px-3 py-2">
											<div className="flex justify-end gap-2">
												<button
													type="button"
													onClick={() => {
														setMalTopRank(String(r.rank))
														setMalTopAnimeId(String(r.anime_id))
														setMalTopTitle(r.title)
														setMalTopImageUrl(r.image_url || "")
													}}
													className="h-9 rounded-xl border border-border/60 bg-background px-3 text-xs font-semibold text-foreground hover:bg-background-secondary/40"
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => onDeleteMalTop(r.rank)}
													disabled={isBusy}
													className={cn(
														"h-9 rounded-xl border border-red-500/40 bg-red-500/10 px-3 text-xs font-semibold text-red-300 hover:bg-red-500/15",
														isBusy && "opacity-60 cursor-not-allowed"
													)}
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

		<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
			<div className="text-sm font-semibold text-foreground">Watch Party cleanup</div>
			<div className="mt-1 text-xs text-foreground-muted">Delete rooms that are offline (no active WebSocket connections) and older than N minutes.</div>
			<div className="mt-4 flex flex-wrap items-end justify-between gap-3">
				<div>
					<div className="text-xs text-foreground-muted">Older than (minutes)</div>
					<input
						type="number"
						min={1}
						step={1}
						value={purgeWpMinutes}
						onChange={(e) => setPurgeWpMinutes(e.target.value)}
						className="mt-1 h-10 w-40 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none"
					/>
					{purgeWpNotice ? <div className="mt-2 text-xs text-foreground-muted">{purgeWpNotice}</div> : null}
				</div>
				<button
					type="button"
					onClick={onPurgeOfflineWatchPartyRooms}
					disabled={isBusy}
					className={cn(
						"inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/15",
						isBusy && "opacity-60 cursor-not-allowed"
					)}
				>
					<Trash2 className="w-4 h-4" />
					Delete Offline Rooms
				</button>
			</div>
		</div>

		<div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
			<div className="text-sm font-semibold text-foreground">Schedule cleanup</div>
			<div className="mt-1 text-xs text-foreground-muted">Permanently delete schedule entries older than 1 month.</div>
			<div className="mt-4 flex justify-end">
				<button
					type="button"
					onClick={onPurgeSchedules}
					disabled={isBusy}
					className={cn(
						"inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/15",
						isBusy && "opacity-60 cursor-not-allowed"
					)}
				>
					<Trash2 className="w-4 h-4" />
					Delete Past Schedules
				</button>
			</div>
		</div>
    </div>
  )
}
