import * as React from "react"

import { cn } from "@/lib/utils"

export type StatusTone = "neutral" | "info" | "success" | "warning" | "destructive"

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-primary-soft text-primary-hover",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
}

/**
 * Maps common marketplace status strings (proposal/project/payment states)
 * to a semantic tone. Falls back to "neutral" for anything unrecognized.
 */
export function statusToTone(status: string): StatusTone {
  const normalized = status.trim().toLowerCase()
  if (["accepted", "active", "completed", "paid", "hired", "approved", "released"].includes(normalized)) {
    return "success"
  }
  if (["pending", "shortlisted", "in progress", "processing", "awaiting payment", "viewed"].includes(normalized)) {
    return "warning"
  }
  if (["rejected", "declined", "cancelled", "canceled", "expired", "failed", "withdrawn"].includes(normalized)) {
    return "destructive"
  }
  if (["submitted", "draft", "invited"].includes(normalized)) {
    return "info"
  }
  return "neutral"
}

function StatusBadge({
  status,
  tone,
  className,
  ...props
}: React.ComponentProps<"span"> & { status: string; tone?: StatusTone }) {
  const resolvedTone = tone ?? statusToTone(status)
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[resolvedTone],
        className
      )}
      {...props}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export { StatusBadge }
