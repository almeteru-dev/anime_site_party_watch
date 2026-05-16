export interface Language {
  id: number
  code: string
  name: string
}

export interface Genre {
  id: number
  name: string
  ru_name?: string | null
}

export interface Theme {
  id: number
  name: string
  ru_name?: string | null
}

export interface Producer {
  id: number
  name: string
}

export type WatchPartyRole = "owner" | "moderator" | "viewer"
export type WatchPartyRoomStatus = "active" | "dissolved" | "expired"

export type WatchPartyContentState = {
  anime_slug?: string
  selected_type?: "dubbed" | "subbed"
  selected_episode_number?: number | null
  selected_season?: number | null
  selected_voice_group_id?: number | null
  selected_server_label?: string
  selected_source_id?: number | null
}

export type WatchPartyRoomState = {
  id: number
  owner_user_id: number
  is_public: boolean
  status: WatchPartyRoomStatus
  expires_at: string
  invite_code?: string
  content_state: WatchPartyContentState
  is_playing: boolean
  playback_rate: number
  playback_position_sec: number
  playback_seq: number
  last_state_at: string
}

export type WatchPartyGetRoomResponse = {
  room: WatchPartyRoomState
  self_role: WatchPartyRole
  requires_password: boolean
  needs_join: boolean
}

export type WatchPartyCreateRoomInput = {
  is_public: boolean
  password?: string
  content: WatchPartyContentState
}

export type WatchPartyCreateRoomResponse = {
  room_id: number
  invite_code: string
  expires_at: string
}

export interface Studio {
  id: number
  name: string
  ru_name?: string | null
}

export interface KindOption {
  id: number
  name: string
  ru_name?: string | null
}

export interface RatingOption {
  id: number
  name: string
}

export interface Status {
  id: number
  name: string
  ru_name?: string | null
}

export interface Source {
  id: number
  name: string
  ru_name?: string | null
}

export interface AnimeTranslation {
  id: number
  anime_id: number
  language_id: number
  title: string
  description: string
  language: Language
}

export interface VoiceGroup {
  id: number
  name: string
  type: "dub" | "sub"
}

export interface VideoLabel {
  id: number
  name: string
  is_external_player: boolean
  created_at?: string
  updated_at?: string
}

export interface FAQItem {
  id: number
  question: string
  question_ru?: string | null
  answer: string
  answer_ru?: string | null
  is_published: boolean
  priority: number
  created_at?: string
  updated_at?: string
}

