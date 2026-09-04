'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import {
  Plus,
  X,
  DollarSign,
  Tag,
  FileText,
  Save,
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
    budgetType: 'fixed' as 'fixed' | 'hourly',
    skills: [] as string[],
  })
  const [newSkill, setNewSkill] = useState('')

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
      await getUserProfileByEmail(profile.email)

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
        budget_type: formData.budgetType,
        budget_minor: toMinorUnits(budgetFloat),
      })

      router.push('/client/my-job-posts')
    } catch (error) {
      console.error('Error posting job:', error)
      alert(error instanceof Error ? error.message : 'Failed to post job. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <PageHeader title="Post a job" description="Describe your project and find the perfect freelancer." />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 size-5 text-primary" />
                Project details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Job title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Need a React developer for e-commerce site"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Project description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your project in detail..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="budget">Budget (USD) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      placeholder="1000.00"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Budget type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.budgetType === 'fixed' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setFormData((prev) => ({ ...prev, budgetType: 'fixed' }))}
                    >
                      Fixed price
                    </Button>
                    <Button
                      type="button"
                      variant={formData.budgetType === 'hourly' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setFormData((prev) => ({ ...prev, budgetType: 'hourly' }))}
                    >
                      Hourly
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="mr-2 size-5 text-primary" />
                Skills required
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
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button type="button" onClick={handleAddSkill} variant="outline">
                    <Plus className="size-4" />
                  </Button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)} aria-label={`Remove ${skill}`}>
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">
                  {formData.title || 'Your job title will appear here'}
                </h3>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {formData.description || 'Project description will appear here...'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget: ${formData.budget || '0'}</span>
                  <span className="text-muted-foreground capitalize">{formData.budgetType}</span>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {formData.skills.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{formData.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips for better results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>&bull; Be specific about your requirements</p>
              <p>&bull; Include a realistic budget</p>
              <p>&bull; Add relevant skills and technologies</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12 flex justify-end gap-4 border-t border-border pt-8">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.title || !formData.description || !formData.budget}
        >
          {isSubmitting ? (
            <>
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Posting job...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Post job
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
