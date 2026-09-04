"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Bell, ChevronDown, Briefcase, User, Star, ArrowRight, Zap, MessageSquare } from "lucide-react"

import { useUserContext } from "@/contexts/UserContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { NotificationDropdown } from "@/components/NotificationDropdown"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NavItem } from "./nav-config"
import { MobileNavTrigger } from "./MobileNav"

const ROLE_META: Record<
  string,
  { text: string; icon: React.ReactNode }
> = {
  admin: { text: "Admin", icon: <User className="size-4" /> },
  freelancer: { text: "Freelancer", icon: <Briefcase className="size-4" /> },
  client: { text: "Client", icon: <User className="size-4" /> },
  expert: { text: "Expert", icon: <Star className="size-4" /> },
  both: { text: "Client & Freelancer", icon: <User className="size-4" /> },
}

export function AppHeader({
  navItems,
  footerItems,
  homeHref,
}: {
  navItems: NavItem[]
  footerItems: NavItem[]
  homeHref: string
}) {
  const { profile, isLoading, currentRole } = useUserContext()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [usage, setUsage] = useState<{ connects?: number; plan?: string } | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (currentRole === "freelancer" && profile?.email) {
      fetch(`/api/subscription?email=${profile.email}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) setUsage(result.data)
        })
        .catch((err) => console.error("Error fetching header usage:", err))
    }
  }, [currentRole, profile?.email, pathname])

  const displayName = profile.firstName || profile.email?.split("@")[0] || "User"
  const fullName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : displayName

  const roleMeta = ROLE_META[currentRole] ?? ROLE_META.client

  const handleRoleSwitch = (role: "client" | "freelancer" | "expert") => {
    router.push(`/${role}/dashboard`)
  }

  const handleDashboardClick = () => {
    router.push(homeHref)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      router.push("/login")
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNavTrigger navItems={navItems} footerItems={footerItems} homeHref={homeHref} />
      </div>

      <div className="flex items-center gap-3">
        {currentRole === "freelancer" && (
          <button
            onClick={() => router.push("/freelancer/subscription")}
            className="hidden items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 transition-colors hover:bg-warning/15 sm:flex"
          >
            <Zap className="size-3.5 fill-warning text-warning" />
            <span className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-warning">
                Connects
              </span>
              <span className="text-sm font-semibold text-foreground">
                {usage?.connects ?? "--"}
              </span>
            </span>
          </button>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => setShowNotifications((v) => !v)}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 sm:flex">
              {roleMeta.icon}
              {isLoading ? "Loading..." : roleMeta.text}
              <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Switch role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleRoleSwitch("client")}>
              <User className="size-4" /> Client dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleSwitch("freelancer")}>
              <Briefcase className="size-4" /> Freelancer dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleSwitch("expert")}>
              <Star className="size-4" /> Expert dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-secondary">
              {isLoading ? (
                <Skeleton className="size-8 rounded-full" />
              ) : (
                <Avatar className="size-8">
                  <AvatarImage src={profile.profileImage} alt={fullName} />
                  <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary-hover">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="hidden text-sm font-medium text-foreground md:inline">
                {isLoading ? "" : fullName}
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Avatar className="size-9">
                <AvatarImage src={profile.profileImage} alt={fullName} />
                <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary-hover">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDashboardClick}>
              <ArrowRight className="size-4" /> Go to dashboard
            </DropdownMenuItem>
            {currentRole === "freelancer" && (
              <DropdownMenuItem onClick={() => router.push("/freelancer/subscription")}>
                <Zap className="size-4 text-warning" /> Subscription plan
                {usage?.plan === "Premium" && (
                  <Badge className="ml-auto">Pro</Badge>
                )}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push(`/${currentRole}/profile`)}>
              <User className="size-4" /> Profile settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/${currentRole}/messages`)}>
              <MessageSquare className="size-4" /> Messages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