export interface VideoSource {
  id: number
  episode_id: number
	voice_group_id?: number | null
  voice_group?: VoiceGroup | null
  label_id?: number | null
  label: string
  video_label?: VideoLabel | null
  type: "iframe" | "direct"
  url: string
  audio?: "dub" | "sub" | null
  is_integrated_player?: boolean
  is_default: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Episode {
  id: number
  anime_id: number
  number: number
	kind?: string
  duration: number
  created_at: string
  video_sources?: VideoSource[]
}

export interface EpisodeItem {
  id: number
  number: number
  duration: number
  group_id: number
  video_sources: VideoSource[]
}

export interface EpisodeGroup {
  id: number
  name: string
  type: "dub" | "sub"
  episodes: EpisodeItem[]
}

export type EpisodesByServer = Record<string, { dub: EpisodeGroup[]; sub: EpisodeGroup[] }>

export interface AnimeDetailsResponse {
  anime: Anime
  episodes: EpisodesByServer
}

export interface Anime {
  id: number
  studio_id: number | null
  producer_id: number | null
	producer_ids?: number[]
  status_id: number | null
  source_id: number | null
	shikimori_id?: number | null
	mal_id?: number | null
	worldart_id?: number | null
	shiki_english?: string[]
	shiki_japanese?: string[]
	shiki_synonyms?: string[]
	shiki_fansubbers?: string[]
	shiki_fandubbers?: string[]
  name: string
  is_featured?: boolean
  featured_at?: string | null
  kind: string
  kind_ru_name?: string | null
  url: string
  duration: number
  rating: string
  image_url: string
  image?: string
	background_url?: string
  trailer_url?: string
  score: number
  rating_avg?: number
  rating_count?: number
  episodes: number
  episodes_aired: number
  aired_on: string | null
  released_on: string | null
  studio: Studio | null
  producer: Producer | null
	producers?: Producer[] | null
  status: Status | null
  source: Source | null
  genres: Genre[] | null
  themes: Theme[] | null
  translations: AnimeTranslation[] | null
	alt_titles?: { id: number; title: string }[] | null
	gallery_images?: { id: number; url: string; sort_order: number }[] | null
}

function resolveSiteOrigin(): string {
	const candidates = [
		process.env.NEXT_PUBLIC_SITE_URL,
		process.env.NEXT_PUBLIC_APP_URL,
		process.env.NEXT_PUBLIC_FRONTEND_URL,
	]

	for (const c of candidates) {
		if (typeof c === "string" && /^https?:\/\//.test(c)) {
			return c.replace(/\/$/, "")
		}
	}

	const vercel = process.env.VERCEL_URL
	if (typeof vercel === "string" && vercel.trim()) {
		return `https://${vercel.trim()}`
	}

	if (process.env.NODE_ENV === "production") {
		console.error("CRITICAL: No valid NEXT_PUBLIC_SITE_URL or VERCEL_URL found in production environment.")
	}

	return "http://localhost:3000"
}

const API_URL = (() => {
	if (typeof window !== "undefined") return "/api"
	const internal = (process.env.INTERNAL_API_URL || "").trim()
	if (internal) return internal.replace(/\/$/, "")
	return `${resolveSiteOrigin()}/api`
})()

const baseFetch: typeof globalThis.fetch = (...args) => globalThis.fetch(...args)

const fetch: typeof globalThis.fetch = async (input: any, init?: any) => {
	const nextInit: RequestInit = {
		...(init || {}),
	}

	if (typeof window !== "undefined" && !nextInit.credentials) {
		nextInit.credentials = "include"
	}

	const res = await baseFetch(input, nextInit)
	if (typeof window !== "undefined") {
		if (res.status === 401) {
			window.dispatchEvent(new CustomEvent("auth:force-logout", { detail: { error_code: "REVOKED" } }))
		} else if (res.status === 403) {
			try {
				const cloned = res.clone()
				const data = (await cloned.json()) as any
				const code = data?.error_code
				if (code === "BANNED" || code === "NOT_VERIFIED" || code === "REVOKED") {
					window.dispatchEvent(
						new CustomEvent("auth:force-logout", { detail: { error_code: code, ban_reason: data?.ban_reason || "" } })
					)
				}
			} catch {
				;
			}
		}
	}
	return res
}

export type AnimeSearchItem = {
	id: number
	url: string
	image_url: string
	title_ru: string
	title_en: string
}

type ApiErrorPayload = {
  error?: string
  error_code?: string
  ban_reason?: string
}

function maybeForceLogout(payload: ApiErrorPayload) {
  if (typeof window === "undefined") return
  const code = payload?.error_code
  if (code !== "BANNED" && code !== "REVOKED" && code !== "NOT_VERIFIED") return
  window.dispatchEvent(
    new CustomEvent("auth:force-logout", {
      detail: { error_code: code, ban_reason: payload?.ban_reason || "" },
    })
  )
}

export interface CatalogMeta {
  genres: Genre[]
  themes: Theme[]
  statuses: Status[]
  studios: Studio[]
  producers: Producer[]
  sources: Source[]
  ratings: RatingOption[]
  kinds: KindOption[]
  year_min: number
  year_max: number
}

export type GetAnimesParams = {
  q?: string
  genres?: string[]
  themes?: string[]
  types?: string[]
  statuses?: string[]
  studios?: string[]
  producers?: string[]
  sources?: string[]
  ratings?: string[]
  year_from?: number
  year_to?: number
  min_rating?: number
  release_unknown?: boolean
  complete_only?: boolean
  sort_by?: "score" | "studio" | "source" | "rating"
  sort_dir?: "asc" | "desc"
}

export type AdminUser = {
  id: number
  username: string
  email: string
  role: string
  is_verified: boolean
  is_banned: boolean
  ban_reason: string | null
  created_at: string
}

export type AdminListUsersResponse = {
  users: AdminUser[]
  total: number
}

export async function adminListUsers(params: {
  q?: string
  role?: "all" | "user" | "moderator" | "admin" | "root"
  status?: "all" | "active" | "not_verified" | "banned"
  page?: number
  limit?: number
}): Promise<AdminListUsersResponse> {
  const qs = new URLSearchParams()
  if (params.q?.trim()) qs.set("q", params.q.trim())
  if (params.role && params.role !== "all") qs.set("role", params.role)
  if (params.status && params.status !== "all") qs.set("status", params.status)
  if (typeof params.page === "number") qs.set("page", String(params.page))
  if (typeof params.limit === "number") qs.set("limit", String(params.limit))

  const res = await fetch(`${API_URL}/admin/users?${qs.toString()}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to fetch users")
  }
  return data
}

export async function adminGetUser(params: { id: string }): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/admin/users/${params.id}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to fetch user")
  }
  return data
}

export async function adminUpdateUser(params: {
  id: string
  input: { username?: string; email?: string; role?: "user" | "moderator" | "admin"; is_verified?: boolean }
}): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/admin/users/${params.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update user")
  }
  return data
}

export async function adminResetUserPasswordDefault(params: { id: string }): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${params.id}/reset-password-default`, {
    method: "POST",
    credentials: "include",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to reset password")
  }
}

export async function adminSetDefaultPassword(params: { password: string }): Promise<void> {
  const res = await fetch(`${API_URL}/admin/settings/default-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ password: params.password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update default password")
  }
}

export async function adminSetPrivateMode(params: { enabled: boolean }): Promise<void> {
	const res = await fetch(`${API_URL}/admin/settings/private-mode`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ enabled: params.enabled }),
	})

	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to update private mode")
	}
}

export async function adminSetRegistrationDisabled(params: { enabled: boolean }): Promise<void> {
	const res = await fetch(`${API_URL}/admin/settings/registration-disabled`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ enabled: params.enabled }),
	})

	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to update registration setting")
	}
}

export type FooterToggleLink = {
	enabled: boolean
	url: string
}

export type FooterSocialLinks = {
	telegram_url: string
	vk: FooterToggleLink
	twitter: FooterToggleLink
	instagram: FooterToggleLink
	whatsapp: FooterToggleLink
}

export async function adminSetFooterLinks(params: {
	contact_url: string
	social_links: FooterSocialLinks
}): Promise<void> {
	const res = await fetch(`${API_URL}/admin/settings/footer-links`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ contact_url: params.contact_url, social_links: params.social_links }),
	})

	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to update footer settings")
	}
}

export async function getPublicSettings(): Promise<{
	private_mode: boolean
	registration_disabled: boolean
	schedule_timezone: string
	footer_contact_url: string
	footer_social_links: FooterSocialLinks
	kodik_geoblock: string
	kodik_hide_selectors: boolean
	kodik_skip_enabled: boolean
	kodik_skip_value: string
}> {
	const res = await fetch(`${API_URL}/settings/public`, { cache: "no-store" })
	if (!res.ok) {
		throw new Error("Failed to fetch settings")
	}
	const data = await res.json().catch(() => ({}))
	const footerSocial = (data.footer_social_links || {}) as Partial<FooterSocialLinks>
	return {
		private_mode: data.private_mode === true,
		registration_disabled: data.registration_disabled === true,
		schedule_timezone:
			typeof data.schedule_timezone === "string" && data.schedule_timezone.trim()
				? data.schedule_timezone.trim()
				: "Etc/GMT-5",
		footer_contact_url: typeof data.footer_contact_url === "string" ? data.footer_contact_url : "",
		footer_social_links: {
			telegram_url: typeof footerSocial.telegram_url === "string" ? footerSocial.telegram_url : "https://t.me/",
			vk: {
				enabled: !!footerSocial.vk?.enabled,
				url: typeof footerSocial.vk?.url === "string" ? footerSocial.vk?.url : "",
			},
			twitter: {
				enabled: !!footerSocial.twitter?.enabled,
				url: typeof footerSocial.twitter?.url === "string" ? footerSocial.twitter?.url : "",
			},
			instagram: {
				enabled: !!footerSocial.instagram?.enabled,
				url: typeof footerSocial.instagram?.url === "string" ? footerSocial.instagram?.url : "",
			},
			whatsapp: {
				enabled: !!footerSocial.whatsapp?.enabled,
				url: typeof footerSocial.whatsapp?.url === "string" ? footerSocial.whatsapp?.url : "",
			},
		},
		kodik_geoblock: typeof data.kodik_geoblock === "string" ? data.kodik_geoblock : "",
		kodik_hide_selectors: data.kodik_hide_selectors === true,
		kodik_skip_enabled: data.kodik_skip_enabled === true,
		kodik_skip_value: typeof data.kodik_skip_value === "string" ? data.kodik_skip_value : "",
	}
}

export async function adminSetKodikPlayerSettings(params: {
	geoblock: string
	hide_selectors: boolean
	skip_enabled: boolean
	skip_value: string
}): Promise<void> {
	const res = await fetch(`${API_URL}/admin/settings/kodik-player`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify(params),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to update Kodik settings")
	}
}

export async function adminSetScheduleTimezone(params: { timezone: string }): Promise<{ timezone: string; old_timezone?: string; recalculated?: number }> {
	const res = await fetch(`${API_URL}/admin/settings/schedule-timezone`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ timezone: params.timezone }),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to update timezone")
	}
	return data
}

export async function adminPurgeOldSchedules(params: { }): Promise<{ deleted_count: number }> {
	const res = await fetch(`${API_URL}/admin/schedule/purge-old`, {
		method: "POST",
		credentials: "include",
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to purge schedules")
	}
	return {
		deleted_count: typeof data.deleted_count === "number" ? data.deleted_count : 0,
	}
}

export type ScheduleItem = {
	id: number
	release_datetime: string
	episode_number: number
	anime: {
		id: number
		name: string
		url: string
		image: string
	}
}

export type OngoingAnimeItem = {
	id: number
	name: string
	url: string
	image_url: string
}

export async function adminListOngoingAnimes(params: { q?: string }): Promise<OngoingAnimeItem[]> {
	const sp = new URLSearchParams()
	if (params.q?.trim()) sp.set("q", params.q.trim())
	const res = await fetch(`${API_URL}/admin/schedule/animes?${sp.toString()}`, {
		credentials: "include",
		cache: "no-store",
	})
	const data = await res.json().catch(() => ([] as any))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to fetch ongoing anime")
	}
	return data
}

export async function getSchedule(params: { from: string; to: string }): Promise<ScheduleItem[]> {
	const sp = new URLSearchParams({ from: params.from, to: params.to })
	const res = await fetch(`${API_URL}/schedule?${sp.toString()}`, { cache: "no-store" })
	if (!res.ok) {
		throw new Error("Failed to fetch schedule")
	}
	return res.json()
}

export async function adminListSchedule(params: { from: string; to: string }): Promise<ScheduleItem[]> {
	const sp = new URLSearchParams({ from: params.from, to: params.to })
	const res = await fetch(`${API_URL}/admin/schedule?${sp.toString()}`, {
		credentials: "include",
		cache: "no-store",
	})
	if (!res.ok) {
		const data = await res.json().catch(() => ({}))
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to fetch schedule")
	}
	return res.json()
}

export async function adminCreateSchedule(params: {
	anime_id: number
	episode_number: number
	release_date: string
	release_time: string
}): Promise<ScheduleItem> {
	const res = await fetch(`${API_URL}/admin/schedule`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({
			anime_id: params.anime_id,
			episode_number: params.episode_number,
			release_date: params.release_date,
			release_time: params.release_time,
		}),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to create schedule entry")
	}
	return data
}

export async function adminDeleteSchedule(params: { id: number }): Promise<void> {
	const res = await fetch(`${API_URL}/admin/schedule/${params.id}`, {
		method: "DELETE",
		credentials: "include",
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to delete schedule entry")
	}
}

export async function adminUpdateSchedule(params: {
	id: number
	anime_id: number
	episode_number: number
	release_date: string
	release_time: string
}): Promise<ScheduleItem> {
	const res = await fetch(`${API_URL}/admin/schedule/${params.id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({
			anime_id: params.anime_id,
			episode_number: params.episode_number,
			release_date: params.release_date,
			release_time: params.release_time,
		}),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to update schedule entry")
	}
	return data
}

export async function adminCreateUser(params: {
  input: { username: string; email: string; password: string; role: "user" | "moderator" | "admin" }
}): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to create user")
  }
  return data
}

export async function adminTransferRoot(params: {
  target_user_id: number
  password: string
}): Promise<{ message: string; force_logout?: boolean }> {
  const res = await fetch(`${API_URL}/admin/root/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ target_user_id: params.target_user_id, password: params.password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to transfer root")
  }
  return data
}

export async function adminBanUser(params: {
  id: string
  reason: string
}): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/admin/users/${params.id}/ban`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ reason: params.reason }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to ban user")
  }
  return data
}

