import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function StatCard({
  className,
  label,
  value,
  icon: Icon,
  trend,
  ...props
}: React.ComponentProps<"div"> & {
  label: React.ReactNode
  value: React.ReactNode
  icon?: LucideIcon
  /** e.g. "+12% this month", pass a className for color if needed */
  trend?: React.ReactNode
}) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-surface p-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-meta font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft text-primary-hover">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <span className="font-heading text-h2 font-semibold text-foreground">{value}</span>
      {trend && <span className="text-meta text-muted-foreground">{trend}</span>}
    </div>
  )
}

export { StatCard }
