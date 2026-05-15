"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { periods } from "@/lib/schedule-data";

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (periodId: string) => void;
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = periods.find(p => p.id === selectedPeriod) || periods[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-background-secondary border border-border rounded-xl text-foreground font-medium text-sm hover:border-primary/30 hover:bg-background-tertiary transition-all duration-200 group"
      >
        <span className="text-primary">{current.label}</span>
        {current.current && (
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
            Current
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-foreground-subtle transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-background-secondary border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-1.5">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onPeriodChange(p.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  selectedPeriod === p.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
                }`}
              >
                <span>{p.label}</span>
                {p.current && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
