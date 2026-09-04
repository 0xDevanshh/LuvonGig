"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const FAQS = [
  {
    question: "How do I get started?",
    answer:
      "Sign up as a client to post a job or browse services, or as a freelancer to build a profile and start sending proposals. It takes a couple of minutes.",
  },
  {
    question: "How does payment work?",
    answer:
      "Payments run through Stripe. Clients fund a project or milestone up front, and freelancers are paid once the work is delivered and approved.",
  },
  {
    question: "Can I be both a client and a freelancer?",
    answer:
      "Yes. You can switch between client and freelancer views from your account menu at any time.",
  },
  {
    question: "What if there's a problem with a project?",
    answer:
      "Reach out to support from your dashboard. We'll help both sides work through payment or delivery issues.",
  },
  {
    question: "Does LuvonGig take a fee?",
    answer:
      "Service and platform fees are shown before you confirm a payment or accept a job, so there are no surprises.",
  },
]

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-16 border-t border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-h1 font-semibold text-foreground">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-10 flex flex-col gap-2">
          {FAQS.map((faq, index) => {
            const open = openIndex === index
            return (
              <div key={faq.question} className="rounded-xl border border-border bg-surface">
                <button
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm font-medium text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </button>
                {open && (
                  <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.answer}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
