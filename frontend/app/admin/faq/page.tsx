"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  adminCreateFAQ,
  adminDeleteFAQ,
  adminListFAQ,
  adminUpdateFAQ,
  type FAQItem,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { FAQFormDialog, type FAQFormValues } from "@/components/admin/faq/faq-form-dialog"
import { FAQDeleteDialog } from "@/components/admin/faq/faq-delete-dialog"

export default function AdminFAQPage() {
  const { user } = useAuth()

  const [items, setItems] = useState<FAQItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<FAQItem | null>(null)

  const [formMode, setFormMode] = useState<"create" | "edit">("create")

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<FAQItem | null>(null)

  const sorted = useMemo(() => {
    return (items || []).slice().sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.id - a.id
    })
  }, [items])

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await adminListFAQ({})
      setItems(data)
    } catch (e: any) {
      setError(e.message || "Failed to load FAQ")
      setItems([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setFormMode("create")
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (item: FAQItem) => {
    setFormMode("edit")
    setEditing(item)
    setIsFormOpen(true)
  }

  const save = async (values: FAQFormValues) => {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const updated = await adminUpdateFAQ({ id: editing.id, input: values })
        setItems((prev) => (prev ? prev.map((x) => (x.id === updated.id ? updated : x)) : prev))
      } else {
        const created = await adminCreateFAQ({ input: values })
        setItems((prev) => ([...(prev || []), created]))
      }
    } catch (e: any) {
      setError(e.message || "Failed to save")
      throw e
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (item: FAQItem) => {
    setDeleting(item)
    setDeleteOpen(true)
  }

  const doDelete = async () => {
    if (!deleting) return
    setSaving(true)
    setError(null)
    try {
      await adminDeleteFAQ({ id: deleting.id })
      setItems((prev) => (prev ? prev.filter((x) => x.id !== deleting.id) : prev))
      setDeleteOpen(false)
      setDeleting(null)
    } catch (e: any) {
      setError(e.message || "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ</h1>
          <p className="text-sm text-foreground-muted">Create, edit, publish, and order FAQ items.</p>
        </div>

        <Button onClick={openCreate} className="rounded-xl">
          <PlusCircle className="w-4 h-4" />
          Add New Question
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-background-secondary/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">All FAQ Items</div>
          <div className="text-xs text-foreground-muted">{sorted.length} total</div>
        </div>

        {items === null ? (
          <div className="px-5 py-8 text-sm text-foreground-muted">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="px-5 py-8 text-sm text-foreground-muted">No FAQ items yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-foreground-subtle">
                <tr className="border-b border-border/50">
                  <th className="text-left font-semibold px-5 py-3">Question</th>
                  <th className="text-left font-semibold px-5 py-3">Published</th>
                  <th className="text-left font-semibold px-5 py-3">Priority</th>
                  <th className="text-right font-semibold px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.id} className="border-b border-border/40 hover:bg-background-tertiary/30">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground line-clamp-2 max-w-[56ch]">{item.question}</div>
                      <div className="mt-1 text-xs text-foreground-muted line-clamp-1 max-w-[72ch]">{item.answer}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
                          item.is_published
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-border/60 bg-background text-foreground-muted"
                        )}
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-foreground-muted">{item.priority}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEdit(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => confirmDelete(item)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FAQFormDialog
        open={isFormOpen}
        mode={formMode}
        initial={editing}
        saving={saving}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditing(null)
        }}
        onSave={save}
      />

      <FAQDeleteDialog
        open={deleteOpen}
        item={deleting}
        saving={saving}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeleting(null)
        }}
        onConfirm={doDelete}
      />
    </div>
  )
}