export async function adminUnbanUser(params: { id: string }): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/admin/users/${params.id}/unban`, {
    method: "PUT",
    credentials: "include",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to unban user")
  }
  return data
}

export async function adminDeleteUser(params: { id: string }): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${params.id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to delete user")
  }
}

export async function getCatalogMeta(): Promise<CatalogMeta> {
  const res = await fetch(`${API_URL}/catalog/meta`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    let message = "Failed to fetch catalog meta"
    try {
      const data = text ? JSON.parse(text) : null
      if (data?.error) message = String(data.error)
    } catch {}
    throw new Error(`${message} (status ${res.status})`)
  }
  return res.json()
}

export async function getAnimes(params?: GetAnimesParams): Promise<Anime[]> {
  const sp = new URLSearchParams()
  if (params?.q) sp.set("q", params.q)
  if (params?.genres?.length) sp.set("genres", params.genres.join(","))
  if (params?.themes?.length) sp.set("themes", params.themes.join(","))
  if (params?.types?.length) sp.set("types", params.types.join(","))
  if (params?.statuses?.length) sp.set("statuses", params.statuses.join(","))
  if (params?.studios?.length) sp.set("studios", params.studios.join(","))
  if (params?.producers?.length) sp.set("producers", params.producers.join(","))
  if (params?.sources?.length) sp.set("sources", params.sources.join(","))
  if (params?.ratings?.length) sp.set("ratings", params.ratings.join(","))
  if (typeof params?.year_from === "number") sp.set("year_from", String(params.year_from))
  if (typeof params?.year_to === "number") sp.set("year_to", String(params.year_to))
  if (typeof params?.min_rating === "number") sp.set("min_rating", String(params.min_rating))
  if (params?.release_unknown) sp.set("release_unknown", "1")
  if (params?.complete_only) sp.set("complete_only", "1")
  if (params?.sort_by) sp.set("sort_by", params.sort_by)
  if (params?.sort_dir) sp.set("sort_dir", params.sort_dir)

  const url = sp.size ? `${API_URL}/animes?${sp.toString()}` : `${API_URL}/animes`
  const res = await fetch(url, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error("Failed to fetch animes")
  }
  return res.json()
}

export async function searchAnimes(params: { q: string }): Promise<AnimeSearchItem[]> {
	const q = params.q.trim()
	if (q.length < 2) return []
	const sp = new URLSearchParams()
	sp.set("q", q)
	const res = await fetch(`${API_URL}/search/animes?${sp.toString()}`, { cache: "no-store" })
	const data = await res.json().catch(() => ([]))
	if (!res.ok) {
		throw new Error((data as any)?.error || "Failed to search")
	}
	return data as AnimeSearchItem[]
}

export async function getPublicFAQ(): Promise<FAQItem[]> {
	const res = await fetch(`${API_URL}/faq`, { cache: "no-store" })
	const data = await res.json().catch(() => ([]))
	if (!res.ok) {
		throw new Error((data as any)?.error || "Failed to fetch faq")
	}
	return data as FAQItem[]
}

export async function getFeaturedAnimes(): Promise<Anime[]> {
  const res = await fetch(`${API_URL}/animes/featured`, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("Failed to fetch featured animes")
  }
  return res.json()
}

// Auth API Functions

export async function verifyEmailToken(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/verify-email?token=${encodeURIComponent(token)}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Verification failed")
  }
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to resend verification")
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to send reset link")
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to reset password")
  }
}

export async function updateAge(params: { age: number }): Promise<void> {
  const res = await fetch(`${API_URL}/me/age`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ age: params.age }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update age")
  }
}

export async function updatePassword(params: { 
  current_password: string; 
  new_password: string 
}): Promise<void> {
  const res = await fetch(`${API_URL}/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ 
      current_password: params.current_password, 
      new_password: params.new_password 
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update password")
  }
}

