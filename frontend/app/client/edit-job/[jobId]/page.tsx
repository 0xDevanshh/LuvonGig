'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    X,
    DollarSign,
    Tag,
    FileText,
    Save,
    Loader2
} from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import { getUserProfileByEmail } from '@/lib/user-profile'

export default function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const jobId = resolvedParams.jobId
    const { profile } = useUserContext()

    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        budgetType: 'FIXED',
        skills: [] as string[],
        category: '',
        experience_level: 'Intermediate',
        project_type: 'One-time',
        timeline: '1-2 weeks'
    })
    const [newSkill, setNewSkill] = useState('')

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await fetch(`/api/marketplace/job-posts/${jobId}`)
                const result = await response.json()
                if (result.success) {
                    const job = result.data
                    setFormData({
                        title: job.title,
                        description: job.description,
                        budget: job.budgetAmount.toString(),
                        budgetType: job.budgetType.HOURLY !== undefined ? 'HOURLY' : 'FIXED',
                        skills: job.requiredSkills || [],
                        category: 'Software',
                        experience_level: 'Intermediate',
                        project_type: 'One-time',
                        timeline: 'TBD'
                    })
                } else {
                    alert('Failed to fetch job details: ' + result.error)
                }
            } catch (err) {
                console.error('Error fetching job:', err)
            } finally {
                setLoading(false)
            }
        }

        if (jobId) fetchJob()
    }, [jobId])

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

        if (!profile?.email) {
            alert('You must be logged in')
            return
        }

        setIsSubmitting(true)

        try {
            const userProfileData = await getUserProfileByEmail(profile.email)
            const clientId = userProfileData.userId || profile.email

            const response = await fetch(`/api/marketplace/job-posts/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: clientId,
                    updates: {
                        title: formData.title,
                        description: formData.description,
                        requiredSkills: formData.skills,
                        budgetType: formData.budgetType === 'HOURLY' ? { HOURLY: null } : { FIXED: null },
                        budgetAmount: formData.budget // Sending as string, API will handle conversion to BigInt e8s
                    }
                })
            })

            const result = await response.json()

            if (result.success) {
                alert('Job updated successfully!')
                router.push('/client/my-job-posts')
            } else {
                alert('Failed to update job: ' + result.error)
            }
        } catch (error) {
            console.error('Error updating job:', error)
            alert('Failed to update job')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Job Post</h1>
                <p className="text-gray-600">Update your project details</p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Project Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Job Title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={6}
                                placeholder="Project Description"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Budget *</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        step="0.00001"
                                        value={formData.budget}
                                        onChange={(e) => handleInputChange('budget', e.target.value)}
                                        className="pl-10"
                                        placeholder="1000.00001"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Type</label>
                                <select
                                    value={formData.budgetType}
                                    onChange={(e) => handleInputChange('budgetType', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    <option value="FIXED">Fixed Price</option>
                                    <option value="HOURLY">Hourly Rate</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Tag className="w-5 h-5 mr-2" />
                            Skills Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add a skill"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                            />
                            <Button onClick={handleAddSkill} variant="outline">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="gap-1 text-sm">
                                    {skill}
                                    <button onClick={() => handleRemoveSkill(skill)} className="ml-1 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
