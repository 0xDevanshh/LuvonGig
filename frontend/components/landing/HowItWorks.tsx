"use client"

import { Search, FileText, Briefcase, MessageSquare, Wallet, CheckCircle2 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CLIENT_STEPS = [
  {
    icon: FileText,
    title: "Post a job",
    description: "Describe the work, set your budget, and list the skills you need.",
  },
  {
    icon: Search,
    title: "Review proposals",
    description: "Compare freelancers by rating, price, and experience, then hire.",
  },
  {
    icon: Wallet,
    title: "Pay with confidence",
    description: "Funds are held securely and released as milestones are completed.",
  },
]

const FREELANCER_STEPS = [
  {
    icon: Briefcase,
    title: "Build your profile",
    description: "Showcase your skills, rate, and portfolio to stand out.",
  },
  {
    icon: MessageSquare,
    title: "Send proposals",
    description: "Find jobs that fit and pitch your best work directly to clients.",
  },
  {
    icon: CheckCircle2,
    title: "Get paid securely",
    description: "Deliver the work and receive payment through Stripe, on time.",
  },
]

function StepList({ steps }: { steps: typeof CLIENT_STEPS }) {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <div key={step.title} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary-hover">
                <Icon className="size-[18px]" />
              </span>
              <span className="text-meta font-medium text-muted-foreground">
                Step {index + 1}
              </span>
            </div>
            <h3 className="font-heading text-h3 font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        )
      })}
    </div>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-h1 font-semibold text-foreground">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            A simple process for finding great work, or great talent.
          </p>
        </div>

        <Tabs defaultValue="clients" className="mt-10">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="clients">For clients</TabsTrigger>
              <TabsTrigger value="freelancers">For freelancers</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="clients" className="mt-8">
            <StepList steps={CLIENT_STEPS} />
          </TabsContent>
          <TabsContent value="freelancers" className="mt-8">
            <StepList steps={FREELANCER_STEPS} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