export async function requestOldEmailCode(params: { email: string }): Promise<void> {
  const res = await fetch(`${API_URL}/me/email/request-old`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email: params.email }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to request code")
  }
}

export async function verifyOldEmailCode(params: { code: string }): Promise<void> {
  const res = await fetch(`${API_URL}/me/email/verify-old`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ code: params.code }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Invalid code")
  }
}

export async function requestNewEmailCode(params: { email: string }): Promise<void> {
  const res = await fetch(`${API_URL}/me/email/request-new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email: params.email }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to request code")
  }
}

export async function verifyNewEmailCode(params: { code: string }): Promise<void> {
  const res = await fetch(`${API_URL}/me/email/verify-new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ code: params.code }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Invalid code")
  }
}

export async function getAnimeByID(id: string): Promise<Anime> {
  const res = await fetch(`${API_URL}/animes/${id}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error("Failed to fetch anime")
  }
  return res.json()
}

export async function getAnimeBySlug(slug: string): Promise<AnimeDetailsResponse> {
  const res = await fetch(`${API_URL}/animes/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to fetch anime")
  }
  const data = await res.json()
	if (data && typeof data === "object" && typeof (data as any).error === "string") {
		throw new Error((data as any).error)
	}
  return (data.anime ? data : { anime: data, episodes: {} }) as AnimeDetailsResponse
}

export async function getAnimeEpisodes(id: string): Promise<Episode[]> {
  const res = await fetch(`${API_URL}/animes/${id}/episodes`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to fetch episodes")
  }
  return res.json()
}

export async function getAnimeEpisodesBySlug(slug: string): Promise<Episode[]> {
  const res = await fetch(`${API_URL}/animes/${encodeURIComponent(slug)}/episodes`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to fetch episodes")
  }
  return res.json()
}

export interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
  age?: number
  role: string
  created_at: string
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_URL}/me`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to fetch user profile")
  }

  return res.json()
}

export type WatchlistStatus = "watching" | "planned" | "completed" | "on_hold" | "dropped"

export type UserListStatus = WatchlistStatus

export interface UserCollectionEntry {
  id: number
  user_id: number
  anime_id: number
  collection_type_id: number
  episodes_watched: number
  score: number
  created_at: string
  updated_at: string
  anime: Anime
  collection_type: {
    id: number
    name: string
  }
}

export async function addToMyCollection(params: {
  animeId: string
  status: WatchlistStatus
}): Promise<void> {
  const res = await fetch(`${API_URL}/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ anime_id: Number(params.animeId), status: params.status }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update collection")
  }
}

