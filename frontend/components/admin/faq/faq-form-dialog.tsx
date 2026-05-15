"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import type { FAQItem } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const faqSchema = z.object({
  question: z.string().trim().min(3, "Question is required"),
  question_ru: z.string().trim().optional(),
  answer: z.string().trim().min(3, "Answer is required"),
  answer_ru: z.string().trim().optional(),
  is_published: z.boolean().default(false),
  priority: z.coerce.number().int().min(0).max(100000).default(0),
})

export type FAQFormValues = z.infer<typeof faqSchema>

const emptyDefaults: FAQFormValues = { question: "", question_ru: "", answer: "", answer_ru: "", is_published: false, priority: 0 }

export function FAQFormDialog(props: {
  open: boolean
  mode: "create" | "edit"
  initial: FAQItem | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: FAQFormValues) => Promise<void>
}) {
  const form = useForm<FAQFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (!props.open) {
      form.reset(emptyDefaults)
      return
    }
    if (props.mode === "edit" && props.initial) {
      form.reset({
        question: props.initial.question || "",
        question_ru: props.initial.question_ru || "",
        answer: props.initial.answer || "",
        answer_ru: props.initial.answer_ru || "",
        is_published: !!props.initial.is_published,
        priority: Number.isFinite(props.initial.priority) ? props.initial.priority : 0,
      })
      return
    }
    form.reset(emptyDefaults)
  }, [props.open, props.mode, props.initial, form])

  const submit = form.handleSubmit(async (values) => {
    await props.onSave(values)
    props.onOpenChange(false)
  })

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.mode === "edit" ? "Edit FAQ" : "Create FAQ"}</DialogTitle>
          <DialogDescription>
            {props.mode === "edit" ? "Update the question and answer." : "Add a new frequently asked question."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Question</label>
            <Input {...form.register("question")} placeholder="e.g., How do I reset my password?" />
            {form.formState.errors.question ? (
              <div className="text-xs text-red-300">{form.formState.errors.question.message}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Question (RU)</label>
            <Input {...form.register("question_ru")} placeholder="Например: Как сбросить пароль?" />
            {form.formState.errors.question_ru ? (
              <div className="text-xs text-red-300">{form.formState.errors.question_ru.message}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Answer</label>
            <Textarea {...form.register("answer")} placeholder="Write a clear answer…" className="min-h-32" />
            {form.formState.errors.answer ? (
              <div className="text-xs text-red-300">{form.formState.errors.answer.message}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Answer (RU)</label>
            <Textarea {...form.register("answer_ru")} placeholder="Напишите понятный ответ…" className="min-h-32" />
            {form.formState.errors.answer_ru ? (
              <div className="text-xs text-red-300">{form.formState.errors.answer_ru.message}</div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Priority</label>
              <Input type="number" inputMode="numeric" {...form.register("priority")} />
              {form.formState.errors.priority ? (
                <div className="text-xs text-red-300">{form.formState.errors.priority.message}</div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground">Published</div>
              <Controller
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2">
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                    <span className="text-sm text-foreground-muted">
                      {field.value ? "Visible on site" : "Hidden (draft)"}
                    </span>
                  </label>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onOpenChange(false)}
              className="rounded-xl"
              disabled={props.saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={props.saving} className="rounded-xl">
              {props.saving ? "Saving…" : props.mode === "edit" ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
