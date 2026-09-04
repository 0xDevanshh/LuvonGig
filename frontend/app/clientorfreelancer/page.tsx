'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Header1 } from '@/components/Header1'
import { Users, Briefcase, ArrowRight, Star } from 'lucide-react'

const ROLES = [
  {
    href: '/client/dashboard',
    icon: Users,
    title: 'Client',
    description:
      'Find and hire talented freelancers for your projects. Browse services, post jobs, and manage your projects.',
    cta: 'Client dashboard',
  },
  {
    href: '/freelancer/dashboard',
    icon: Briefcase,
    title: 'Freelancer',
    description:
      'Offer your services, manage your gigs, and grow your freelance business. Create services and connect with clients.',
    cta: 'Freelancer dashboard',
  },
  {
    href: '/expert/dashboard',
    icon: Star,
    title: 'Expert',
    description: 'Offer 1:1 mentorship and share your professional knowledge to help others succeed.',
    cta: 'Expert dashboard',
  },
]

export default function ClientOrFreelancerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header1 showSearch={false} />

      <div className="flex flex-1 items-center justify-center p-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="font-heading text-h1 font-semibold text-foreground">
              Choose your role
            </h1>
            <p className="mt-3 text-muted-foreground">
              Select how you&rsquo;d like to use LuvonGig today. You can switch between roles anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {ROLES.map((role) => {
              const Icon = role.icon
              return (
                <Link key={role.href} href={role.href} className="group">
                  <Card className="h-full min-h-[320px] border-border transition-all hover:border-primary hover:shadow-md">
                    <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary-soft">
                        <Icon className="size-8 text-primary-hover" />
                      </div>
                      <h2 className="font-heading text-h3 font-semibold text-foreground">
                        {role.title}
                      </h2>
                      <p className="mb-8 mt-3 flex-1 text-sm text-muted-foreground">
                        {role.description}
                      </p>
                      <div className="flex items-center font-medium text-primary">
                        <span>{role.cta}</span>
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

