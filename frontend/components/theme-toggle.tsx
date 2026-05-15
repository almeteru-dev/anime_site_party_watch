"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background-secondary/70 backdrop-blur px-3 py-2 text-sm font-semibold text-foreground hover:bg-background-tertiary transition-colors",
        className
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      {showLabel ? <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span> : null}
    </button>
  )
}

