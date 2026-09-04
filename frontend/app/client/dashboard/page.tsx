'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ProfileStatus from '@/components/ProfileStatus'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Wallet,
  Eye,
  MessageSquare,
  Briefcase,
  Users,
} from 'lucide-react'
import { useBookings, useJobProjects } from '@/hooks/useMarketplace'
import { formatMoney } from '@/lib/currency'

interface RecentBooking {
  id: string
  freelancer_name: string
  service_title: string
  amountLabel: string
  status: string
  created_at: string
  deadline: string
}

const JOB_DONE_STATUSES = new Set(['completed', 'paid'])
const JOB_ACTIVE_STATUSES = new Set(['assigned'])

export default function ClientDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [jobUserId, setJobUserId] = useState<string>('')
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (data.success && data.session) {
          setUserId(data.session.email)
          setJobUserId(data.session.userId || data.session.email)
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

  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookings(userId, 'client')
  const { projects: jobProjects, loading: jobProjectsLoading } = useJobProjects(jobUserId, 'client')

  const loading = bookingsLoading || jobProjectsLoading || !userId

  let totalSpentMinor = 0
  let activeProjects = 0
  let completedProjects = 0
  let pendingPaymentsMinor = 0

  for (const booking of bookings || []) {
    const isCompleted = booking.status === 'Completed'
    const isReleased = booking.payment_status === 'Released' || booking.payment_status === 'Paid' ||
      (isCompleted && (booking.payment_status === 'HeldInEscrow' || !booking.payment_status))

    if (isCompleted && isReleased) totalSpentMinor += Number(booking.total_minor || 0)
    if (booking.status === 'Active' || booking.status === 'Pending') activeProjects++
    if (isCompleted) completedProjects++
    if (booking.payment_status === 'HeldInEscrow' || booking.payment_status === 'Pending') {
      pendingPaymentsMinor += Number(booking.total_minor || 0)
    }
  }

  for (const project of jobProjects || []) {
    const status = (project.status || '').toLowerCase()
    if (JOB_DONE_STATUSES.has(status)) {
      totalSpentMinor += Number(project.budget_minor || 0)
      completedProjects++
    }
    if (JOB_ACTIVE_STATUSES.has(status)) {
      activeProjects++
      pendingPaymentsMinor += Number(project.budget_minor || 0)
    }
  }

  const jobPostsCount = jobProjects?.length || 0

  useEffect(() => {
    if (loading) return

    const bookingItems: RecentBooking[] = (bookings || []).map((booking) => ({
      id: booking.booking_id,
      freelancer_name: (booking as any).freelancer_name || booking.freelancer_id?.split('@')[0] || 'Freelancer',
      service_title: booking.service_title || 'Service',
      amountLabel: formatMoney(booking.total_minor),
      status: booking.status,
      created_at: String(booking.created_at),
      deadline: (booking as any).delivery_deadline ? String((booking as any).delivery_deadline) : '',
    }))

    const jobItems: RecentBooking[] = (jobProjects || []).map((project) => {
      const status = (project.status || '').toUpperCase()
      const label = status === 'COMPLETED' || status === 'PAID' ? 'Completed' : status === 'ASSIGNED' ? 'Active' : 'Pending'
      return {
        id: `job_${project.id}`,
        freelancer_name: project.freelancer_email || 'Unassigned',
        service_title: project.title,
        amountLabel: formatMoney(project.budget_minor, project.currency),
        status: label,
        created_at: project.createdAt,
        deadline: '',
      }
    })

    setRecentBookings(
      [...bookingItems, ...jobItems]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    )
  }, [bookings, jobProjects, loading])

  const handleBrowseServices = () => router.push('/client/browse-services')
  const handlePostJob = () => router.push('/client/post-job')
  const handleViewProjects = () => router.push('/client/projects')
  const handleViewJobPosts = () => router.push('/client/my-job-posts')

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

  if (bookingsError) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <EmptyState title="Error loading dashboard data" description={bookingsError} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        title="Dashboard"
        description="Manage your projects and find the perfect freelancers."
        actions={
          <>
            <Button variant="outline" onClick={handlePostJob}>
              Post a job
            </Button>
            <Button onClick={handleBrowseServices}>
              <Eye className="size-4" />
              Browse services
            </Button>
          </>
        }
      />

      <ProfileStatus />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total spent"
          value={formatMoney(totalSpentMinor)}
          icon={Wallet}
          trend={pendingPaymentsMinor > 0 ? `${formatMoney(pendingPaymentsMinor)} pending` : 'All caught up'}
        />
        <StatCard label="Active projects" value={activeProjects.toString()} icon={Briefcase} />
        <StatCard label="Completed projects" value={completedProjects.toString()} icon={Users} />
        <StatCard
          label="Job posts"
          value={jobPostsCount.toString()}
          icon={Plus}
          trend={
            <button onClick={handleViewJobPosts} className="font-medium text-primary hover:underline">
              Manage jobs
            </button>
          }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent projects</CardTitle>
          <Button variant="link" onClick={handleViewProjects} className="h-auto p-0">
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No recent projects"
              action={<Button onClick={handleBrowseServices}>Browse services</Button>}
            />
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate font-medium text-foreground">{booking.service_title}</h4>
                    <p className="text-sm text-muted-foreground">{booking.freelancer_name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{booking.amountLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const date = new Date(booking.created_at)
                        return isNaN(date.getTime()) ? 'Date not set' : date.toLocaleDateString()
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Button onClick={handleBrowseServices} variant="outline" className="h-20 flex-col gap-2">
              <Eye className="size-6" />
              <span>Browse services</span>
            </Button>
            <Button onClick={handlePostJob} variant="outline" className="h-20 flex-col gap-2">
              <Plus className="size-6" />
              <span>Post a job</span>
            </Button>
            <Button onClick={handleViewProjects} variant="outline" className="h-20 flex-col gap-2">
              <Briefcase className="size-6" />
              <span>My projects</span>
            </Button>
            <Button onClick={() => router.push('/client/chat')} variant="outline" className="h-20 flex-col gap-2">
              <MessageSquare className="size-6" />
              <span>Messages</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
