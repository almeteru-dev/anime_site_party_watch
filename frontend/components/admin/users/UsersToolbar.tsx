"use client"

import { Search } from "lucide-react"

export type RoleFilter = "all" | "user" | "moderator" | "admin" | "root"
export type StatusFilter = "all" | "active" | "not_verified" | "banned"

export function UsersToolbar(props: {
  query: string
  onQueryChange: (next: string) => void
  role: RoleFilter
  onRoleChange: (next: RoleFilter) => void
  status: StatusFilter
  onStatusChange: (next: StatusFilter) => void
  onReset: () => void
  totalText: string
  meText: string
}) {
  return (
    <div className="p-4 border-b border-border/50">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2">
          <Search className="w-4 h-4 text-foreground-subtle" />
          <input
            value={props.query}
            onChange={(e) => props.onQueryChange(e.target.value)}
            placeholder="Search by username or email"
            className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle outline-none"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={props.role}
            onChange={(e) => props.onRoleChange(e.target.value as RoleFilter)}
            className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="root">Root</option>
          </select>
          <select
            value={props.status}
            onChange={(e) => props.onStatusChange(e.target.value as StatusFilter)}
            className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="not_verified">Not Verified</option>
            <option value="banned">Banned</option>
          </select>
          <button
            onClick={props.onReset}
            className="h-10 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-background-tertiary/40"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-foreground-subtle">
        <div>{props.totalText}</div>
        <div>{props.meText}</div>
      </div>
    </div>
  )
}
