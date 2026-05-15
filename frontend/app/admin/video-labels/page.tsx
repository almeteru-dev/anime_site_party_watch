"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  adminCreateVideoLabel,
  adminDeleteVideoLabel,
  adminListVideoLabels,
  adminUpdateVideoLabel,
  type VideoLabel,
} from "@/lib/api"

export default function AdminVideoLabelsPage() {
  const [labels, setLabels] = useState<VideoLabel[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [newName, setNewName] = useState("")
  const [newExternal, setNewExternal] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingExternal, setEditingExternal] = useState(false)

  const sorted = useMemo(() => {
    return (labels || []).slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [labels])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListVideoLabels({})
        if (!mounted) return
        setLabels(data)
      } catch (e: any) {
        if (!mounted) return
        setError(e.message || "Failed to load")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const startEdit = (l: VideoLabel) => {
    setEditingId(l.id)
    setEditingName(l.name)
    setEditingExternal(!!l.is_external_player)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
    setEditingExternal(false)
  }

  const create = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      const created = await adminCreateVideoLabel({ name, is_external_player: newExternal })
      setLabels((prev) => ([...(prev || []), created]))
      setNewName("")
      setNewExternal(false)
    } catch (e: any) {
      setError(e.message || "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    if (!editingId) return
    const name = editingName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      const updated = await adminUpdateVideoLabel({ id: editingId, name, is_external_player: editingExternal })
      setLabels((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)) : prev))
      cancelEdit()
    } catch (e: any) {
      setError(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    setSaving(true)
    setError(null)
    try {
      await adminDeleteVideoLabel({ id })
      setLabels((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      if (editingId === id) cancelEdit()
    } catch (e: any) {
      setError(e.message || "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Labels</h1>
          <p className="text-sm text-foreground-muted">Manage global labels and the External Player flag.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
        <div className="text-sm font-semibold text-foreground mb-4">Create Label</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Label name (e.g., Kodik)"
            className="h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none focus:border-primary/50"
          />
          <label className="h-11 rounded-xl border border-border/60 bg-background px-4 flex items-center justify-between gap-3 text-sm text-foreground">
            <span className="text-foreground-muted">External player</span>
            <input
              type="checkbox"
              checked={newExternal}
              onChange={(e) => setNewExternal(e.target.checked)}
              className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20"
            />
          </label>
          <button
            type="button"
            onClick={create}
            disabled={!newName.trim() || saving}
            className={cn(
              "h-11 rounded-xl px-4 text-sm font-semibold",
              !newName.trim() || saving
                ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">All Labels</div>
          <div className="text-xs text-foreground-muted">{sorted.length} total</div>
        </div>

        {labels === null ? (
          <div className="px-5 py-8 text-sm text-foreground-muted">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="px-5 py-8 text-sm text-foreground-muted">No labels yet.</div>
        ) : (
          <div className="divide-y divide-border/40">
            {sorted.map((l) => {
              const isEditing = editingId === l.id
              return (
                <div key={l.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-foreground truncate">{l.name}</div>
                    )}
                    <div className="mt-1 text-xs text-foreground-muted">
                      {isEditing ? "" : l.is_external_player ? "External player" : "Standard player"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className={cn(
                      "flex items-center justify-between gap-3 h-10 rounded-xl border px-3 text-sm",
                      isEditing ? "border-primary/30 bg-primary/5" : "border-border/60 bg-background"
                    )}>
                      <span className="text-foreground-muted">External</span>
                      <input
                        type="checkbox"
                        checked={isEditing ? editingExternal : !!l.is_external_player}
                        onChange={(e) => {
                          if (!isEditing) return
                          setEditingExternal(e.target.checked)
                        }}
                        disabled={!isEditing}
                        className="w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/20 disabled:opacity-50"
                      />
                    </label>

                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="h-10 rounded-xl px-4 text-sm font-semibold text-foreground-muted hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={save}
                          disabled={!editingName.trim() || saving}
                          className={cn(
                            "h-10 rounded-xl px-4 text-sm font-semibold",
                            !editingName.trim() || saving
                              ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(l)}
                          className="h-10 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground hover:bg-background-tertiary/40"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          disabled={saving}
                          className="h-10 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

