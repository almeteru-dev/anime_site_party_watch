"use client"

import Link from "next/link"
import { Ban, Pencil, ShieldCheck, Trash2 } from "lucide-react"
import type { AdminUser } from "@/lib/api"
import { RoleBadge, StatusBadge } from "@/components/admin/users/UserBadges"
import { canManageUser } from "@/lib/roles"

export function UsersTable(props: {
  users: AdminUser[]
  isBusy: boolean
  currentRole: string
  currentUserId: number | null
  onBan: (u: AdminUser) => void
  onUnban: (u: AdminUser) => void
  onDelete: (u: AdminUser) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-foreground-subtle">
          <tr className="border-b border-border/50">
            <th className="text-left font-semibold px-4 py-3">User</th>
            <th className="text-left font-semibold px-4 py-3">Role</th>
            <th className="text-left font-semibold px-4 py-3">Status</th>
            <th className="text-left font-semibold px-4 py-3">Ban reason</th>
            <th className="text-right font-semibold px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {props.users.map((u) => (
            (() => {
              const allowed = canManageUser(props.currentRole, props.currentUserId, u.role, u.id)
              return (
            <tr key={u.id} className="border-b border-border/40 hover:bg-background-tertiary/30">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{u.username}</div>
                <div className="text-xs text-foreground-muted">{u.email}</div>
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={u.role} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge user={u} />
              </td>
              <td className="px-4 py-3 text-foreground-muted">{u.is_banned ? u.ban_reason || "" : ""}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {allowed ? (
                    <>
                      <Link
                        href={`/admin/users/${u.id}/edit`}
                        aria-label={`Edit ${u.username}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-background-tertiary/40"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      {u.is_banned ? (
                        <button
                          disabled={props.isBusy}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-60"
                          onClick={() => props.onUnban(u)}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Unban
                        </button>
                      ) : (
                        <button
                          disabled={props.isBusy}
                          className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs font-semibold text-yellow-200 hover:bg-yellow-500/15 disabled:opacity-60"
                          onClick={() => props.onBan(u)}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Ban
                        </button>
                      )}
                      <button
                        disabled={props.isBusy}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15 disabled:opacity-60"
                        onClick={() => props.onDelete(u)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-foreground-subtle">Protected</span>
                  )}
                </div>
              </td>
            </tr>
              )
            })()
          ))}
        </tbody>
      </table>
    </div>
  )
}
