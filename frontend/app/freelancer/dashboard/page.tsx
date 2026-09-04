'use client'
import React, { useState, useEffect } from 'react'
import ProfileStatus from '@/components/ProfileStatus'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wallet, FolderKanban, CheckCircle2, ListChecks, Plus, Star, Search, MessageSquare } from 'lucide-react'
import { useBookings, useJobProjects } from '@/hooks/useMarketplace'
import { getCurrentSession } from '@/lib/actions/auth'
import { formatMoney } from '@/lib/currency'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface RecentItem {
  id: string
  title: string
  amountLabel: string
  status: string
  from: string
  date: string
  rawDate: number
}

const JOB_ACTIVE_STATUSES = new Set(['assigned'])
const JOB_DONE_STATUSES = new Set(['completed', 'paid'])

export default function DashboardHome() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [jobUserId, setJobUserId] = useState<string>('')
  const [recentProjects, setRecentProjects] = useState<RecentItem[]>([])
  const [recentReviews, setRecentReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getCurrentSession()
        if (session) {
          if (session.email) setUserId(session.email)
          if (session.userId) setJobUserId(session.userId)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        router.push('/login')
      }
    }
    fetchSession()
  }, [router])

  const { projects: jobProjects, loading: jobProjectsLoading } = useJobProjects(jobUserId, 'freelancer')
  const { bookings, loading: bookingsLoading } = useBookings(userId, 'freelancer')

  const loading = bookingsLoading || jobProjectsLoading || !userId

  let totalEarningsMinor = 0
  let activeProjects = 0
  let completedProjects = 0
  let totalProjects = 0

  for (const booking of bookings || []) {
    if (booking.status === 'Completed') {
      totalEarningsMinor += Number(booking.total_minor || 0)
      completedProjects++
    }
    if (booking.status === 'Active' || booking.status === 'InProgress') activeProjects++
    if (booking.status !== 'Cancelled') totalProjects++
  }

  for (const project of jobProjects || []) {
    const status = (project.status || '').toLowerCase()
    if (JOB_DONE_STATUSES.has(status)) {
      totalEarningsMinor += Number(project.budget_minor || 0)
      completedProjects++
    }
    if (JOB_ACTIVE_STATUSES.has(status)) activeProjects++
    if (status !== 'closed') totalProjects++
  }

  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0

  useEffect(() => {
    if (loading) return

    const serviceItems: RecentItem[] = (bookings || []).map((b) => {
      const date = new Date(Number(b.created_at) || Date.now())
      const status = b.status === 'Completed' ? 'Completed' : b.status === 'Active' || b.status === 'InProgress' ? 'Active' : b.status
      return {
        id: b.booking_id,
        title: (b as any).service_title || (b as any).package_title || 'Service',
        amountLabel: formatMoney(b.total_minor),
        status,
        from: (b as any).client_name || b.client_id || 'Client',
        date: date.toLocaleDateString(),
        rawDate: date.getTime(),
      }
    })

    const jobItems: RecentItem[] = (jobProjects || []).map((p) => {
      const date = new Date(p.createdAt || Date.now())
      const status = (p.status || '').toLowerCase()
      const label = status === 'completed' || status === 'paid' ? 'Completed' : status === 'assigned' ? 'Active' : p.status
      return {
        id: p.id,
        title: p.title,
        amountLabel: formatMoney(p.budget_minor, p.currency || 'USD'),
        status: label,
        from: p.client_name || p.clientId,
        date: date.toLocaleDateString(),
        rawDate: date.getTime(),
      }
    })

    setRecentProjects([...serviceItems, ...jobItems].sort((a, b) => b.rawDate - a.rawDate).slice(0, 5))

    const reviews = (bookings || [])
      .filter((b) => (b as any).client_rating && (b as any).client_review)
      .sort((a, b) => Number((b as any).updated_at || b.created_at) - Number((a as any).updated_at || a.created_at))
      .slice(0, 3)
      .map((b) => ({
        id: b.booking_id,
        projectTitle: (b as any).service_title || 'Project',
        clientName: (b as any).client_name || b.client_id,
        rating: (b as any).client_rating,
        review: (b as any).client_review,
        date: new Date(Number((b as any).updated_at || b.created_at)).toLocaleDateString(),
      }))
    setRecentReviews(reviews)
  }, [bookings, jobProjects, loading])

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        title="Dashboard"
        description="Here's what's happening with your freelance work."
        actions={
          <Link href="/freelancer/add-service">
            <Button>
              <Plus className="size-4" />
              New service
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total earnings" value={formatMoney(totalEarningsMinor)} icon={Wallet} />
        <StatCard label="Active projects" value={activeProjects.toString()} icon={FolderKanban} />
        <StatCard label="Completed" value={`${completedProjects} (${completionRate}%)`} icon={CheckCircle2} />
        <StatCard label="Total projects" value={totalProjects.toString()} icon={ListChecks} />
      </div>

      <ProfileStatus />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-h2 font-semibold text-foreground">Recent projects</h2>
            <Link href="/freelancer/my-projects" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/freelancer/project-details/${project.id}`)}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-medium text-foreground">{project.title}</h3>
                    <div className="text-xs text-muted-foreground">From {project.from}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-medium text-foreground">{project.amountLabel}</span>
                    <StatusBadge status={project.status} />
                  </div>
                </button>
              ))
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create a service or apply to jobs to land your first project."
                action={
                  <Link href="/freelancer/add-service">
                    <Button>
                      <Plus className="size-4" />
                      Create your first service
                    </Button>
                  </Link>
                }
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {recentReviews.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-h3 font-semibold text-foreground">
                <Star className="size-4 fill-warning text-warning" />
                Recent reviews
              </h2>
              <div className="flex flex-col gap-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{review.projectTitle}</p>
                        <p className="text-xs text-muted-foreground">From {review.clientName}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-3.5 ${star <= review.rating ? 'fill-warning text-warning' : 'text-border'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{review.review}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 font-heading text-h3 font-semibold text-foreground">Quick actions</h2>
            <div className="flex flex-col gap-2">
              <Link href="/freelancer/browse-jobs">
                <Button variant="outline" className="w-full justify-start">
                  <Search className="size-4" />
                  Find new jobs
                </Button>
              </Link>
              <Link href="/freelancer/my-projects">
                <Button variant="outline" className="w-full justify-start">
                  <FolderKanban className="size-4" />
                  View active projects
                </Button>
              </Link>
              <Link href="/freelancer/messages">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="size-4" />
                  Check messages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
