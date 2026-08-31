'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent'
import { useUserContext } from '@/contexts/UserContext'
import { getUserProfileByEmail } from '@/lib/user-profile'
import { useToast } from '@/contexts/ToastContext'

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
                const actor = await getJobMarketplaceActor()
                const result = await actor.getJobById(jobId as string)
                if (result && result.length > 0) {
                    setJob(serializeBigInts(result[0]))
                }
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

        // Pre-submission connects check for better UX
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
                    bidAmount: formData.bidAmount,
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        )
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
                <Button onClick={() => router.push('/freelancer/browse-jobs')}>Back to Browse</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Job Details
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Job Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-purple-100 bg-purple-50/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center text-purple-800">
                                    <Activity className="w-4 h-4 mr-2" />
                                    Your Balance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-purple-700">
                                        {usage ? usage.connects : '--'}
                                    </span>
                                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                                        Connects
                                    </Badge>
                                </div>
                                <p className="text-[10px] text-purple-600 mt-2">
                                    This bid will use 2 connects.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-100 bg-blue-50/30">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center text-blue-800">
                                    <Briefcase className="w-4 h-4 mr-2" />
                                    Job Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">{job.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-4">{job.description}</p>
                                </div>
                                <div className="pt-4 border-t border-blue-100">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Client ID:</span>
                                        <span className="font-medium">{job.clientId.slice(0, 8)}...</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Budget:</span>
                                        <span className="font-bold text-green-600">{(Number(job.budgetAmount) / 100000000).toFixed(5)} ICP</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-600">
                                    Submit a compelling proposal to increase your chances. Be clear about your value and timeline.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Proposal Form */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                                    Submit Your Proposal
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cover Letter / Why should they hire you?
                                        </label>
                                        <Textarea
                                            placeholder="Explain your approach, relevant experience, and why you're the best fit for this project..."
                                            className="min-h-[250px] resize-none"
                                            value={formData.coverLetter}
                                            onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Bid Amount (ICP)
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    type="number"
                                                    step="0.00001"
                                                    placeholder="e.g. 50.00001"
                                                    className="pl-10"
                                                    value={formData.bidAmount}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, bidAmount: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Estimated Delivery (Days)
                                            </label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 7"
                                                    className="pl-10"
                                                    value={formData.deliveryDays}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryDays: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2" />
                                                    Place Bid
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