export async function removeFromMyCollection(params: {
  animeId: string
}): Promise<void> {
  const res = await fetch(`${API_URL}/collections/${params.animeId}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to remove from collection")
  }
}

export async function getMyCollection(): Promise<UserCollectionEntry[]> {
  const res = await fetch(`${API_URL}/collections`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to fetch collection")
  }

  return res.json()
}

export async function rateAnime(params: {
	animeId: number
	score: number
}): Promise<{ anime_id: number; rating_avg: number; rating_count: number }> {
	const res = await fetch(`${API_URL}/anime/rate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ anime_id: params.animeId, score: params.score }),
	})

	if (!res.ok) {
		const data = await res.json().catch(() => ({}))
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to save rating")
	}

	return res.json()
}

export async function getAnimeRatingStats(animeId: number): Promise<{ rating_avg: number; rating_count: number }> {
	const res = await fetch(`${API_URL}/anime/${animeId}/rating`, { cache: "no-store" })
	if (!res.ok) {
		throw new Error("Failed to fetch rating")
	}
	const data = await res.json().catch(() => ({}))
	return {
		rating_avg: typeof data.rating_avg === "number" ? data.rating_avg : 0,
		rating_count: typeof data.rating_count === "number" ? data.rating_count : 0,
	}
}

export async function getMyAnimeRating(params: { animeId: number }): Promise<number | null> {
	const res = await fetch(`${API_URL}/anime/${params.animeId}/my-rating`, {
		credentials: "include",
		cache: "no-store",
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to fetch your rating")
	}
	return typeof data.score === "number" ? data.score : null
}

export async function getMyAnimeWatchProgress(params: { animeId: number }): Promise<number | null> {
	const res = await fetch(`${API_URL}/animes/${params.animeId}/progress`, {
		credentials: "include",
		cache: "no-store",
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to fetch watch progress")
	}
	return typeof data.episode_number === "number" ? data.episode_number : null
}

export async function setMyAnimeWatchProgress(params: { animeId: number; episodeNumber: number }): Promise<void> {
	const res = await fetch(`${API_URL}/animes/${params.animeId}/progress`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ episode_number: params.episodeNumber }),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error(data.error || "Failed to save watch progress")
	}
}

export interface AdminMeta {
  genres: Genre[]
  themes: Theme[]
  producers: Producer[]
  studios: Studio[]
  statuses: Status[]
  sources: Source[]
  kinds: { id: number; name: string }[]
  ratings: { id: number; name: string }[]
}

export interface AdminUpsertEpisodeInput {
  number: number
  duration?: number
	kind?: string
}

export type AdminCreateEpisodeInitialSource = {
  label_id?: number | null
  label?: string
  type: "iframe" | "direct"
  url: string
	voice_group_id?: number | null
	is_integrated_player?: boolean
  is_default?: boolean
  is_active?: boolean
  sort_order?: number
}

export type AdminCreateEpisodeRequest = {
  episode: AdminUpsertEpisodeInput
  initial_source?: AdminCreateEpisodeInitialSource
}

export async function adminCreateEpisode(params: {
  animeId: string
  input: AdminUpsertEpisodeInput | AdminCreateEpisodeRequest
}): Promise<Episode> {
  const res = await fetch(`${API_URL}/admin/animes/${params.animeId}/episodes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })

  const raw = await res.text().catch(() => "")
  const data = raw ? (() => {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })() : null
  if (!res.ok) {
    if (data && typeof data === "object") maybeForceLogout(data as any)
    throw new Error((data as any)?.error || raw || "Failed to create episode")
  }
  return data as Episode
}

export async function adminKodikImportEpisodes(params: { animeId: string; mode: "add" | "sync" }): Promise<any> {
	const res = await fetch(`${API_URL}/admin/animes/${params.animeId}/kodik/import`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ mode: params.mode }),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error((data as any)?.error || "Failed to import Kodik episodes")
	}
	return data
}

export async function adminUpdateEpisode(params: {
  episodeId: string
  input: AdminUpsertEpisodeInput
}): Promise<Episode> {
  const res = await fetch(`${API_URL}/admin/episodes/${params.episodeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })

  const raw = await res.text().catch(() => "")
  const data = raw ? (() => {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })() : null
  if (!res.ok) {
    if (data && typeof data === "object") maybeForceLogout(data as any)
    throw new Error((data as any)?.error || raw || "Failed to update episode")
  }
  return data as Episode
}

export async function adminDeleteEpisode(params: {
  episodeId: string
}): Promise<void> {
  const res = await fetch(`${API_URL}/admin/episodes/${params.episodeId}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to delete episode")
  }
}

// Video Source API Functions

export interface AdminUpsertVideoSourceInput {
  label_id?: number | null
  label?: string
  type: "iframe" | "direct"
  url: string
	voice_group_id?: number | null
	is_integrated_player?: boolean
  is_default?: boolean
  is_active?: boolean
  sort_order?: number
}

export async function adminListVideoLabels(params: { }): Promise<VideoLabel[]> {
  const res = await fetch(`${API_URL}/admin/video-labels`, {
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch video labels")
  return res.json()
}

export async function adminCreateVideoLabel(params: {
  name: string
  is_external_player: boolean
}): Promise<VideoLabel> {
  const res = await fetch(`${API_URL}/admin/video-labels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name: params.name, is_external_player: params.is_external_player }),
  })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create video label")
  return res.json()
}

