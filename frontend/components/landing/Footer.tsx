import Link from "next/link"
import { Twitter, Linkedin, MessageCircle, Mail } from "lucide-react"

const PRODUCT_LINKS = [
  { label: "Find work", href: "/freelancer/browse-jobs" },
  { label: "Find talent", href: "/experts" },
  { label: "Browse services", href: "/client/browse-services" },
  { label: "Post a job", href: "/client/post-job" },
]

const ACCOUNT_LINKS = [
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/signup" },
]

const SOCIAL_LINKS = [
  { label: "Twitter", href: "https://x.com/Workbuddofficial", icon: Twitter },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/Workbudd/", icon: Linkedin },
  { label: "Discord", href: "https://discord.gg/uAhH8rMr27", icon: MessageCircle },
  { label: "Email", href: "mailto:hello@luvonlabs.com", icon: Mail },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                L
              </span>
              <span className="font-heading text-base font-semibold text-foreground">
                LuvonGig
              </span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              A freelance marketplace for finding people worth working with.
            </p>
          </div>

          <div>
            <h3 className="text-meta font-medium uppercase tracking-wide text-muted-foreground">
              Product
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-meta font-medium uppercase tracking-wide text-muted-foreground">
              Account
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-meta font-medium uppercase tracking-wide text-muted-foreground">
              Connect
            </h3>
            <div className="mt-3 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="size-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-meta text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} LuvonGig. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
