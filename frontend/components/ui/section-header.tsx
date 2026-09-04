import * as React from "react"

import { cn } from "@/lib/utils"

function SectionHeader({
  className,
  title,
  description,
  actions,
  ...props
}: React.ComponentProps<"div"> & {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="truncate font-heading text-h2 font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export { SectionHeader }
