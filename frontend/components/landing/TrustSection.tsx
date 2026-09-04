import { ShieldCheck, Lock, Star, Headset } from "lucide-react"

const POINTS = [
  {
    icon: Lock,
    title: "Secure payments",
    description: "Every transaction runs through Stripe, so your card details and payouts stay protected.",
  },
  {
    icon: ShieldCheck,
    title: "Milestone protection",
    description: "Funds are only released when work is delivered and approved, on both sides.",
  },
  {
    icon: Star,
    title: "Verified profiles",
    description: "Ratings and completed-project history help you hire and get hired with confidence.",
  },
  {
    icon: Headset,
    title: "Support when you need it",
    description: "Real people are available if a project needs a hand or a dispute needs resolving.",
  },
]

export function TrustSection() {
  return (
    <section className="border-t border-border bg-secondary/40 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-h1 font-semibold text-foreground">
            Built for trust, from day one
          </h2>
          <p className="mt-3 text-muted-foreground">
            The tools you need to work with confidence, on both sides of a project.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((point) => {
            const Icon = point.icon
            return (
              <div key={point.title} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary-hover">
                  <Icon className="size-[18px]" />
                </span>
                <h3 className="font-heading text-h3 font-semibold text-foreground">{point.title}</h3>
                <p className="text-sm text-muted-foreground">{point.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
