"use client"

export function Modal(props: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!props.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={props.onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-background-secondary/95 backdrop-blur-xl shadow-2xl">
        <div className="px-5 py-4 border-b border-border/50">
          <div className="text-sm font-semibold text-foreground">{props.title}</div>
        </div>
        <div className="p-5">{props.children}</div>
      </div>
    </div>
  )
}

