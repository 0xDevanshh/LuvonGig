import React from 'react'

import { AppShell } from '@/components/shell/AppShell'

interface FreelancerLayoutProps {
  children: React.ReactNode
}

export default function FreelancerLayout({
  children,
}: FreelancerLayoutProps) {
  return <AppShell role="freelancer">{children}</AppShell>
}
