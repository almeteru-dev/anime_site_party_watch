import type { WatchlistStatus } from "@/lib/api"

export type CollectionStatus = WatchlistStatus

type CollectionMap = Record<string, CollectionStatus>

const KEY_PREFIX = "lycorislib:collection:v1:"
const EVENT_NAME = "lycorislib:collection"

function key(userId: number) {
  return `${KEY_PREFIX}${userId}`
}

export function getCollectionMap(userId: number): CollectionMap {
  if (typeof window === "undefined") return {}
  const raw = window.localStorage.getItem(key(userId))
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") return parsed as CollectionMap
    return {}
  } catch {
    return {}
  }
}

export function setCollectionStatus(userId: number, animeId: string, status: CollectionStatus) {
  if (typeof window === "undefined") return
  const m = getCollectionMap(userId)
  m[String(animeId)] = status
  window.localStorage.setItem(key(userId), JSON.stringify(m))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { userId } }))
}

export function removeCollectionStatus(userId: number, animeId: string) {
  if (typeof window === "undefined") return
  const m = getCollectionMap(userId)
  delete m[String(animeId)]
  window.localStorage.setItem(key(userId), JSON.stringify(m))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { userId } }))
}

export function subscribeCollection(userId: number, cb: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = (e: Event) => {
    const ce = e as CustomEvent
    if (!ce?.detail || ce.detail.userId !== userId) return
    cb()
  }
  window.addEventListener(EVENT_NAME, handler as EventListener)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT_NAME, handler as EventListener)
    window.removeEventListener("storage", cb)
  }
}
