'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUserContext } from '@/contexts/UserContext'
import { JobPost } from '@/types/job-post'
import { getUserProfileByEmail } from '@/lib/user-profile'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  MessageSquare,
  Calendar,
  DollarSign,
  MoreHorizontal
} from 'lucide-react'

export default function MyJobPostsPage() {
  const router = useRouter()
  const { profile } = useUserContext()
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch job posts from API
  const fetchJobPosts = async () => {
    if (!profile?.email) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      // Get the true userId if it exists in the profile service
      const userProfileData = await getUserProfileByEmail(profile.email)
      const clientId = userProfileData.userId || profile.email

      console.log('🔍 Fetching jobs for client identity:', clientId)
      const response = await fetch(`/api/marketplace/job-posts?client_id=${clientId}`)
      const result = await response.json()
      console.log('📦 API Response result:', result)

      if (result.success) {
        console.log('✅ Found', result.data?.length, 'jobs')
        // Map canister data to UI format
        const mappedJobs = result.data.map((job: any) => {
          console.log('📄 Processing job:', job.id, 'with clientId:', job.clientId)
          const statusKey = Object.keys(job.status)[0]
          let uiStatus = 'Open'
          if (statusKey === 'CLOSED') uiStatus = 'Closed'
          if (statusKey === 'ASSIGNED') uiStatus = 'Assigned'

          return {
            job_id: job.id,
            title: job.title,
            description: job.description,
            status: uiStatus,
            category: 'Software',
            budget: Number(job.budgetAmount) / 100000000,
            timeline: 'TBD',
            experience_level: 'Intermediate',
            project_type: 'Fixed',
            skills: job.requiredSkills || [],
            applications_count: job.applicationCount || 0,
            created_at: Number(job.createdAt) / 1e6
          }
        })
        setJobPosts(mappedJobs)
        setError(null)
      } else {
        console.error('❌ API Error:', result.error)
        setError(result.error || 'Failed to fetch job posts')
      }
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

  const handleCreateJob = () => {
    router.push('/client/create-job-post')
  }

  const handleEditJob = (jobId: string) => {
    router.push(`/client/edit-job/${jobId}`)
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job post?')) {
      return
    }

    if (!profile?.email) {
      alert('User not authenticated')
      return
    }

    try {
      const response = await fetch(`/api/marketplace/job-posts/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.email
        })
      })

      const result = await response.json()

      if (result.success) {
        // Remove job from local state
        setJobPosts(prev => prev.filter(job => job.job_id !== jobId))
      } else {
        alert(`Error deleting job post: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting job post:', error)
      alert('Failed to delete job post. Please try again.')
    }
  }

  const handleViewApplications = (jobId: string) => {
    router.push(`/client/job-applications/${jobId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800'
      case 'Assigned': return 'bg-purple-100 text-purple-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredJobs = jobPosts.filter(job =>
    !statusFilter || job.status === statusFilter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchJobPosts} variant="outline">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Posts</h1>
          <p className="text-gray-600">Manage your job postings and applications</p>
        </div>
        <Button onClick={handleCreateJob} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Job Posts Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No job posts found</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter
              ? 'No jobs match your current filter'
              : 'Create your first job post to start hiring'
            }
          </p>
          {!statusFilter && (
            <Button onClick={handleCreateJob} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <Card key={job.job_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      <span className="text-sm text-gray-600">{job.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {job.description}
                </p>

                {/* Job Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>{job.budget.toFixed(5)} ICP</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{job.timeline}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{job.experience_level} level</span>
                    <span className="text-gray-600">{job.project_type}</span>
                  </div>
                </div>

                {/* Skills */}
                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Applications */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{job.applications_count} applications</span>
                  </div>
                  <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewApplications(job.job_id)}
                    className="flex-1"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    View Applications
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditJob(job.job_id)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteJob(job.job_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {filteredJobs.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredJobs.length}</p>
              <p className="text-sm text-gray-600">Total Jobs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredJobs.filter(j => j.status === 'Open').length}
              </p>
              <p className="text-sm text-gray-600">Open Jobs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {filteredJobs.reduce((sum, j) => sum + j.applications_count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Applications</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {filteredJobs.reduce((sum, j) => sum + j.budget, 0).toFixed(5)} ICP
              </p>
              <p className="text-sm text-gray-600">Total Budget</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
