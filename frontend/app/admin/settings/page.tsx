"use client"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold text-foreground">Admin Settings</div>
        <div className="text-sm text-foreground-muted">Settings available to Admin users.</div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 p-5">
        <div className="text-sm text-foreground-muted">No admin-level settings are currently available.</div>
      </div>
    </div>
  )
}

