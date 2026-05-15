"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Crown, KeyRound, Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { adminGetUser, adminResetUserPasswordDefault, adminTransferRoot, adminUpdateUser, type AdminUser } from "@/lib/api"
import { cn } from "@/lib/utils"
import { canManageUser, roleLabel } from "@/lib/roles"

type StatusChoice = "active" | "not_verified" | "banned"

export default function AdminUserEditPage() {
  const { user: me } = useAuth()
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [status, setStatus] = useState<StatusChoice>("active")
  const [role, setRole] = useState<"user" | "moderator" | "admin">("user")
  const [isBusy, setIsBusy] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [transferOpen, setTransferOpen] = useState(false)
  const [transferPassword, setTransferPassword] = useState("")
  const [transferError, setTransferError] = useState<string | null>(null)

  const userId = useMemo(() => String(params?.id || ""), [params])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!userId) return
      setPageError(null)
      setNotice(null)
      try {
        const u = await adminGetUser({ id: userId })
        if (cancelled) return
        setUser(u)
        setRole(u.role === "admin" ? "admin" : u.role === "moderator" ? "moderator" : "user")
        if (u.is_banned) setStatus("banned")
        else setStatus(u.is_verified ? "active" : "not_verified")
      } catch (e: any) {
        if (cancelled) return
        setPageError(e?.message || "Failed to load user")
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [userId])

  const canEditTarget = !!user && canManageUser(me?.role || "user", me?.id ?? null, user.role, user.id)
  const canEditStatus = !!user && !user.is_banned && user.role !== "root" && canEditTarget

  const allowedRoles = useMemo(() => {
    if (me?.role === "root") return ["user", "moderator", "admin"] as const
    if (me?.role === "admin") return ["user", "moderator"] as const
    return ["user"] as const
  }, [me?.role])

  const canTransferRoot = me?.role === "root" && user?.role === "admin"

  const onSave = async () => {
    if (!user) return
    setStatusError(null)
    setRoleError(null)
    setPageError(null)
    setNotice(null)

    if (!canEditTarget || user.role === "root") {
      setPageError("This user is protected")
      return
    }

    const nextVerified = status === "active"
    if (status === "banned") {
      setStatusError("Banned status is managed via Ban/Unban.")
      return
    }

    setIsBusy(true)
    try {
      const updated = await adminUpdateUser({
        id: String(user.id),
        input: { is_verified: nextVerified, role },
      })
      setUser(updated)
      setNotice("Saved")
    } catch (e: any) {
      const msg = e?.message || "Failed to save"
      if (msg.toLowerCase().includes("role")) setRoleError(msg)
      else if (msg.toLowerCase().includes("banned")) setStatusError(msg)
      else setPageError(msg)
    } finally {
      setIsBusy(false)
    }
  }

  const onResetPassword = async () => {
    if (!user) return
    setPageError(null)
    setNotice(null)

    if (!canEditTarget || user.role === "root") {
      setPageError("This user is protected")
      return
    }

    const ok = window.confirm("Reset this user's password to the current system default?")
    if (!ok) return

    setIsBusy(true)
    try {
      await adminResetUserPasswordDefault({ id: String(user.id) })
      setNotice("Password reset to default")
    } catch (e: any) {
      setPageError(e?.message || "Failed to reset password")
    } finally {
      setIsBusy(false)
    }
  }

  const onTransferRoot = async () => {
    if (!user) return
    setTransferError(null)

    if (!canTransferRoot) {
      setTransferError("Target must be an admin")
      return
    }
    if (!transferPassword.trim()) {
      setTransferError("Password is required")
      return
    }

    setIsBusy(true)
    try {
      await adminTransferRoot({ target_user_id: user.id, password: transferPassword })
      window.dispatchEvent(new CustomEvent("auth:force-logout", { detail: { error_code: "REVOKED" } }))
    } catch (e: any) {
      setTransferError(e?.message || "Failed to transfer root")
    } finally {
      setIsBusy(false)
    }
  }

  if (!userId) {
    return <div className="text-sm text-foreground-muted">Invalid user id.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-tertiary/40"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <div>
            <div className="text-lg font-semibold text-foreground">Edit User</div>
            <div className="text-xs text-foreground-muted">ID: {userId}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={!user || isBusy || !canEditTarget || user.role === "root"}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
            (!user || isBusy || !canEditTarget || user.role === "root") && "opacity-60 cursor-not-allowed"
          )}
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {pageError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {pageError}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      {user?.role === "root" ? (
        <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-200">
          Root account is protected and cannot be edited, banned, or deleted.
        </div>
      ) : !canEditTarget && user ? (
        <div className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground-muted">
          This user is protected ({roleLabel(user.role)} role). You cannot manage them.
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
        {!user ? (
          <div className="text-sm text-foreground-muted">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground-muted">Username</div>
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground">
                {user.username}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground-muted">Email</div>
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground">
                {user.email}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Role</label>
              <select
                value={role}
                disabled={isBusy || !canEditTarget || user.role === "root"}
                onChange={(e) => setRole(e.target.value as any)}
                className={cn(
                  "w-full h-11 rounded-xl border bg-background px-4 text-sm text-foreground",
                  roleError ? "border-red-500/50" : "border-border/60"
                )}
              >
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
              {roleError ? <div className="text-xs text-red-300">{roleError}</div> : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Status</label>
              <select
                value={status}
                disabled={!canEditStatus || isBusy}
                onChange={(e) => setStatus(e.target.value as StatusChoice)}
                className={cn(
                  "w-full h-11 rounded-xl border bg-background px-4 text-sm text-foreground",
                  statusError ? "border-red-500/50" : "border-border/60",
                  (!canEditStatus || isBusy) && "opacity-80"
                )}
              >
                {user.is_banned ? <option value="banned">Banned (managed separately)</option> : null}
                <option value="active">Active</option>
                <option value="not_verified">Not Verified</option>
              </select>
              {user.is_banned ? (
                <div className="text-xs text-foreground-muted">Ban/Unban is managed from the Users list.</div>
              ) : null}
              {statusError ? <div className="text-xs text-red-300">{statusError}</div> : null}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">Reset Password</div>
            <div className="text-xs text-foreground-muted">Resets to the current system default password.</div>
          </div>
          <button
            type="button"
            onClick={onResetPassword}
            disabled={!user || isBusy}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background-tertiary/40",
              (!user || isBusy) && "opacity-60 cursor-not-allowed"
            )}
          >
            <KeyRound className="w-4 h-4" />
            Reset to Default
          </button>
        </div>
        <div className="mt-3 text-xs text-foreground-subtle">
          Manage the default password in <Link className="text-primary hover:underline" href="/admin/settings">Admin Settings</Link>.
        </div>
      </div>

      {canTransferRoot ? (
        <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-200">
            <Crown className="w-4 h-4" />
            Secure Root Transfer
          </div>
          <div className="mt-1 text-xs text-fuchsia-200/80">Transfer Root to this Admin. Requires your password confirmation.</div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setTransferPassword("")
              setTransferError(null)
              setTransferOpen(true)
            }}
            className={cn(
              "mt-4 inline-flex items-center justify-center rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-500/90",
              isBusy && "opacity-60 cursor-not-allowed"
            )}
          >
            Transfer Root
          </button>
        </div>
      ) : null}

      {transferOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background-secondary/90 backdrop-blur-sm p-6 card-shadow">
            <div className="text-lg font-bold text-foreground">Confirm Root Transfer</div>
            <div className="text-sm text-foreground-muted mt-1">Enter your password to transfer Root.</div>

            <div className="mt-5 space-y-2">
              <label className="text-xs font-semibold text-foreground-muted">Your password</label>
              <input
                type="password"
                value={transferPassword}
                onChange={(e) => setTransferPassword(e.target.value)}
                className="w-full h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
              />
              {transferError ? <div className="text-xs text-red-400">{transferError}</div> : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                disabled={isBusy}
                onClick={() => setTransferOpen(false)}
                className="rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={isBusy || !transferPassword.trim()}
                onClick={onTransferRoot}
                className="rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500/90 disabled:opacity-60"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
