"use client"

import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Achievement } from "@/lib/api"

export function AchievementsTable(props: {
	items: Achievement[]
	isBusy: boolean
	onEdit: (a: Achievement) => void
	onDelete: (a: Achievement) => void
}) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead className="text-xs text-foreground-muted">
					<tr className="border-b border-border/60">
						<th className="text-left font-semibold px-4 py-3">Code</th>
						<th className="text-left font-semibold px-4 py-3">RU</th>
						<th className="text-left font-semibold px-4 py-3">EN</th>
						<th className="text-left font-semibold px-4 py-3">UK</th>
						<th className="text-left font-semibold px-4 py-3">Color</th>
						<th className="text-right font-semibold px-4 py-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{props.items.map((a) => (
						<tr key={a.id} className="border-b border-border/40 hover:bg-background-tertiary/30">
							<td className="px-4 py-3 font-mono text-xs text-foreground">{a.code}</td>
							<td className="px-4 py-3 text-foreground">{a.name_ru || ""}</td>
							<td className="px-4 py-3 text-foreground">{a.name_en}</td>
							<td className="px-4 py-3 text-foreground">{a.name_uk || ""}</td>
							<td className="px-4 py-3">
								<div className="inline-flex items-center gap-2">
									<span className="h-5 w-5 rounded-md border border-border/60" style={{ backgroundColor: a.color }} />
									<span className="text-xs text-foreground-muted">{a.color}</span>
								</div>
							</td>
							<td className="px-4 py-3">
								<div className="flex items-center justify-end gap-2">
									<button
										onClick={() => props.onEdit(a)}
										disabled={props.isBusy}
										className={cn(
											"inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-background-tertiary/40",
											props.isBusy && "opacity-60 cursor-not-allowed"
										)}
									>
										<Pencil className="w-4 h-4" />
										Edit
									</button>
									<button
										onClick={() => props.onDelete(a)}
										disabled={props.isBusy}
										className={cn(
											"inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/15",
											props.isBusy && "opacity-60 cursor-not-allowed"
										)}
									>
										<Trash2 className="w-4 h-4" />
										Delete
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
