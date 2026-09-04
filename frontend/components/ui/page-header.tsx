import * as React from "react"

import { cn } from "@/lib/utils"

function PageHeader({
  className,
  title,
  description,
  actions,
  eyebrow,
  ...props
}: React.ComponentProps<"div"> & {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
}) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && (
          <span className="text-meta font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="truncate font-heading text-h1 font-semibold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export { PageHeader }
