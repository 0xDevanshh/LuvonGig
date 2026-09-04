"use client"

import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { MobileBottomNav } from "./MobileNav"
import {
  freelancerNav,
  freelancerNavFooter,
  freelancerMobilePrimary,
  clientNav,
  clientNavFooter,
  clientMobilePrimary,
} from "./nav-config"

const SHELL_CONFIG = {
  freelancer: {
    navItems: freelancerNav,
    footerItems: freelancerNavFooter,
    mobilePrimaryItems: freelancerMobilePrimary,
    homeHref: "/freelancer/dashboard",
  },
  client: {
    navItems: clientNav,
    footerItems: clientNavFooter,
    mobilePrimaryItems: clientMobilePrimary,
    homeHref: "/client/dashboard",
  },
} as const

export function AppShell({
  role,
  children,
}: {
  role: keyof typeof SHELL_CONFIG
  children: React.ReactNode
}) {
  const { navItems, footerItems, mobilePrimaryItems, homeHref } = SHELL_CONFIG[role]

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar navItems={navItems} footerItems={footerItems} homeHref={homeHref} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader navItems={navItems} footerItems={footerItems} homeHref={homeHref} />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
      </div>
      <MobileBottomNav items={mobilePrimaryItems} />
    </div>
  )
}
