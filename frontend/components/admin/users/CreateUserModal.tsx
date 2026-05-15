"use client"

import { Modal } from "@/components/admin/users/Modal"
import { PasswordChecklist } from "@/components/password-checklist"

export type CreateUserForm = {
  username: string
  email: string
  password: string
  role: "user" | "moderator" | "admin"
}

export function CreateUserModal(props: {
  open: boolean
  isBusy: boolean
  form: CreateUserForm
  currentRole: string
  error?: string | null
  onClose: () => void
  onChange: (next: CreateUserForm) => void
  onSubmit: () => void
}) {
  const canCreateAdmin = props.currentRole === "root"
  return (
    <Modal open={props.open} title="Create user" onClose={props.onClose}>
      <div className="space-y-4">
        {props.error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {props.error}
          </div>
        ) : null}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">Username</label>
          <input
            value={props.form.username}
            onChange={(e) => props.onChange({ ...props.form, username: e.target.value })}
            className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">Email</label>
          <input
            value={props.form.email}
            onChange={(e) => props.onChange({ ...props.form, email: e.target.value })}
            className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">Password</label>
          <input
            value={props.form.password}
            onChange={(e) => props.onChange({ ...props.form, password: e.target.value })}
            type="password"
            className="w-full h-11 rounded-xl bg-background border border-border/60 px-4 text-sm text-foreground outline-none focus:border-primary/50"
            required
          />
          <PasswordChecklist password={props.form.password} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground-muted">Role</label>
          <select
            value={props.form.role}
            onChange={(e) => props.onChange({ ...props.form, role: e.target.value as CreateUserForm["role"] })}
            className="w-full h-11 rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground"
          >
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            {canCreateAdmin ? <option value="admin">Admin</option> : null}
          </select>
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
            className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  )
}
