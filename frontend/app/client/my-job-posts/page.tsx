'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserContext } from '@/contexts/UserContext'
import { getUserProfileByEmail } from '@/lib/user-profile'
import { listJobs, type Job } from '@/lib/api/jobs'
import { formatMoney } from '@/lib/currency'
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Briefcase,
} from 'lucide-react'

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export default function MyJobPostsPage() {
  const router = useRouter()
  const { profile } = useUserContext()
  const [jobPosts, setJobPosts] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchJobPosts = async () => {
    if (!profile?.email) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      const userProfileData = await getUserProfileByEmail(profile.email)
      const clientId = userProfileData.userId || profile.email

      const { jobs } = await listJobs({ clientId, limit: 100 })
      setJobPosts(jobs)
      setError(null)
    } catch (error) {
      console.error('Error fetching job posts:', error)
      setError('Failed to fetch job posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobPosts()
  }, [profile?.email])

  const handleCreateJob = () => router.push('/client/post-job')
  const handleEditJob = (jobId: string) => router.push(`/client/edit-job/${jobId}`)

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job post?')) return

    try {
      const response = await fetch(`/api/marketplace/job-posts/${jobId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.email }),
      })
      const result = await response.json()

      if (result.success) {
        setJobPosts((prev) => prev.filter((job) => job.id !== jobId))
      } else {
        alert(`Error deleting job post: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting job post:', error)
      alert('Failed to delete job post. Please try again.')
    }
  }

  const handleViewApplications = (jobId: string) => router.push(`/client/job-applications/${jobId}`)

  const filteredJobs = jobPosts.filter((job) => !statusFilter || job.status === statusFilter)

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <EmptyState title={error} action={<Button onClick={fetchJobPosts} variant="outline">Try again</Button>} />
      </div>
    )
  }

  const totalBudgetMinor = filteredJobs.reduce((sum, j) => sum + Number(j.budget_minor || 0), 0)
  const totalApplications = filteredJobs.reduce((sum, j) => sum + (j.proposal_count || 0), 0)

  return (
    <div className="p-6">
      <PageHeader
        title="My job posts"
        description="Manage your job postings and applications."
        actions={
          <Button onClick={handleCreateJob}>
            <Plus className="size-4" />
            Post new job
          </Button>
        }
      />

      <div className="mt-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All status</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="COMPLETED">Completed</option>
          <option value="PAID">Paid</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="mt-6">
        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No job posts found"
            description={statusFilter ? 'No jobs match your current filter.' : 'Create your first job post to start hiring.'}
            action={
              !statusFilter ? (
                <Button onClick={handleCreateJob}>
                  <Plus className="size-4" />
                  Post your first job
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="line-clamp-2 text-base">{job.title}</CardTitle>
                      <div className="mt-1.5 flex items-center gap-2">
                        <StatusBadge status={titleCase(job.status)} />
                        <span className="text-sm text-muted-foreground">{titleCase(job.budgetType)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{job.description}</p>

                  <div className="mb-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="size-4" />
                      <span>{formatMoney(job.budget_minor, job.currency)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {job.requiredSkills.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {job.requiredSkills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{job.requiredSkills.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    <span>{job.proposal_count} proposal{job.proposal_count === 1 ? '' : 's'}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewApplications(job.id)} className="flex-1">
                      <Users className="size-4" />
                      Proposals
                    </Button>
                    {job.status === 'OPEN' && (
                      <Button variant="outline" size="sm" onClick={() => handleEditJob(job.id)} className="flex-1">
                        <Edit className="size-4" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {filteredJobs.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total jobs" value={filteredJobs.length.toString()} />
          <StatCard label="Open jobs" value={filteredJobs.filter((j) => j.status === 'OPEN').length.toString()} />
          <StatCard label="Total proposals" value={totalApplications.toString()} />
          <StatCard label="Total budget" value={formatMoney(totalBudgetMinor)} />
        </div>
      )}
    </div>
  )
}
