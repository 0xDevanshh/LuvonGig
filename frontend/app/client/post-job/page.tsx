'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  X,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Save,
  AlertCircle
} from 'lucide-react'
import { createJob } from '@/lib/api/jobs'
import { toMinorUnits } from '@/lib/currency'
import { useUserContext } from '@/contexts/UserContext'
import { getUserProfileByEmail } from '@/lib/user-profile'

export default function PostJobPage() {
  const router = useRouter()
  const { profile } = useUserContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    budgetType: 'FIXED', // Default to FIXED
    deadline: '',
    category: '',
    skills: [] as string[],
    experience_level: 'Intermediate',
    project_type: 'One-time',
    timeline: '1-2 weeks'
  })
  const [newSkill, setNewSkill] = useState('')

  const categories = [
    'Web Development', 'Mobile Development', 'Design', 'Writing',
    'Marketing', 'Data Science', 'DevOps', 'Other'
  ]

  const experienceLevels = ['Beginner', 'Intermediate', 'Expert']
  const projectTypes = ['One-time', 'Ongoing', 'Long-term']
  const timelines = ['1-2 weeks', '1 month', '2-3 months', '3+ months']

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.budget) {
      alert('Please fill in all required fields')
      return
    }

    if (!profile.email) {
      alert('You must be logged in to post a job')
      return
    }

    setIsSubmitting(true)

    try {
      // Get the actual userId from the user profile service
      const userProfileData = await getUserProfileByEmail(profile.email)
      const clientId = userProfileData.userId || profile.email

      const budgetFloat = parseFloat(formData.budget)
      if (isNaN(budgetFloat)) {
        throw new Error('Invalid budget amount')
      }

      // Minor units, not e8s. The poster is the session — `clientId` is no
      // longer sent, because the API would ignore it: a caller-supplied user
      // id is what let anyone post as anyone else.
      await createJob({
        title: formData.title,
        description: formData.description,
        required_skills: formData.skills,
        budget_type: formData.budgetType === 'FIXED' ? 'fixed' : 'hourly',
        budget_minor: toMinorUnits(budgetFloat),
      })

      // createJob throws on failure, so reaching here means it worked. The
      // canister returned a Result variant instead, hence the old
      // `if ('ok' in result)` branch.
      alert('Job posted successfully')
      router.push('/client/my-job-posts')
    } catch (error) {
      console.error('Error posting job:', error)
      alert(error instanceof Error ? error.message : 'Failed to post job. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Job</h1>
        <p className="text-gray-600">Describe your project and find the perfect freelancer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Need a React developer for e-commerce site"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your project in detail..."
                  rows={6}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      step="0.00001"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      placeholder="1000.00001"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline
                  </label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Required */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Skills Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g., React, Python, Design)"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <Button onClick={handleAddSkill} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => handleInputChange('experience_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {projectTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {timelines.map(timeline => (
                    <option key={timeline} value={timeline}>{timeline}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">
                  {formData.title || 'Your job title will appear here'}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {formData.description || 'Project description will appear here...'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Budget: ${formData.budget || '0'}</span>
                  <span className="text-gray-600">{formData.timeline}</span>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {formData.skills.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{formData.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips for better results</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Be specific about your requirements</p>
              <p>• Include a realistic budget range</p>
              <p>• Mention your preferred timeline</p>
              <p>• Add relevant skills and technologies</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 mt-12 pt-8 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.title || !formData.description || !formData.budget}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Posting Job...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Post Job
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

