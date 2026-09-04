'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  Calendar,
  Star,
  Activity,
  PieChart,
  ChevronRight,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney, toMajorUnits } from '@/lib/currency'

const PIE_COLORS = ['#635BFF', '#5147E5', '#159A64', '#E99B24', '#DC4C4C']

type Booking = {
  booking_id: string
  status: string
  total_minor: number | string
  payment_status?: string
  created_at: number
  updated_at: number
  freelancer_rating?: number
}

type Service = {
  service_id: string
  main_category: string
}

export default function AnalyticsDashboard() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data?.success && data.session?.userId) {
          setUserId(data.session.userId)
          setUserEmail(data.session.email || null)
          return
        }

        const meResponse = await fetch('/api/auth/me')
        const meData = await meResponse.json()
        if (meData?.success && meData.session?.userId) {
          setUserId(meData.session.userId)
          setUserEmail(meData.session.email || null)
        } else {
          setError('Unable to determine authenticated freelancer.')
          setLoading(false)
        }
      } catch (sessionError) {
        console.error('Failed to load session:', sessionError)
        setError('Failed to load session information.')
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!userId) return
      setLoading(true)
      try {
        const bookingsRes = await fetch(
          `/api/marketplace/bookings?user_id=${encodeURIComponent(userId)}&user_type=freelancer&limit=200`,
        )
        const bookingsJson = await bookingsRes.json()
        if (bookingsJson.success) {
          setBookings(bookingsJson.data || [])
        } else {
          setError(bookingsJson.error || 'Failed to load bookings.')
        }

        if (userEmail) {
          const servicesRes = await fetch(
            `/api/marketplace/services?freelancer_email=${encodeURIComponent(userEmail)}&limit=200`,
          )
          const servicesJson = await servicesRes.json()
          if (servicesJson.success) {
            const visibleServices = (servicesJson.data || []).filter(
              (service: any) => service?.status !== 'Deleted',
            )
            setServices(visibleServices)
          } else {
            console.warn('Failed to load services:', servicesJson.error)
          }
        }
      } catch (analyticsError) {
        console.error('Analytics fetch error:', analyticsError)
        setError('Failed to load analytics data.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [userId, userEmail])

  const analytics = useMemo(() => {
    const completedStatuses = new Set(['Completed'])
    const activeStatuses = new Set(['Active', 'Pending'])

    let totalMinor = 0
    let activeProjects = 0
    let completedProjects = 0
    const ratings: number[] = []
    const earningsByMonth = new Map<string, number>()

    bookings.forEach((booking) => {
      if (completedStatuses.has(booking.status)) {
        completedProjects += 1
      }
      if (activeStatuses.has(booking.status)) {
        activeProjects += 1
      }

      const isCompleted = completedStatuses.has(booking.status)
      const isReleased = booking.payment_status === 'Released' || booking.payment_status === 'Paid' ||
        (isCompleted && (booking.payment_status === 'HeldInEscrow' || !booking.payment_status))

      const qualifiesForEarnings = isCompleted && isReleased

      if (qualifiesForEarnings) {
        const amount = Number(booking.total_minor || 0)
        totalMinor += amount
        const date = new Date(booking.updated_at || booking.created_at || Date.now())
        const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
        earningsByMonth.set(monthKey, (earningsByMonth.get(monthKey) || 0) + amount)
      }

      if (typeof booking.freelancer_rating === 'number') {
        ratings.push(booking.freelancer_rating)
      }
    })

    const totalEarningsMinor = totalMinor
    const totalBookings = bookings.length
    const completionRate = totalBookings > 0 ? (completedProjects / totalBookings) * 100 : 0
    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null
    const satisfaction = averageRating !== null ? (averageRating / 5) * 100 : null

    const earningsTrend = Array.from(earningsByMonth.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([month, value]) => {
        const date = new Date(`${month}-01T00:00:00Z`)
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        return { month: monthLabel, amount: toMajorUnits(value) }
      })

    const categoryCounts = services.reduce<Record<string, number>>((acc, service) => {
      if (service.main_category) {
        acc[service.main_category] = (acc[service.main_category] || 0) + 1
      }
      return acc
    }, {})

    const categoryDistribution = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalEarningsMinor,
      activeProjects,
      completedProjects,
      completionRate,
      averageRating,
      satisfaction,
      earningsTrend,
      categoryDistribution,
      totalServices: services.length,
    }
  }, [bookings, services])

  const pieSegments = useMemo(() => {
    if (!analytics.categoryDistribution.length || analytics.totalServices === 0) return null

    let startDeg = 0

    const segments = analytics.categoryDistribution.map(({ category, count }, idx) => {
      const fraction = count / analytics.totalServices
      const degrees = fraction * 360
      const segment = `${PIE_COLORS[idx % PIE_COLORS.length]} ${startDeg}deg ${startDeg + degrees}deg`
      startDeg += degrees
      return {
        category,
        count,
        percentage: (fraction * 100).toFixed(1),
        color: PIE_COLORS[idx % PIE_COLORS.length],
        segment,
      }
    })

    return {
      gradient: segments.map((item) => item.segment).join(', '),
      legend: segments.map(({ category, count, percentage, color }) => ({ category, count, percentage, color })),
    }
  }, [analytics.categoryDistribution, analytics.totalServices])

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

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-6 py-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  const maxEarning = Math.max(...analytics.earningsTrend.map((d) => d.amount), 1)

  return (
    <div className="p-6">
      <PageHeader title="Analytics" description="Real-time insights from your bookings and services." />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total earnings"
          value={formatMoney(analytics.totalEarningsMinor)}
          icon={TrendingUp}
          trend={`Across ${bookings.length} bookings`}
        />
        <StatCard
          label="Completed"
          value={analytics.completedProjects.toString()}
          icon={Calendar}
          trend={`${analytics.completionRate.toFixed(1)}% completion rate`}
        />
        <StatCard
          label="Client rating"
          value={analytics.averageRating !== null ? analytics.averageRating.toFixed(1) : 'N/A'}
          icon={Star}
          trend={analytics.satisfaction !== null ? `${analytics.satisfaction.toFixed(1)}% satisfaction` : 'Awaiting reviews'}
        />
        <StatCard
          label="Active projects"
          value={analytics.activeProjects.toString()}
          icon={Activity}
          trend="Currently in progress"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-heading text-h3 font-semibold text-foreground">Earnings overview</h2>
          <div className="relative h-64">
            {analytics.earningsTrend.length ? (
              <div className="absolute inset-0 flex items-end gap-3">
                {analytics.earningsTrend.map(({ month, amount }) => {
                  const height = Math.max(6, (amount / maxEarning) * 100)
                  return (
                    <div key={month} className="flex h-full w-full flex-col items-center justify-end text-xs text-muted-foreground">
                      <div className="w-full rounded-t-md bg-primary" style={{ height: `${height}%` }} />
                      <div className="mt-2">{month}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">${amount.toFixed(0)}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                No completed bookings yet. Earnings will appear once jobs are finished.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-heading text-h3 font-semibold text-foreground">Project categories</h2>
          <div className="flex h-64 flex-col justify-between gap-4">
            {analytics.categoryDistribution.length ? (
              analytics.categoryDistribution.map(({ category, count }) => {
                const percentage = analytics.totalServices ? (count / analytics.totalServices) * 100 : 0
                return (
                  <div key={category} className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="w-32 truncate">{category}</div>
                    <div className="flex-1 rounded bg-primary-soft">
                      <div className="h-5 rounded bg-primary" style={{ width: `${Math.max(6, percentage)}%` }} />
                    </div>
                    <div className="w-10 text-right font-medium text-foreground">{count}</div>
                  </div>
                )
              })
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                No services yet. Add services to see their distribution.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-heading text-h3 font-semibold text-foreground">Skills snapshot by category</h2>
          {pieSegments ? (
            <>
              <div className="flex h-64 items-center justify-center">
                <div
                  className="relative size-48 rounded-full shadow-inner"
                  style={{ background: `conic-gradient(${pieSegments.gradient})` }}
                >
                  <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface shadow-inner" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                {pieSegments.legend.map(({ category, count, percentage, color }) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: color }} />
                      <span>{category}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {count} ({percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <PieChart className="mb-3 size-10 text-muted-foreground" />
              No services to analyze yet.
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-heading text-h3 font-semibold text-foreground">Performance highlights</h2>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border-l-4 border-primary bg-primary-soft p-4">
              <h3 className="font-semibold text-primary-hover">Consistent delivery</h3>
              <p className="mt-1 text-muted-foreground">
                {analytics.completionRate.toFixed(1)}% of bookings reached completion. Keep up the steady delivery pace.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-warning bg-warning/10 p-4">
              <h3 className="font-semibold text-warning">Earnings growth</h3>
              <p className="mt-1 text-muted-foreground">
                You&apos;ve earned {formatMoney(analytics.totalEarningsMinor)} so far. Completing and releasing bookings will
                continue to grow this number.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-success bg-success/10 p-4">
              <h3 className="font-semibold text-success">Client sentiment</h3>
              <p className="mt-1 text-muted-foreground">
                {analytics.averageRating !== null
                  ? `Average rating of ${analytics.averageRating.toFixed(1)}/5 from clients.`
                  : 'No client ratings yet. Collect feedback to showcase reliability.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/freelancer/dashboard')}
          className="inline-flex items-center font-medium text-primary hover:underline"
        >
          Back to dashboard
          <ChevronRight className="ml-1 size-4" />
        </button>
      </div>
    </div>
  )
}
