import React from 'react'

import { AppShell } from '@/components/shell/AppShell'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({
  children,
}: ClientLayoutProps) {
  return <AppShell role="client">{children}</AppShell>
}
