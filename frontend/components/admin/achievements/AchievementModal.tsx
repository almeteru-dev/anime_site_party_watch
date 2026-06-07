"use client"

import { useMemo } from "react"
import { Modal } from "@/components/admin/users/Modal"
import { cn } from "@/lib/utils"

export type AchievementForm = {
	code: string
	name_en: string
	name_ru: string
	name_uk: string
	color: string
}

export function AchievementModal(props: {
	open: boolean
	title: string
	isBusy: boolean
	error?: string | null
	form: AchievementForm
	onClose: () => void
	onChange: (next: AchievementForm) => void
	onSubmit: () => void
}) {
	const normalizedColor = useMemo(() => {
		const raw = (props.form.color || "").trim()
		if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw
		if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
			const r = raw[1]
			const g = raw[2]
			const b = raw[3]
			return `#${r}${r}${g}${g}${b}${b}`
		}
		return "#3B82F6"
	}, [props.form.color])
	const previewStyle = useMemo(() => ({ backgroundColor: normalizedColor }), [normalizedColor])
	const palette = useMemo(
		() => ["#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#A855F7", "#06B6D4", "#111827"],
		[]
	)

	return (
		<Modal open={props.open} title={props.title} onClose={props.onClose}>
			<div className="space-y-4">
				{props.error ? (
					<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{props.error}</div>
				) : null}

				<div className="space-y-2">
					<label className="text-xs font-semibold text-foreground-muted">Code</label>
					<input
						value={props.form.code}
						onChange={(e) => props.onChange({ ...props.form, code: e.target.value })}
						className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
						placeholder="early-supporter"
						required
					/>
					<div className="text-xs text-foreground-muted">Латиница, цифры, ., _, -</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">RU</label>
						<input
							value={props.form.name_ru}
							onChange={(e) => props.onChange({ ...props.form, name_ru: e.target.value })}
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
							placeholder="(optional)"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">EN</label>
						<input
							value={props.form.name_en}
							onChange={(e) => props.onChange({ ...props.form, name_en: e.target.value })}
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
							required
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">UK</label>
						<input
							value={props.form.name_uk}
							onChange={(e) => props.onChange({ ...props.form, name_uk: e.target.value })}
							className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
							placeholder="(optional)"
						/>
					</div>
				</div>
				<div className="text-xs text-foreground-muted">EN is required. RU/UK are optional; if empty, EN will be shown.</div>

				<div className="flex items-end gap-3">
					<div className="flex-1 space-y-2">
						<label className="text-xs font-semibold text-foreground-muted">Color</label>
						<div className="flex items-center gap-3">
							<input
								type="color"
								value={normalizedColor}
								onChange={(e) => props.onChange({ ...props.form, color: e.target.value })}
								className="h-11 w-12 rounded-xl border border-border/60 bg-background p-1"
								aria-label="Pick color"
							/>
							<input
								value={props.form.color}
								onChange={(e) => props.onChange({ ...props.form, color: e.target.value })}
								className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
								placeholder="#3B82F6"
								required
							/>
							<div className="h-11 w-20 rounded-xl border border-border/60" style={previewStyle} />
						</div>
						<div className="flex flex-wrap gap-2">
							{palette.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => props.onChange({ ...props.form, color: c })}
									className="h-7 w-7 rounded-lg border border-border/60"
									style={{ backgroundColor: c }}
									aria-label={`Set color ${c}`}
								/>
							))}
						</div>
						<div className="text-xs text-foreground-muted">Hex: #RGB или #RRGGBB</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 pt-2">
					<button
						onClick={props.onClose}
						disabled={props.isBusy}
						className="h-10 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-background-tertiary/40 disabled:opacity-60"
					>
						Cancel
					</button>
					<button
						onClick={props.onSubmit}
						disabled={props.isBusy}
						className={cn(
							"h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60",
						)}
					>
						Save
					</button>
				</div>
			</div>
		</Modal>
	)
}
