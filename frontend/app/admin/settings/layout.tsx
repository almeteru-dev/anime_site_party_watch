"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isRoot = user?.role === "root"

  const tabs = [
    { href: "/admin/settings", label: "Admin Settings", visible: true },
    { href: "/admin/settings/root", label: "Root Settings", visible: isRoot },
  ].filter((t) => t.visible)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold border transition-colors",
                active
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-background-secondary/40 text-foreground-muted border-border/60 hover:text-foreground hover:bg-background-tertiary/60"
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}

