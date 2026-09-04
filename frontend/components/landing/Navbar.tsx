"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Categories", href: "#categories" },
  { label: "FAQ", href: "#faq" },
]

export function Navbar() {
  const [hasSession, setHasSession] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

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
        console.error("Failed to check session in Navbar:", error)
      }
    }
    checkSession()
  }, [])

  const goToApp = () => router.push(hasSession ? "/freelancer/dashboard" : "/signup")

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            L
          </span>
          <span className="font-heading text-base font-semibold text-foreground">
            LuvonGig
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {hasSession ? (
            <Button onClick={goToApp}>Go to dashboard</Button>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <Button onClick={goToApp}>Get started</Button>
            </>
          )}
        </div>

        <button
          className="flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {!hasSession && (
              <Link
                href="/login"
                className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                Log in
              </Link>
            )}
            <Button onClick={goToApp} className="w-full">
              {hasSession ? "Go to dashboard" : "Get started"}
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
