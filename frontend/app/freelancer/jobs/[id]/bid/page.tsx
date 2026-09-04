'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
    ArrowLeft,
    Send,
    DollarSign,
    Clock,
    FileText,
    AlertCircle,
    Loader2,
    Briefcase,
    Activity
} from 'lucide-react'
import { getJob } from '@/lib/api/jobs'
import { useUserContext } from '@/contexts/UserContext'
import { getUserProfileByEmail } from '@/lib/user-profile'
import { useToast } from '@/contexts/ToastContext'
import { formatMoney, toMinorUnits } from '@/lib/currency'

export default function BidSubmissionPage() {
    const router = useRouter()
    const params = useParams()
    const { id: jobId } = params
    const { profile } = useUserContext()
    const { showToast } = useToast()

    const [job, setJob] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        coverLetter: '',
        bidAmount: '',
        deliveryDays: ''
    })

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setJob(await getJob(jobId as string))
            } catch (error) {
                console.error('Error fetching job details:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchJob()
    }, [jobId])

    const [usage, setUsage] = useState<any>(null)

    useEffect(() => {
        const fetchUsage = async () => {
            if (!profile.email) return
            try {
                const response = await fetch(`/api/subscription?email=${profile.email}`)
                const result = await response.json()
                if (result.success) setUsage(result.data)
            } catch (error) {
                console.error('Error fetching usage:', error)
            }
        }
        fetchUsage()
    }, [profile.email])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.coverLetter || !formData.bidAmount || !formData.deliveryDays) {
            showToast('Please fill in all fields', 'warning')
            return
        }

        if (!profile.email) {
            showToast('You must be logged in to place a bid', 'error')
            return
        }

        const CONNECTS_PER_BID = 2
        if (usage && usage.connects < CONNECTS_PER_BID) {
            showToast(`You have 0 connects left! You need at least ${CONNECTS_PER_BID} connects to place a bid. Please buy more connects in your subscription settings.`, 'warning', 8000)
            return
        }

        setIsSubmitting(true)
        try {
            const userProfileData = await getUserProfileByEmail(profile.email)
            const freelancerId = userProfileData.userId || profile.email

            const response = await fetch(`/api/marketplace/job-posts/${jobId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    freelancerId,
                    coverLetter: formData.coverLetter,
                    bid_minor: toMinorUnits(formData.bidAmount),
                    deliveryDays: formData.deliveryDays
                })
            })

            const result = await response.json()

            if (result.success) {
                showToast('Proposal submitted successfully! 2 connects deducted.', 'success')
                router.push('/freelancer/browse-jobs')
            } else {
                if (result.error?.includes('Insufficient connects')) {
                    showToast(`You have 0 connects left! ${result.error} Please upgrade your plan or buy connects.`, 'warning', 8000)
                } else {
                    showToast('Failed to submit proposal: ' + result.error, 'error')
                }
            }
        } catch (error) {
            console.error('Error submitting proposal:', error)
            showToast('Failed to submit proposal. Please try again.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="p-6">
                <Skeleton className="mb-6 h-8 w-48" />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <Skeleton className="h-64 lg:col-span-1" />
                    <Skeleton className="h-96 lg:col-span-2" />
                </div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <EmptyState
                    icon={AlertCircle}
                    title="Job not found"
                    action={<Button onClick={() => router.push('/freelancer/browse-jobs')}>Back to browse</Button>}
                />
            </div>
        )
    }

    return (
        <div className="p-6 pb-20">
            <button
                onClick={() => router.back()}
                className="mb-8 flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
                <ArrowLeft className="mr-2 size-4" />
                Back to job details
            </button>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-1">
                    <Card className="border-primary/20 bg-primary-soft">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-sm text-primary-hover">
                                <Activity className="mr-2 size-4" />
                                Your balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-primary-hover">
                                    {usage ? usage.connects : '--'}
                                </span>
                                <Badge variant="outline">Connects</Badge>
                            </div>
                            <p className="mt-2 text-[10px] text-primary-hover">
                                This bid will use 2 connects.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <Briefcase className="mr-2 size-4 text-primary" />
                                Job summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-foreground">{job.title}</h3>
                                <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{job.description}</p>
                            </div>
                            <div className="border-t border-border pt-4">
                                <div className="mb-2 flex justify-between text-sm">
                                    <span className="text-muted-foreground">Client:</span>
                                    <span className="font-medium text-foreground">{job.client_name || job.clientId.slice(0, 8)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Budget:</span>
                                    <span className="font-semibold text-success">{formatMoney(job.budget_minor, job.currency)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-start gap-3 pt-6">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" />
                            <p className="text-xs text-muted-foreground">
                                Submit a compelling proposal to increase your chances. Be clear about your value and timeline.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 size-5 text-primary" />
                                Submit your proposal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="coverLetter">Cover letter — why should they hire you?</Label>
                                    <Textarea
                                        id="coverLetter"
                                        placeholder="Explain your approach, relevant experience, and why you're the best fit for this project..."
                                        className="min-h-[250px] resize-none"
                                        value={formData.coverLetter}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, coverLetter: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="bidAmount">Bid amount (USD)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="bidAmount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="e.g. 50.00"
                                                className="pl-9"
                                                value={formData.bidAmount}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, bidAmount: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="deliveryDays">Estimated delivery (days)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="deliveryDays"
                                                type="number"
                                                min="1"
                                                placeholder="e.g. 7"
                                                className="pl-9"
                                                value={formData.deliveryDays}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDays: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="size-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="size-5" />
                                            Place bid
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
