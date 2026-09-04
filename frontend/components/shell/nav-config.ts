import type { LucideIcon } from "lucide-react"
import {
  LayoutGrid,
  Search,
  List,
  Briefcase,
  MessageSquare,
  Trophy,
  Zap,
  User,
  Settings,
  PlusCircle,
  Users,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const freelancerNav: NavItem[] = [
  { label: "Home", href: "/freelancer/dashboard", icon: LayoutGrid },
  { label: "Find Jobs", href: "/freelancer/browse-jobs", icon: Search },
  { label: "My Services", href: "/freelancer/my-services", icon: List },
  { label: "My Projects", href: "/freelancer/my-projects", icon: Briefcase },
  { label: "Messages", href: "/freelancer/messages", icon: MessageSquare },
  { label: "Find Experts", href: "/experts", icon: Users },
  { label: "Hackathons", href: "/freelancer/hackathons", icon: Trophy },
  { label: "Subscription", href: "/freelancer/subscription", icon: Zap },
]

export const freelancerNavFooter: NavItem[] = [
  { label: "Profile", href: "/freelancer/profile", icon: User },
  { label: "Settings", href: "/freelancer/settings", icon: Settings },
]

export const clientNav: NavItem[] = [
  { label: "Home", href: "/client/dashboard", icon: LayoutGrid },
  { label: "Find Talent", href: "/experts", icon: Users },
  { label: "Browse Services", href: "/client/browse-services", icon: Search },
  { label: "Post a Job", href: "/client/post-job", icon: PlusCircle },
  { label: "My Job Posts", href: "/client/my-job-posts", icon: List },
  { label: "Projects", href: "/client/projects", icon: Briefcase },
  { label: "Messages", href: "/client/chat", icon: MessageSquare },
  { label: "Hackathons", href: "/client/hackathons", icon: Trophy },
]

export const clientNavFooter: NavItem[] = [
  { label: "Profile", href: "/client/profile", icon: User },
  { label: "Settings", href: "/client/settings", icon: Settings },
]

/** Small set surfaced in the mobile bottom bar; the rest live in the drawer. */
export const freelancerMobilePrimary: NavItem[] = [
  freelancerNav[0],
  freelancerNav[1],
  freelancerNav[4],
  freelancerNavFooter[0],
]

export const clientMobilePrimary: NavItem[] = [
  clientNav[0],
  clientNav[3],
  clientNav[6],
  clientNavFooter[0],
]
