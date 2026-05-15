"use client"

import { Crown, ShieldCheck, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminUser } from "@/lib/api"
import { roleLabel } from "@/lib/roles"

export function RoleBadge({ role }: { role: string }) {
  const isRoot = role === "root"
  const isAdmin = role === "admin"
  const isModerator = role === "moderator"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border",
        isRoot
          ? "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30"
          : isAdmin
            ? "bg-primary/15 text-primary border-primary/30"
            : isModerator
              ? "bg-sky-500/10 text-sky-200 border-sky-500/30"
              : "bg-background-tertiary/40 text-foreground-muted border-border/60"
      )}
    >
      {isRoot ? <Crown className="w-3.5 h-3.5" /> : null}
      {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : null}
      {isModerator ? <Shield className="w-3.5 h-3.5" /> : null}
      {roleLabel(role)}
    </span>
  )
}

export function StatusBadge({ user }: { user: AdminUser }) {
  if (user.is_banned) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border border-red-500/40 bg-red-500/10 text-red-300">
        Banned
      </span>
    )
  }
  if (!user.is_verified) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-200">
        Not Verified
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
      Active
    </span>
  )
}
