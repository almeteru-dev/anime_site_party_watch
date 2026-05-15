"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, PlusCircle, LogOut, Shield, List, Users, Tags, Sliders, Settings, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { roleLevel } from "@/lib/roles"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (!isLoading && !user) {
    router.push("/")
    return null
  }

  if (!isLoading) {
    const lvl = roleLevel(user?.role || "user")
    if (lvl < roleLevel("moderator")) {
      router.push("/")
      return null
    }
    if (user?.role === "moderator") {
      const allowed =
        pathname === "/admin/animes" ||
        pathname === "/admin/animes/new" ||
        pathname.startsWith("/admin/animes/") ||
        pathname === "/admin/schedule"
      if (!allowed) {
        router.push("/admin/animes")
        return null
      }
    }
  }

  type NavItem = { href: string; label: string; icon: any; disabled?: boolean }

  const nav: NavItem[] = [
    { href: "/admin/animes", label: "Anime", icon: List },
    { href: "/admin/animes/new", label: "Add Anime", icon: PlusCircle },
    { href: "/admin/schedule", label: "Schedule", icon: Sliders },
    { href: "/admin/kinds-ratings", label: "Kinds & Ratings", icon: Sliders },
    { href: "/admin/video-labels", label: "Video Labels", icon: Tags },
    { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  const visibleNav = nav.filter((item) => {
    if (user?.role === "moderator") {
      return item.href === "/admin/animes" || item.href === "/admin/animes/new" || item.href === "/admin/schedule"
    }
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-72 hidden lg:flex flex-col border-r border-border/50 bg-background-secondary/40 min-h-screen sticky top-0">
          <div className="px-6 py-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Admin CMS</div>
                <div className="text-xs text-foreground-muted">LycorisLib</div>
              </div>
            </div>
          </div>

          <nav className="px-3 py-4 flex-1">
            {visibleNav.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.disabled ? "#" : item.href}
                  aria-disabled={item.disabled}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    item.disabled
                      ? "text-foreground-subtle cursor-not-allowed opacity-60"
                      : active
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary/60"
                  )}
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault()
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="px-6 py-5 border-t border-border/50">
            <div className="text-xs text-foreground-muted">Signed in as</div>
            <div className="text-sm font-medium text-foreground truncate">{user?.email}</div>
            <button
              onClick={logout}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background hover:bg-background-tertiary/40 px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" />
                <div className="text-sm font-semibold text-foreground">Dashboard</div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle showLabel />
                <div className="lg:hidden text-xs text-foreground-muted">Admin access</div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
