"use client"

import type { FAQItem } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function FAQDeleteDialog(props: {
  open: boolean
  item: FAQItem | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the selected FAQ item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              props.onConfirm()
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={props.saving || !props.item}
          >
            {props.saving ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

