"use client"

import type { AdminUser } from "@/lib/api"
import { Modal } from "@/components/admin/users/Modal"

export function BanUserModal(props: {
  open: boolean
  isBusy: boolean
  target: AdminUser | null
  reason: string
  onReasonChange: (next: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <Modal
      open={props.open}
      title={props.target ? `Ban ${props.target.email}` : "Ban user"}
      onClose={props.onClose}
    >
      <div className="space-y-4">
        <div className="text-sm text-foreground-muted">Ban reason is required and will be shown on login.</div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">Reason</label>
          <textarea
            value={props.reason}
            onChange={(e) => props.onReasonChange(e.target.value)}
            className="w-full min-h-[110px] rounded-xl bg-background border border-border/60 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
            required
          />
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
            className="h-10 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-60"
          >
            Ban
          </button>
        </div>
      </div>
    </Modal>
  )
}

