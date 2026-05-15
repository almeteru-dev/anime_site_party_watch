"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Plus, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import { setCollectionStatus } from "@/lib/collection-cache"
import { useAuth } from "@/contexts/auth-context"

export type UserListStatus = "watching" | "planned" | "completed" | "on_hold" | "dropped"

export type AddToUserListProps = {
  animeId: string
  onUpdate: (animeId: string, status: UserListStatus) => Promise<void>
  initialStatus?: UserListStatus | null
}

export function AddToUserList({ animeId, onUpdate, initialStatus = null }: AddToUserListProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [selected, setSelected] = useState<UserListStatus | null>(initialStatus)

  useEffect(() => {
    setSelected(initialStatus)
  }, [initialStatus])

  const label = useMemo(() => {
    if (phase === "loading") return "Saving..."
    if (phase === "success") return "Saved"
    if (!selected) return t.status.addToList
    if (selected === "on_hold") return t.status.onHold
    return t.status[selected]
  }, [phase, selected, t.status])

  const buttonClass = useMemo(() => {
    if (!selected) return "bg-primary text-primary-foreground hover:bg-primary/90"
    if (selected === "planned")
      return "bg-amber-500/15 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
    if (selected === "completed")
      return "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
    if (selected === "watching") return "bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
    if (selected === "on_hold")
      return "bg-slate-500/15 text-slate-700 border border-slate-400/30 hover:bg-slate-500/20 dark:text-slate-200 dark:border-slate-400/40"
    return "bg-red-500/15 text-red-700 border border-red-500/30 hover:bg-red-500/20 dark:text-red-300 dark:border-red-500/40"
  }, [selected])

  const items: { value: UserListStatus; label: string }[] = [
    { value: "watching", label: t.status.watching },
    { value: "planned", label: t.status.planned },
    { value: "completed", label: t.status.completed },
    { value: "on_hold", label: t.status.onHold },
    { value: "dropped", label: t.status.dropped },
  ]

  const handlePick = async (value: UserListStatus) => {
    setPhase("loading")
    try {
      await onUpdate(animeId, value)
      setSelected(value)
      if (user) setCollectionStatus(user.id, animeId, value)
      setPhase("success")
      window.setTimeout(() => setPhase("idle"), 1200)
    } catch {
      setPhase("error")
      window.setTimeout(() => setPhase("idle"), 1500)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={phase === "loading"}
          className={cn("font-semibold", buttonClass)}
          variant={selected ? "outline" : "default"}
        >
          <Plus className="w-4 h-4 mr-2" />
          {label}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
        {items.map((it) => (
          <DropdownMenuItem
            key={it.value}
            onClick={() => handlePick(it.value)}
            className={cn(
              "flex items-center justify-between text-foreground-muted hover:text-foreground hover:bg-background-tertiary focus:bg-background-tertiary focus:text-foreground cursor-pointer",
              selected === it.value && "bg-background-tertiary text-foreground"
            )}
          >
            {it.label}
            {selected === it.value && <Check className="w-4 h-4 ml-2 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
