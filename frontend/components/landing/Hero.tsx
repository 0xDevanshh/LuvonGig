"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Hero() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session")
        const data = await response.json()
        if (data?.success && data.session?.userId) {
          setHasSession(true)
          return
        }
        const meResponse = await fetch("/api/auth/me")
        const meData = await meResponse.json()
        if (meData?.success && meData.session?.userId) {
          setHasSession(true)
        }
      } catch (error) {
        console.error("Failed to check session:", error)
      }
    }
    checkSession()
  }, [])

  const findWork = () => router.push(hasSession ? "/freelancer/browse-jobs" : "/signup")
  const findTalent = () => router.push(hasSession ? "/experts" : "/signup")

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
        <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-hover">
          A freelance marketplace built on trust
        </span>

        <h1 className="mt-6 font-heading text-hero font-semibold tracking-tight text-foreground">
          Work with people
          <br />
          worth working with.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          Find skilled freelancers, hire with confidence, manage projects, and
          handle payments &mdash; all from one place.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={findTalent} className="w-full sm:w-auto">
            Find talent
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={findWork} className="w-full sm:w-auto">
            Find work
          </Button>
        </div>
      </div>
    </section>
  )
}
