"use client"

import { cn } from "@/lib/utils"

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function WeekdayPicker(props: {
	selected: number
	counts: number[]
	onChange: (next: number) => void
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{labels.map((label, idx) => {
				const isActive = idx === props.selected
				const count = props.counts[idx] || 0
				return (
					<button
						key={label}
						type="button"
						onClick={() => props.onChange(idx)}
						className={cn(
							"h-10 rounded-xl px-3 text-sm font-semibold border",
							isActive
								? "bg-primary text-primary-foreground border-primary/50"
								: "bg-background border-border/60 text-foreground hover:bg-background-tertiary/40"
						)}
					>
						<span className="inline-flex items-center gap-2">
							<span>{label}</span>
							<span
								className={cn(
									"min-w-[1.5rem] h-5 px-1 rounded-full text-[11px] leading-5 text-center",
									isActive ? "bg-primary-foreground/20" : "bg-foreground/10"
								)}
							>
								{count}
							</span>
						</span>
					</button>
				)
			})}
		</div>
	)
}

