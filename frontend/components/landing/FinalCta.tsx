"use client"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function FinalCta() {
  const router = useRouter()

  return (
    <section className="border-t border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-h1 font-semibold text-foreground">
          Ready to get started?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Join LuvonGig and find people worth working with.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => router.push("/signup")} className="w-full sm:w-auto">
            Get started
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/login")} className="w-full sm:w-auto">
            Log in
          </Button>
        </div>
      </div>
    </section>
  )
}
