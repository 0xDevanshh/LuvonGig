'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  TrendingUp,
  BarChart2,
  PieChart,
  ChevronRight,
} from 'lucide-react'

const ICP_TO_USD = 10
const E8S_PER_ICP = 100_000_000

const convertE8sToUsd = (e8s: number) =>
  (Number(e8s || 0) / E8S_PER_ICP) * ICP_TO_USD

const PIE_COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f97316', '#22c55e']

type Booking = {
  booking_id: string
  status: string
  total_amount_e8s: number
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
          `/api/marketplace/bookings?user_id=${encodeURIComponent(
            userId,
          )}&user_type=freelancer&limit=200`,
        )
        const bookingsJson = await bookingsRes.json()
        if (bookingsJson.success) {
          setBookings(bookingsJson.data || [])
        } else {
          setError(bookingsJson.error || 'Failed to load bookings.')
        }

        if (userEmail) {
          const servicesRes = await fetch(
            `/api/marketplace/services?freelancer_email=${encodeURIComponent(
              userEmail,
            )}&limit=200`,
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
    const activeStatuses = new Set(['InProgress', 'Pending'])
    const earningsStatuses = new Set(['Completed', 'Released'])

    let totalE8s = 0
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

      // Only count earnings when payment is actually released
      const isCompleted = completedStatuses.has(booking.status)
      const isReleased = booking.payment_status === 'Released' || booking.payment_status === 'Paid' ||
        (isCompleted && (booking.payment_status === 'HeldInEscrow' || !booking.payment_status))

      const qualifiesForEarnings = isCompleted && isReleased

      if (qualifiesForEarnings) {
        totalE8s += Number(booking.total_amount_e8s || 0)
        const date = new Date(
          booking.updated_at || booking.created_at || Date.now(),
        )
        const monthKey = `${date.getUTCFullYear()}-${String(
          date.getUTCMonth() + 1,
        ).padStart(2, '0')}`
        earningsByMonth.set(
          monthKey,
          (earningsByMonth.get(monthKey) || 0) +
          Number(booking.total_amount_e8s || 0),
        )
      }

      if (typeof booking.freelancer_rating === 'number') {
        ratings.push(booking.freelancer_rating)
      }
    })

    const totalEarningsUsd = convertE8sToUsd(totalE8s)
    const totalBookings = bookings.length
    const completionRate =
      totalBookings > 0 ? (completedProjects / totalBookings) * 100 : 0
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null
    const satisfaction =
      averageRating !== null ? (averageRating / 5) * 100 : null

    const earningsTrend = Array.from(earningsByMonth.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([month, value]) => {
        const date = new Date(`${month}-01T00:00:00Z`)
        const monthLabel = date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        })
        return {
          month: monthLabel,
          amount: convertE8sToUsd(value),
        }
      })

    const categoryCounts = services.reduce<Record<string, number>>(
      (acc, service) => {
        if (service.main_category) {
          acc[service.main_category] = (acc[service.main_category] || 0) + 1
        }
        return acc
      },
      {},
    )

    const categoryDistribution = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalEarningsUsd,
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
    if (!analytics.categoryDistribution.length || analytics.totalServices === 0)
      return null

    let startDeg = 0

    const segments = analytics.categoryDistribution.map(
      ({ category, count }, idx) => {
        const fraction = count / analytics.totalServices
        const degrees = fraction * 360
        const segment = `${PIE_COLORS[idx % PIE_COLORS.length]} ${startDeg}deg ${startDeg + degrees
          }deg`
        startDeg += degrees
        return {
          category,
          count,
          percentage: (fraction * 100).toFixed(1),
          color: PIE_COLORS[idx % PIE_COLORS.length],
          segment,
        }
      },
    )

    return {
      gradient: segments.map((item) => item.segment).join(', '),
      legend: segments.map(({ category, count, percentage, color }) => ({
        category,
        count,
        percentage,
        color,
      })),
    }
  }, [analytics.categoryDistribution, analytics.totalServices])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600">
              Real-time insights from your bookings and services
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex justify-between">
                <div className="text-sm text-gray-500">Total Earnings</div>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <div className="mb-1 flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 1V23"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-xl font-bold">
                  ${analytics.totalEarningsUsd.toFixed(2)}
                </h3>
              </div>
              <div className="text-xs text-gray-500">
                Across {bookings.length} bookings
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex justify-between">
                <div className="text-sm text-gray-500">Completed</div>
                <Calendar size={14} className="text-green-500" />
              </div>
              <div className="mb-1 flex items-center gap-2">
                <Calendar size={20} className="text-gray-700" />
                <h3 className="text-xl font-bold">
                  {analytics.completedProjects}
                </h3>
              </div>
              <div className="text-xs text-gray-500">
                {analytics.completionRate.toFixed(1)}% completion rate
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex justify-between">
                <div className="text-sm text-gray-500">Client Rating</div>
                <BarChart2 size={14} className="text-green-500" />
              </div>
              <div className="mb-1 flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-xl font-bold">
                  {analytics.averageRating !== null
                    ? analytics.averageRating.toFixed(1)
                    : 'N/A'}
                </h3>
              </div>
              <div className="text-xs text-gray-500">
                {analytics.satisfaction !== null
                  ? `${analytics.satisfaction.toFixed(1)}% satisfaction`
                  : 'Awaiting reviews'}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex justify-between">
                <div className="text-sm text-gray-500">Active Projects</div>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <div className="mb-1 flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-xl font-bold">
                  {analytics.activeProjects}
                </h3>
              </div>
              <div className="text-xs text-gray-500">
                Currently in progress
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                Earning Overview
              </h2>
              <div className="relative h-64">
                {analytics.earningsTrend.length ? (
                  <div className="absolute inset-0 flex items-end gap-3">
                    {analytics.earningsTrend.map(({ month, amount }) => {
                      const max = Math.max(
                        ...analytics.earningsTrend.map((d) => d.amount),
                        1,
                      )
                      const height = Math.max(
                        6,
                        (amount / max) * 100,
                      )
                      return (
                        <div
                          key={month}
                          className="flex h-full w-full flex-col items-center justify-end text-xs text-gray-500"
                        >
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-pink-500 to-pink-300"
                            style={{ height: `${height}%` }}
                          ></div>
                          <div className="mt-2">{month}</div>
                          <div className="mt-1 text-[10px] text-gray-400">
                            ${amount.toFixed(0)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No completed bookings yet. Earnings will appear once jobs are
                    finished.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                Project Categories
              </h2>
              <div className="flex h-64 flex-col justify-between gap-4">
                {analytics.categoryDistribution.length ? (
                  analytics.categoryDistribution.map(({ category, count }) => {
                    const percentage = analytics.totalServices
                      ? (count / analytics.totalServices) * 100
                      : 0
                    return (
                      <div
                        key={category}
                        className="flex items-center gap-4 text-sm text-gray-600"
                      >
                        <div className="w-32">{category}</div>
                        <div className="flex-1 rounded bg-blue-100">
                          <div
                            className="h-5 rounded bg-blue-500"
                            style={{ width: `${Math.max(6, percentage)}%` }}
                          ></div>
                        </div>
                        <div className="w-10 text-right font-medium">
                          {count}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No services yet. Add services to see their distribution.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                Skills Snapshot (by Service Category)
              </h2>
              {pieSegments ? (
                <>
                  <div className="flex h-64 items-center justify-center">
                    <div
                      className="relative h-48 w-48 rounded-full border border-purple-200 shadow-inner"
                      style={{ background: `conic-gradient(${pieSegments.gradient})` }}
                    >
                      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white shadow-inner"></div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                    {pieSegments.legend.map(({ category, count, percentage, color }) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{ backgroundColor: color }}
                          ></span>
                          <span>{category}</span>
                        </div>
                        <span className="font-medium">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center text-sm text-gray-500">
                  <PieChart className="mb-3 h-10 w-10 text-purple-400" />
                  No services to analyse yet.
                </div>
              )}
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">
                Performance Highlights
              </h2>
              <div className="space-y-6 text-sm text-gray-600">
                <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-700">
                    Consistent Delivery
                  </h3>
                  <p className="mt-1">
                    {analytics.completionRate.toFixed(1)}% of bookings reached
                    completion. Keep up the steady delivery pace.
                  </p>
                </div>
                <div className="rounded border-l-4 border-orange-500 bg-orange-50 p-4">
                  <h3 className="font-semibold text-orange-700">
                    Earnings Growth
                  </h3>
                  <p className="mt-1">
                    You&apos;ve earned ${analytics.totalEarningsUsd.toFixed(2)}{' '}
                    so far. Completing and releasing bookings will continue to
                    grow this number.
                  </p>
                </div>
                <div className="rounded border-l-4 border-purple-500 bg-purple-50 p-4">
                  <h3 className="font-semibold text-purple-700">
                    Client Sentiment
                  </h3>
                  <p className="mt-1">
                    {analytics.averageRating !== null
                      ? `Average rating of ${analytics.averageRating.toFixed(
                        1,
                      )}/5 from clients.`
                      : 'No client ratings yet. Collect feedback to showcase reliability.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/freelancer/dashboard')}
              className="inline-flex items-center font-medium text-purple-600"
            >
              Back to Dashboard
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}