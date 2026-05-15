"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

type DayTab = {
  key: string
  weekday: string
  label: string
  isToday: boolean
}

interface DayTabsProps {
  days: DayTab[]
  selectedKey: string
  onDayChange: (key: string) => void
}

export function DayTabs({ days, selectedKey, onDayChange }: DayTabsProps) {
  const { t } = useLanguage()

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((day) => {
        const isSelected = selectedKey === day.key;
        const isToday = day.isToday;
        
        return (
          <button
            key={day.key}
            onClick={() => onDayChange(day.key)}
            className={`relative flex flex-col items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 min-w-[80px] group ${
              isSelected
                ? "bg-primary text-primary-foreground ring-1 ring-primary/25 shadow-sm"
                : "bg-background-secondary border border-border text-foreground-muted hover:border-primary/30 hover:text-foreground hover:bg-background-tertiary"
            }`}
          >
            {isToday && !isSelected && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            )}
            <span className={cn("font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>
              {day.weekday}
            </span>
            <span className={cn("text-xs mt-0.5", isSelected ? "text-primary-foreground/70" : "text-foreground-subtle")}>
              {day.label}
            </span>
            {isToday && (
              <span className={cn("text-[10px] font-semibold mt-1", isSelected ? "text-primary-foreground/80" : "text-primary")}>
                {t.schedule.today}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