export async function adminUpdateVideoLabel(params: {
  id: number
  name: string
  is_external_player: boolean
}): Promise<VideoLabel> {
  const res = await fetch(`${API_URL}/admin/video-labels/${params.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name: params.name, is_external_player: params.is_external_player }),
  })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update video label")
  return res.json()
}

export async function adminDeleteVideoLabel(params: { id: number }): Promise<void> {
  const res = await fetch(`${API_URL}/admin/video-labels/${params.id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error((await res.json()).error || "Failed to delete video label")
}

export async function adminCreateVideoSource(params: {
  episodeId: string
  input: AdminUpsertVideoSourceInput
}): Promise<VideoSource> {
  const res = await fetch(`${API_URL}/admin/episodes/${params.episodeId}/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to create video source")
  }
  return data
}

export async function adminUpdateVideoSource(params: {
  sourceId: string
  input: AdminUpsertVideoSourceInput
}): Promise<VideoSource> {
  const res = await fetch(`${API_URL}/admin/video-sources/${params.sourceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update video source")
  }
  return data
}

export async function adminDeleteVideoSource(params: {
  sourceId: string
}): Promise<void> {
  const res = await fetch(`${API_URL}/admin/video-sources/${params.sourceId}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to delete video source")
  }
}

export async function adminSetDefaultVideoSource(params: {
  sourceId: string
}): Promise<void> {
  const res = await fetch(`${API_URL}/admin/video-sources/${params.sourceId}/default`, {
    method: "PUT",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to set default video source")
  }
}

export async function adminListVoiceGroups(params: { }): Promise<VoiceGroup[]> {
  const res = await fetch(`${API_URL}/admin/voice-groups`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to fetch voice groups")
  }

  return res.json()
}

export async function adminCreateVoiceGroup(params: {
  input: { name: string; type: "dub" | "sub" }
}): Promise<VoiceGroup> {
  const res = await fetch(`${API_URL}/admin/voice-groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to create voice group")
  }
  return data
}

export async function adminUpdateVoiceGroup(params: {
  id: string
  input: { name: string; type: "dub" | "sub" }
}): Promise<VoiceGroup> {
  const res = await fetch(`${API_URL}/admin/voice-groups/${params.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update voice group")
  }
  return data
}

export async function adminDeleteVoiceGroup(params: {
  id: string
}): Promise<void> {
  const res = await fetch(`${API_URL}/admin/voice-groups/${params.id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to delete voice group")
  }
}

export async function getAnimeEpisodesFiltered(params: {
  idOrSlug: string
  group_id?: number
}): Promise<Episode[]> {
  const qs = new URLSearchParams()
  if (params.group_id) qs.set("group_id", String(params.group_id))
  const res = await fetch(`${API_URL}/animes/${encodeURIComponent(params.idOrSlug)}/episodes?${qs.toString()}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to fetch episodes")
  }
  return res.json()
}

export async function adminGetMeta(params: { }): Promise<AdminMeta> {
  const res = await fetch(`${API_URL}/admin/meta`, {
    credentials: "include",
    cache: "no-store",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to fetch admin metadata")
  }

  return res.json()
}

export interface AdminCreateAnimeInput {
  url: string
  kind?: string
  duration?: number
  rating?: string
  episodes_aired?: number
  aired_on?: string
  released_on?: string
  trailer_url?: string
  score?: number
  episodes?: number
  poster_url?: string
	background_url?: string
  studio_id?: number | null
  producer_id?: number | null
	producer_ids?: number[]
  status_id?: number | null
  source_id?: number | null
	shikimori_id?: number | null
	mal_id?: number | null
	worldart_id?: number | null
	shiki_english?: string[]
	shiki_japanese?: string[]
	shiki_synonyms?: string[]
	shiki_fansubbers?: string[]
	shiki_fandubbers?: string[]
  genre_ids: number[]
  theme_ids: number[]
  title_ru: string
  title_en_romaji: string
  description_ru?: string
  description_en?: string
	alt_titles?: string[]
	gallery_urls?: string[]
}

export type ShikimoriAnimeSearchItem = {
	id: number
	mal_id?: number | null
	name: string
	russian: string
	kind: string
	status: string
	episodes: number
	episodes_aired: number
	score: string
	aired_on?: string | null
	released_on?: string | null
}

export async function adminShikimoriSearch(params: { q: string }): Promise<{ items: ShikimoriAnimeSearchItem[] }> {
	const res = await fetch(`${API_URL}/admin/shikimori/search?q=${encodeURIComponent(params.q)}`, {
		credentials: "include",
		cache: "no-store",
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error((data as any)?.error || "Failed to search Shikimori")
	}
	return data as any
}

export async function adminShikimoriGetAnime(params: { id: number }): Promise<any> {
	const res = await fetch(`${API_URL}/admin/shikimori/animes/${params.id}`, {
		credentials: "include",
		cache: "no-store",
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		throw new Error((data as any)?.error || "Failed to fetch Shikimori anime")
	}
	return data
}

export async function adminJikanGetAnime(params: { id: number }): Promise<any> {
	const res = await fetch(`${API_URL}/admin/jikan/animes/${params.id}`, {
		credentials: "include",
		cache: "no-store",
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		maybeForceLogout(data)
		const p: any = data
		let msg = String(p?.error || "Failed to fetch MyAnimeList")
		if (typeof p?.status === "number") msg = `${msg} (status ${p.status})`
		throw new Error(msg)
	}
	return data
}


export async function adminCreateAnime(params: {
  input: AdminCreateAnimeInput
}): Promise<Anime> {
  const res = await fetch(`${API_URL}/admin/animes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    const d: any = data
    const msg = d?.details ? `${d?.error || "Failed to create anime"} (${d.details})` : d?.error || "Failed to create anime"
    const err: any = new Error(msg)
    err.payload = data
    throw err
  }

  return data
}

export async function adminUpdateAnime(params: {
  id: string
  input: Omit<AdminCreateAnimeInput, "url">
}): Promise<Anime> {
  const res = await fetch(`${API_URL}/admin/animes/${params.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to update anime")
  }

  return data
}

export async function adminDeleteAnime(params: {
  id: string
}): Promise<void> {
  const res = await fetch(`${API_URL}/admin/animes/${params.id}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to delete anime")
  }
}

export async function adminListFAQ(params: { }): Promise<FAQItem[]> {
  const res = await fetch(`${API_URL}/admin/faq`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await res.json().catch(() => ([]))
  if (!res.ok) {
    maybeForceLogout(data as any)
    throw new Error((data as any)?.error || "Failed to fetch faq")
  }
  return data as FAQItem[]
}

export async function adminCreateFAQ(params: {
  input: Pick<FAQItem, "question" | "answer" | "question_ru" | "answer_ru" | "is_published" | "priority">
}): Promise<FAQItem> {
  const res = await fetch(`${API_URL}/admin/faq`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data as any)
    throw new Error((data as any)?.error || "Failed to create faq")
  }
  return data as FAQItem
}

export async function adminUpdateFAQ(params: {
  id: number
  input: Pick<FAQItem, "question" | "answer" | "question_ru" | "answer_ru" | "is_published" | "priority">
}): Promise<FAQItem> {
  const res = await fetch(`${API_URL}/admin/faq/${params.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params.input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data as any)
    throw new Error((data as any)?.error || "Failed to update faq")
  }
  return data as FAQItem
}

export async function adminDeleteFAQ(params: { id: number }): Promise<void> {
  const res = await fetch(`${API_URL}/admin/faq/${params.id}`, {
    method: "DELETE",
    credentials: "include",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data as any)
    throw new Error((data as any)?.error || "Failed to delete faq")
  }
}

export async function adminListFeaturedAnimes(params: { }): Promise<Anime[]> {
  const res = await fetch(`${API_URL}/admin/animes/featured`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await res.json().catch(() => ([]))
  if (!res.ok) {
    maybeForceLogout(data as any)
    throw new Error((data as any)?.error || "Failed to fetch featured animes")
  }
  return data as Anime[]
}

export async function adminSetAnimeFeatured(params: {
  id: string
  featured: boolean
}): Promise<Anime> {
  const res = await fetch(`${API_URL}/admin/animes/${params.id}/featured`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ featured: params.featured }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data as any)
    throw new Error((data as any)?.error || "Failed to update featured status")
  }
  return data as Anime
}

export function getLocalizedTitle(anime: Anime, locale: string): string {
  if (!anime.translations) return anime.name
  const primary = anime.translations.find((t) => t.language.code === locale)
  if (primary?.title?.trim()) return primary.title
  const fallbackCode = locale === "ru" ? "en" : "ru"
  const fallback = anime.translations.find((t) => t.language.code === fallbackCode)
  if (fallback?.title?.trim()) return fallback.title
  return anime.name
}

export function getLocalizedDescription(anime: Anime, locale: string): string {
  if (!anime.translations) return ""
  const primary = anime.translations.find((t) => t.language.code === locale)
  if (primary?.description?.trim()) return primary.description
  const fallbackCode = locale === "ru" ? "en" : "ru"
  const fallback = anime.translations.find((t) => t.language.code === fallbackCode)
  return fallback?.description || ""
}

export function getLocalizedEpisodeName(episode: Episode | EpisodeItem, locale: string): string {
  return `Episode ${episode.number}`
}

export function getLocalizedEpisodeDescription(episode: Episode | EpisodeItem, locale: string): string {
  return ""
}

export function getAnimePosterUrl(anime: Anime): string {
  return anime.image_url || anime.image || ""
}

export function getAnimeBackgroundUrl(anime: Anime): string {
	return (anime.background_url || "").trim() || getAnimePosterUrl(anime)
}

// Generic Metadata Admin Functions

async function adminListMetaItem<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/admin/${path}`, {
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error((data as any).error || `Failed to fetch ${path}`)
  }
  return res.json()
}

type AdminMetaPayload = {
  name: string
  ru_name?: string | null
}

async function adminCreateMetaItem<T>(path: string, payload: AdminMetaPayload): Promise<T> {
  const res = await fetch(`${API_URL}/admin/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || `Failed to create ${path}`)
  }
  return data
}

async function adminUpdateMetaItem<T>(path: string, id: number, payload: AdminMetaPayload): Promise<T> {
  const res = await fetch(`${API_URL}/admin/${path}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || `Failed to update ${path}`)
  }
  return data
}

async function adminDeleteMetaItem(path: string, id: number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/${path}/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    maybeForceLogout(data)
    throw new Error(data.error || `Failed to delete ${path}`)
  }
}

// Kinds
export const adminListKinds = (p: { }) => adminListMetaItem<KindOption>("kinds")
export const adminCreateKind = (p: { name: string; ru_name?: string | null }) =>
  adminCreateMetaItem<KindOption>("kinds", { name: p.name, ru_name: p.ru_name ?? null })
export const adminUpdateKind = (p: { id: number; name: string; ru_name?: string | null }) =>
  adminUpdateMetaItem<KindOption>("kinds", p.id, { name: p.name, ru_name: p.ru_name ?? null })
export const adminDeleteKind = (p: { id: number }) => adminDeleteMetaItem("kinds", p.id)

// Ratings
export const adminListRatings = (p: { }) => adminListMetaItem<RatingOption>("ratings")
export const adminCreateRating = (p: { name: string }) => adminCreateMetaItem<RatingOption>("ratings", { name: p.name })
export const adminUpdateRating = (p: { id: number; name: string }) =>
  adminUpdateMetaItem<RatingOption>("ratings", p.id, { name: p.name })
export const adminDeleteRating = (p: { id: number }) => adminDeleteMetaItem("ratings", p.id)

// Statuses
export const adminListStatuses = (p: { }) => adminListMetaItem<Status>("statuses")
export const adminCreateStatus = (p: { name: string; ru_name?: string | null }) =>
  adminCreateMetaItem<Status>("statuses", { name: p.name, ru_name: p.ru_name ?? null })
export const adminUpdateStatus = (p: { id: number; name: string; ru_name?: string | null }) =>
  adminUpdateMetaItem<Status>("statuses", p.id, { name: p.name, ru_name: p.ru_name ?? null })
export const adminDeleteStatus = (p: { id: number }) => adminDeleteMetaItem("statuses", p.id)

// Studios
export const adminListStudios = (p: { }) => adminListMetaItem<Studio>("studios")
export const adminCreateStudio = (p: { name: string; ru_name?: string | null }) =>
  adminCreateMetaItem<Studio>("studios", { name: p.name, ru_name: p.ru_name ?? null })
export const adminUpdateStudio = (p: { id: number; name: string; ru_name?: string | null }) =>
  adminUpdateMetaItem<Studio>("studios", p.id, { name: p.name, ru_name: p.ru_name ?? null })
export const adminDeleteStudio = (p: { id: number }) => adminDeleteMetaItem("studios", p.id)

// Sources
export const adminListSources = (p: { }) => adminListMetaItem<Source>("sources")
export const adminCreateSource = (p: { name: string; ru_name?: string | null }) =>
  adminCreateMetaItem<Source>("sources", { name: p.name, ru_name: p.ru_name ?? null })
export const adminUpdateSource = (p: { id: number; name: string; ru_name?: string | null }) =>
  adminUpdateMetaItem<Source>("sources", p.id, { name: p.name, ru_name: p.ru_name ?? null })
export const adminDeleteSource = (p: { id: number }) => adminDeleteMetaItem("sources", p.id)

// Genres
export const adminListGenres = (p: { }) => adminListMetaItem<Genre>("genres")
export const adminCreateGenre = (p: { name: string; ru_name?: string | null }) =>
  adminCreateMetaItem<Genre>("genres", { name: p.name, ru_name: p.ru_name ?? null })
export const adminUpdateGenre = (p: { id: number; name: string; ru_name?: string | null }) =>
  adminUpdateMetaItem<Genre>("genres", p.id, { name: p.name, ru_name: p.ru_name ?? null })
export const adminDeleteGenre = (p: { id: number }) => adminDeleteMetaItem("genres", p.id)

export const adminListThemes = (p: { }) => adminListMetaItem<Theme>("themes")
export const adminCreateTheme = (p: { name: string; ru_name?: string | null }) =>
  adminCreateMetaItem<Theme>("themes", { name: p.name, ru_name: p.ru_name ?? null })
export const adminUpdateTheme = (p: { id: number; name: string; ru_name?: string | null }) =>
  adminUpdateMetaItem<Theme>("themes", p.id, { name: p.name, ru_name: p.ru_name ?? null })
export const adminDeleteTheme = (p: { id: number }) => adminDeleteMetaItem("themes", p.id)

export const adminListProducers = (p: { }) => adminListMetaItem<Producer>("producers")
export const adminCreateProducer = (p: { name: string }) =>
  adminCreateMetaItem<Producer>("producers", { name: p.name })
export const adminUpdateProducer = (p: { id: number; name: string }) =>
  adminUpdateMetaItem<Producer>("producers", p.id, { name: p.name })
export const adminDeleteProducer = (p: { id: number }) => adminDeleteMetaItem("producers", p.id)

export async function adminSetAnimeGenres(params: {
  animeId: string
  genre_ids: number[]
}): Promise<Genre[]> {
  const res = await fetch(`${API_URL}/admin/animes/${params.animeId}/genres`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ genre_ids: params.genre_ids }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to set genres")
  }
  return data
}

export async function adminSetAnimeThemes(params: {
  animeId: string
  theme_ids: number[]
}): Promise<Theme[]> {
  const res = await fetch(`${API_URL}/admin/animes/${params.animeId}/themes`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ theme_ids: params.theme_ids }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    maybeForceLogout(data)
    throw new Error(data.error || "Failed to set themes")
  }
  return data.themes
}

export async function createWatchPartyRoom(input: WatchPartyCreateRoomInput): Promise<WatchPartyCreateRoomResponse> {
	const res = await fetch(`${API_URL}/watch-party/rooms`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			is_public: input.is_public,
			password: input.password || "",
			content: input.content,
		}),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		const d: any = data
		const msg = d?.details ? `${d?.error || "Failed to create room"} (${d.details})` : d?.error || "Failed to create room"
		throw new Error(msg)
	}
	return data as WatchPartyCreateRoomResponse
}

