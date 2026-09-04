"use client"

import { useRouter } from "next/navigation"
import {
  Megaphone,
  Briefcase,
  ClipboardList,
  FolderKanban,
  Code2,
  Palette,
  PenTool,
} from "lucide-react"

const CATEGORIES = [
  { label: "Marketing", icon: Megaphone },
  { label: "Business", icon: Briefcase },
  { label: "Admin", icon: ClipboardList },
  { label: "Portfolio", icon: FolderKanban },
  { label: "Technology", icon: Code2 },
  { label: "User Experience", icon: PenTool },
  { label: "Web Designer", icon: Palette },
]

export function Categories() {
  const router = useRouter()

  return (
    <section id="categories" className="scroll-mt-16 bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-h1 font-semibold text-foreground">
            Browse by category
          </h2>
          <p className="mt-3 text-muted-foreground">
            Explore the skills and services available on LuvonGig.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.label}
                onClick={() => router.push("/client/browse-services")}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Icon className="size-4" />
                {category.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
