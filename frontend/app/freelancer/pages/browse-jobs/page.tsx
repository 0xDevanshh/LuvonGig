'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Users,
  MessageSquare,
  Send,
  Clock,
  Star
} from 'lucide-react'

interface JobPost {
  id: string
  title: string
  description: string
  budget: number
  deadline: string
  category: string
  skills: string[]
  experience_level: string
  project_type: string
  timeline: string
  client_name: string
  client_rating: number
  client_reviews: number
  posted_date: string
  applications_count: number
}

export default function BrowseJobsPage() {
  const router = useRouter()
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [budgetFilter, setBudgetFilter] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')

  const categories = [
    'Web Development', 'Mobile Development', 'Design', 'Writing', 
    'Marketing', 'Data Science', 'DevOps', 'Other'
  ]

  const experienceLevels = ['Beginner', 'Intermediate', 'Expert']
  const budgetRanges = [
    { label: 'Under $1,000', value: '0-1000' },
    { label: '$1,000 - $5,000', value: '1000-5000' },
    { label: '$5,000 - $10,000', value: '5000-10000' },
    { label: 'Over $10,000', value: '10000+' }
  ]

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockJobPosts: JobPost[] = [
      {
        id: 'JP-001',
        title: 'Need a React developer for e-commerce site',
        description: 'Looking for an experienced React developer to build a modern e-commerce platform with payment integration. Must have experience with React, Node.js, and payment gateways.',
        budget: 5000,
        deadline: '2024-02-15',
        category: 'Web Development',
        skills: ['React', 'Node.js', 'MongoDB', 'Stripe', 'TypeScript'],
        experience_level: 'Expert',
        project_type: 'One-time',
        timeline: '1-2 months',
        client_name: 'TechCorp Inc.',
        client_rating: 4.8,
        client_reviews: 24,
        posted_date: '2024-01-15',
        applications_count: 12
      },
      {
        id: 'JP-002',
        title: 'UI/UX Design for Mobile App',
        description: 'Create beautiful and intuitive designs for a fitness tracking mobile application. Need someone with strong mobile design experience.',
        budget: 3000,
        deadline: '2024-02-01',
        category: 'Design',
        skills: ['Figma', 'UI/UX', 'Mobile Design', 'Prototyping', 'Adobe XD'],
        experience_level: 'Intermediate',
        project_type: 'One-time',
        timeline: '3-4 weeks',
        client_name: 'FitLife App',
        client_rating: 4.6,
        client_reviews: 18,
        posted_date: '2024-01-10',
        applications_count: 8
      },
      {
        id: 'JP-003',
        title: 'Content Writing for Tech Blog',
        description: 'Need a technical writer to create engaging content for our technology blog. Focus on AI, machine learning, and web development topics.',
        budget: 1500,
        deadline: '2024-01-25',
        category: 'Writing',
        skills: ['Technical Writing', 'SEO', 'AI/ML', 'Web Development'],
        experience_level: 'Intermediate',
        project_type: 'Ongoing',
        timeline: '2-3 weeks',
        client_name: 'TechBlog Media',
        client_rating: 4.9,
        client_reviews: 31,
        posted_date: '2024-01-08',
        applications_count: 15
      }
    ]
    
    setTimeout(() => {
      setJobPosts(mockJobPosts)
      setLoading(false)
    }, 1000)
  }, [])

  const handleContactClient = (jobId: string) => {
    // TODO: Implement contact functionality
    alert('Contact feature coming soon!')
  }

  const handleSubmitProposal = (jobId: string) => {
    router.push(`/freelancer/submit-proposal/${jobId}`)
  }

  const filteredJobs = jobPosts.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !categoryFilter || job.category === categoryFilter
    const matchesExperience = !experienceFilter || job.experience_level === experienceFilter
    const matchesBudget = !budgetFilter || (
      budgetFilter === '0-1000' && job.budget < 1000 ||
      budgetFilter === '1000-5000' && job.budget >= 1000 && job.budget <= 5000 ||
      budgetFilter === '5000-10000' && job.budget > 5000 && job.budget <= 10000 ||
      budgetFilter === '10000+' && job.budget > 10000
    )
    
    return matchesSearch && matchesCategory && matchesExperience && matchesBudget
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Browse Job Posts</h1>
        <p className="text-gray-600">Find projects that match your skills and interests</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search jobs, skills, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Experience Levels</option>
            {experienceLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Budget Ranges</option>
            {budgetRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Posts */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">
            {searchTerm || categoryFilter || experienceFilter || budgetFilter
              ? 'Try adjusting your search criteria' 
              : 'No job posts available at the moment'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{job.category}</Badge>
                      <Badge variant="secondary">{job.experience_level}</Badge>
                      <Badge variant="outline">{job.project_type}</Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{job.client_name}</span>
                      <div className="flex items-center ml-2">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{job.client_rating}</span>
                        <span className="ml-1">({job.client_reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${job.budget.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{job.timeline}</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                
                {/* Skills */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Posted {new Date(job.posted_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{job.applications_count} proposals</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => handleContactClient(job.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Client
                  </Button>
                  <Button 
                    onClick={() => handleSubmitProposal(job.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{filteredJobs.length}</p>
            <p className="text-sm text-gray-600">Available Jobs</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              ${filteredJobs.reduce((sum, job) => sum + job.budget, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Budget</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {filteredJobs.filter(job => job.experience_level === 'Intermediate').length}
            </p>
            <p className="text-sm text-gray-600">Intermediate Level</p>
          </div>
        </div>
      </div>
    </div>
  )
}