export async function resolveWatchPartyInvite(inviteCode: string): Promise<{ room_id: number; requires_password: boolean }> {
	const res = await fetch(`${API_URL}/watch-party/invites/${encodeURIComponent(inviteCode)}`, { cache: "no-store" })
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		throw new Error((data as any)?.error || "Room not available")
	}
	return data as { room_id: number; requires_password: boolean }
}

export async function getWatchPartyRoom(roomId: number | string): Promise<WatchPartyGetRoomResponse> {
	const res = await fetch(`${API_URL}/watch-party/rooms/${roomId}`, { cache: "no-store" })
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		throw new Error((data as any)?.error || "Failed to load room")
	}
	return data as WatchPartyGetRoomResponse
}

export async function joinWatchPartyRoom(roomId: number | string, password: string): Promise<{ status: "ok"; role: WatchPartyRole }> {
	const res = await fetch(`${API_URL}/watch-party/rooms/${roomId}/join`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ password }),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		throw new Error((data as any)?.error || "Failed to join room")
	}
	return data as { status: "ok"; role: WatchPartyRole }
}

export async function dissolveWatchPartyRoom(roomId: number | string): Promise<{ status: "ok" }> {
	const res = await fetch(`${API_URL}/watch-party/rooms/${roomId}/dissolve`, { method: "POST" })
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		throw new Error((data as any)?.error || "Failed to dissolve")
	}
	return data as { status: "ok" }
}

export async function setWatchPartyMemberRole(
	roomId: number | string,
	userId: number,
	role: "moderator" | "viewer"
): Promise<{ status: "ok" }> {
	const res = await fetch(`${API_URL}/watch-party/rooms/${roomId}/members/${userId}/role`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ role }),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		throw new Error((data as any)?.error || "Failed to update role")
	}
	return data as { status: "ok" }
}

export function getWatchPartyWsUrl(roomId: number | string): string {
	const override = (process.env.NEXT_PUBLIC_WATCH_PARTY_WS_URL || "").trim()
	if (override) {
		return `${override.replace(/\/$/, "")}/api/watch-party/rooms/${roomId}/ws`
	}
	if (typeof window === "undefined") return ""
	const proto = window.location.protocol === "https:" ? "wss" : "ws"
	return `${proto}://${window.location.host}/api/watch-party/rooms/${roomId}/ws`
}
