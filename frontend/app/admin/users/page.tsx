"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PlusCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  adminBanUser,
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminUnbanUser,
  type AdminUser,
} from "@/lib/api"
import { BanUserModal } from "@/components/admin/users/BanUserModal"
import { CreateUserModal, type CreateUserForm } from "@/components/admin/users/CreateUserModal"
import { UsersTable } from "@/components/admin/users/UsersTable"
import { UsersToolbar, type RoleFilter, type StatusFilter } from "@/components/admin/users/UsersToolbar"

export default function AdminUsersPage() {
  const { user: me } = useAuth()

  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [total, setTotal] = useState<number>(0)
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<RoleFilter>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [banOpen, setBanOpen] = useState(false)
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)

  const [createForm, setCreateForm] = useState<CreateUserForm>({ username: "", email: "", password: "", role: "user" })

  const [banReason, setBanReason] = useState("")

  const fetchSeq = useRef(0)
  const queryDebounce = useRef<number | null>(null)
  const effectiveQuery = useMemo(() => query.trim(), [query])

  const load = useCallback(
    async (next: { q: string; role: RoleFilter; status: StatusFilter }) => {
      const seq = ++fetchSeq.current
      setError(null)
      try {
        const res = await adminListUsers({
          q: next.q,
          role: next.role,
          status: next.status,
          page: 1,
          limit: 200,
        })
        if (seq !== fetchSeq.current) return
        setUsers(res.users)
        setTotal(res.total)
      } catch (e: any) {
        if (seq !== fetchSeq.current) return
        setError(e?.message || "Failed to load users")
        setUsers([])
        setTotal(0)
      }
    },
    []
  )

  useEffect(() => {
    if (queryDebounce.current) window.clearTimeout(queryDebounce.current)
    queryDebounce.current = window.setTimeout(() => {
      load({ q: effectiveQuery, role, status })
    }, 250)
    return () => {
      if (queryDebounce.current) window.clearTimeout(queryDebounce.current)
    }
  }, [effectiveQuery, role, status, load])

  const resetFilters = () => {
    setQuery("")
    setRole("all")
    setStatus("all")
  }

  const handleCreate = async () => {
    setCreateError(null)
    const pw = createForm.password
    if (pw.length < 10) {
      setCreateError("Password must be at least 10 characters long")
      return
    }
    if (!/[A-Z]/.test(pw)) {
      setCreateError("Password must contain at least one uppercase letter")
      return
    }
    if (!/[0-9]/.test(pw)) {
      setCreateError("Password must contain at least one digit")
      return
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) {
      setCreateError("Password must contain at least one special character")
      return
    }
    setIsBusy(true)
    setError(null)
    try {
      await adminCreateUser({ input: createForm })
      setCreateForm({ username: "", email: "", password: "", role: "user" })
      setCreateOpen(false)
      await load({ q: effectiveQuery, role, status })
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create user")
    } finally {
      setIsBusy(false)
    }
  }

  const openBan = (u: AdminUser) => {
    setBanTarget(u)
    setBanReason("")
    setBanOpen(true)
  }

  const handleBan = async () => {
    if (!banTarget) return
    const reason = banReason.trim()
    if (!reason) {
      setError("Ban reason is required")
      return
    }
    setIsBusy(true)
    setError(null)
    try {
      await adminBanUser({ id: String(banTarget.id), reason })
      setBanOpen(false)
      setBanTarget(null)
      await load({ q: effectiveQuery, role, status })
    } catch (e: any) {
      setError(e?.message || "Failed to ban user")
    } finally {
      setIsBusy(false)
    }
  }

  const handleUnban = async (u: AdminUser) => {
    setIsBusy(true)
    setError(null)
    try {
      await adminUnbanUser({ id: String(u.id) })
      await load({ q: effectiveQuery, role, status })
    } catch (e: any) {
      setError(e?.message || "Failed to unban user")
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async (u: AdminUser) => {
    const ok = window.confirm(`Delete user ${u.email}? This cannot be undone.`)
    if (!ok) return
    setIsBusy(true)
    setError(null)
    try {
      await adminDeleteUser({ id: String(u.id) })
      await load({ q: effectiveQuery, role, status })
    } catch (e: any) {
      setError(e?.message || "Failed to delete user")
    } finally {
      setIsBusy(false)
    }
  }

  const rows = users ?? []

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-foreground-muted">Search, filter, ban, and delete accounts</p>
        </div>

        <button
          onClick={() => {
            setError(null)
            setCreateError(null)
            setCreateForm({ username: "", email: "", password: "", role: "user" })
            setCreateOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="w-4 h-4" />
          Create User
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-background-secondary/40">
        <UsersToolbar
          query={query}
          onQueryChange={setQuery}
          role={role}
          onRoleChange={setRole}
          status={status}
          onStatusChange={setStatus}
          onReset={resetFilters}
          totalText={users === null ? "Loading…" : `${total} users`}
          meText={me?.email ? `Signed in as ${me.email}` : ""}
        />

        {error && <div className="px-4 py-3 text-sm text-red-400 border-b border-red-500/30 bg-red-500/10">{error}</div>}

        {users === null ? (
          <div className="p-6 text-sm text-foreground-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-foreground-muted">No users found.</div>
        ) : (
          <UsersTable
            users={rows}
            isBusy={isBusy}
            currentRole={me?.role || "user"}
            currentUserId={me?.id ?? null}
            onBan={openBan}
            onUnban={handleUnban}
            onDelete={handleDelete}
          />
        )}
      </div>

      <CreateUserModal
        open={createOpen}
        isBusy={isBusy}
        form={createForm}
        error={createError}
        onChange={setCreateForm}
        onClose={() => {
          if (isBusy) return
          setCreateOpen(false)
          setCreateError(null)
        }}
        onSubmit={handleCreate}
          currentRole={me?.role || "user"}
      />

      <BanUserModal
        open={banOpen}
        isBusy={isBusy}
        target={banTarget}
        reason={banReason}
        onReasonChange={setBanReason}
        onClose={() => {
          if (isBusy) return
          setBanOpen(false)
          setBanTarget(null)
        }}
        onSubmit={handleBan}
      />
    </div>
  )
}
