"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Clock, XCircle, Play, PauseCircle, Plus, ChevronDown, Trash2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

export type AnimeStatus = "watching" | "planned" | "completed" | "on_hold" | "dropped" | null

interface AnimeStatusManagerProps {
  animeId: string
  currentStatus: AnimeStatus
  onStatusChange: (animeId: string, newStatus: AnimeStatus) => Promise<void>
  onRemove?: (animeId: string) => Promise<void>
  showDelete?: boolean
  variant?: "default" | "compact" | "icon"
  className?: string
}

const statusConfig = {
  completed: {
    icon: Check,
    color: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-400",
    borderColor: "border-emerald-500/50",
    hoverBg: "hover:bg-emerald-500/20",
  },
  planned: {
    icon: Clock,
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-500/50",
    hoverBg: "hover:bg-amber-500/20",
  },
  on_hold: {
    icon: PauseCircle,
    color: "bg-slate-500",
    textColor: "text-slate-700 dark:text-slate-300",
    borderColor: "border-slate-400/40",
    hoverBg: "hover:bg-slate-500/20",
  },
  dropped: {
    icon: XCircle,
    color: "bg-red-500",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-500/50",
    hoverBg: "hover:bg-red-500/20",
  },
  watching: {
    icon: Play,
    color: "bg-primary",
    textColor: "text-primary",
    borderColor: "border-primary/50",
    hoverBg: "hover:bg-primary/20",
  },
}

export function AnimeStatusManager({
  animeId,
  currentStatus,
  onStatusChange,
  onRemove,
  showDelete = false,
  variant = "default",
  className,
}: AnimeStatusManagerProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleStatusChange = async (newStatus: AnimeStatus) => {
    if (newStatus === currentStatus || isLoading) return
    
    setIsLoading(true)
    try {
      await onStatusChange(animeId, newStatus)
      const statusLabel = newStatus
        ? newStatus === "on_hold"
          ? t.status.onHold
          : t.status[newStatus]
        : ""
      setToastMessage(`${t.status.statusChanged} ${statusLabel}`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error("Failed to change status:", error)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  const handleRemove = async () => {
    if (!onRemove || isLoading) return
    
    setIsLoading(true)
    try {
      await onRemove(animeId)
      setToastMessage(t.status.removed)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.error("Failed to remove:", error)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  const statusOptions: { id: AnimeStatus; label: string }[] = [
    { id: "watching", label: t.status.watching },
    { id: "planned", label: t.status.planned },
    { id: "completed", label: t.status.completed },
    { id: "on_hold", label: t.status.onHold },
    { id: "dropped", label: t.status.dropped },
  ]

  const currentConfig = currentStatus ? statusConfig[currentStatus] : null
  const CurrentIcon = currentConfig?.icon || Plus

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 font-medium transition-all duration-300",
          // Icon variant - small circular button
          variant === "icon" && cn(
            "w-9 h-9 rounded-full justify-center",
            currentStatus
              ? cn(
                  "border backdrop-blur-sm",
                  currentConfig?.borderColor,
                  currentConfig?.color,
                  "text-white"
                )
              : "bg-background/80 backdrop-blur-sm text-foreground-muted hover:text-primary hover:bg-background/90 border border-border/50 hover:border-primary/50"
          ),
          // Compact variant
          variant === "compact" && cn(
            "px-2.5 py-1.5 text-xs rounded-lg",
            currentStatus
              ? cn(
                  "border backdrop-blur-sm",
                  currentConfig?.borderColor,
                  currentConfig?.textColor,
                  currentConfig?.hoverBg,
                  "bg-background/80"
                )
              : "bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]"
          ),
          // Default variant
          variant === "default" && cn(
            "px-4 py-2 text-sm rounded-lg",
            currentStatus
              ? cn(
                  "border backdrop-blur-sm",
                  currentConfig?.borderColor,
                  currentConfig?.textColor,
                  currentConfig?.hoverBg,
                  "bg-background/80"
                )
              : "bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]"
          ),
          isLoading && "opacity-70 cursor-not-allowed"
        )}
        aria-label={
          currentStatus
            ? currentStatus === "on_hold"
              ? t.status.onHold
              : t.status[currentStatus]
            : t.status.addToList
        }
      >
        {isLoading ? (
          <div className={cn(
            "border-2 border-current border-t-transparent rounded-full animate-spin",
            variant === "icon" ? "w-4 h-4" : "w-4 h-4"
          )} />
        ) : (
          <CurrentIcon className={cn(
            variant === "icon" ? "w-4 h-4" : 
            variant === "compact" ? "w-3.5 h-3.5" : "w-4 h-4"
          )} />
        )}
        {variant !== "icon" && (
          <>
            <span>
              {currentStatus
                ? currentStatus === "on_hold"
                  ? t.status.onHold
                  : t.status[currentStatus]
                : t.status.addToList}
            </span>
            <ChevronDown className={cn(
              "transition-transform duration-200",
              variant === "compact" ? "w-3 h-3" : "w-4 h-4",
              isOpen && "rotate-180"
            )} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={cn(
            "absolute mt-2 w-48 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 bg-background-secondary/95 backdrop-blur-xl border border-border shadow-lg",
            // Position dropdown based on variant - icon variant opens to the left
            variant === "icon" ? "right-0 top-full" : "left-0 top-full"
          )}
        >
          <div className="py-1">
            {statusOptions.map((option) => {
              const config = option.id ? statusConfig[option.id] : null
              const Icon = config?.icon || Plus
              const isActive = option.id === currentStatus

              return (
                <button
                  key={option.id}
                  onClick={() => handleStatusChange(option.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? cn(config?.textColor, "bg-background-tertiary")
                      : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center",
                    isActive ? config?.color : "bg-muted"
                  )}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-medium">{option.label}</span>
                  {isActive && (
                    <Check className="w-4 h-4 ml-auto" />
                  )}
                </button>
              )
            })}

            {/* Remove Option - Only shown when showDelete is true */}
            {showDelete && currentStatus && onRemove && (
              <>
                <div className="h-px bg-border mx-3 my-1" />
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-red-500/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{t.status.removeFromList}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-300 bg-background-secondary/95 backdrop-blur-xl border border-border shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}
