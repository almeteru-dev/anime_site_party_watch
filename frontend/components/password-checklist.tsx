"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

function hasUppercase(s: string) {
  return /[A-Z]/.test(s)
}

function hasDigit(s: string) {
  return /[0-9]/.test(s)
}

function hasSpecial(s: string) {
  return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)
}

export function PasswordChecklist(props: { password: string; className?: string }) {
  const p = props.password
  const items = [
    { ok: p.length >= 8 && p.length <= 100, label: "8-100 characters" },
    { ok: hasDigit(p), label: "1+ digit" },
    { ok: hasUppercase(p), label: "1+ uppercase letter" },
    { ok: hasSpecial(p), label: "1+ special character (!@#...)" },
  ]

  return (
    <div className={cn("rounded-xl border border-border/60 bg-background px-4 py-3", props.className)}>
      <div className="text-xs font-semibold text-foreground-muted">Password requirements</div>
      <div className="mt-2 grid grid-cols-1 gap-1">
        {items.map((it) => (
          <div key={it.label} className={cn("flex items-center gap-2 text-xs", it.ok ? "text-emerald-300" : "text-foreground-subtle")}>
            {it.ok ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
