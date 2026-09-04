'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import {
    X,
    DollarSign,
    Tag,
    FileText,
    Save,
    Loader2
} from 'lucide-react'
import { getJob, updateJob } from '@/lib/api/jobs'
import { formatMoney, toMajorUnits, toMinorUnits } from '@/lib/currency'

export default function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const jobId = resolvedParams.jobId

    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currency, setCurrency] = useState('USD')
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        budgetType: 'fixed' as 'fixed' | 'hourly',
        skills: [] as string[],
    })
    const [newSkill, setNewSkill] = useState('')

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const job = await getJob(jobId)
                setCurrency(job.currency || 'USD')
                setFormData({
                    title: job.title,
                    description: job.description,
                    budget: toMajorUnits(job.budget_minor, job.currency).toString(),
                    budgetType: job.budgetType.toLowerCase() === 'hourly' ? 'hourly' : 'fixed',
                    skills: job.requiredSkills || [],
                })
            } catch (err) {
                console.error('Error fetching job:', err)
                alert('Failed to fetch job details')
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

        const budgetFloat = parseFloat(formData.budget)
        if (isNaN(budgetFloat)) {
            alert('Invalid budget amount')
            return
        }

        setIsSubmitting(true)

        try {
            await updateJob(jobId, {
                title: formData.title,
                description: formData.description,
                required_skills: formData.skills,
                budget_type: formData.budgetType,
                budget_minor: toMinorUnits(budgetFloat, currency),
            })

            router.push('/client/my-job-posts')
        } catch (error) {
            console.error('Error updating job:', error)
            alert(error instanceof Error ? error.message : 'Failed to update job')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl p-6">
                <Skeleton className="mb-6 h-9 w-64" />
                <Skeleton className="h-96" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl p-6">
            <PageHeader title="Edit job post" description="Update your project details." />

            <div className="mt-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2 size-5 text-primary" />
                            Project details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="title">Job title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Job title"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={6}
                                placeholder="Project description"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="budget">Budget ({currency}) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="budget"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.budget}
                                        onChange={(e) => handleInputChange('budget', e.target.value)}
                                        className="pl-9"
                                        placeholder="1000.00"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="budgetType">Budget type</Label>
                                <select
                                    id="budgetType"
                                    value={formData.budgetType}
                                    onChange={(e) => handleInputChange('budgetType', e.target.value)}
                                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                                >
                                    <option value="fixed">Fixed price</option>
                                    <option value="hourly">Hourly rate</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Current budget: {formatMoney(toMinorUnits(formData.budget || '0', currency), currency)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Tag className="mr-2 size-5 text-primary" />
                            Skills required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add a skill"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                            />
                            <Button type="button" onClick={handleAddSkill} variant="outline">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="gap-1 text-sm">
                                    {skill}
                                    <button onClick={() => handleRemoveSkill(skill)} aria-label={`Remove ${skill}`}>
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Save changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
