'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    User,
    DollarSign,
    Clock,
    AlertCircle,
    Loader2,
    ThumbsUp,
    Briefcase,
    FileText
} from 'lucide-react'
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent'
import { useUserContext } from '@/contexts/UserContext'
import { getUserProfileByEmail } from '@/lib/user-profile'

export default function ManageProposalsPage() {
    const router = useRouter()
    const params = useParams()
    const { id: jobId } = params
    const { profile } = useUserContext()

    const [job, setJob] = useState<any>(null)
    const [proposals, setProposals] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)

    const fetchData = async () => {
        if (!profile.email) return

        setIsLoading(true)
        try {
            const userProfileData = await getUserProfileByEmail(profile.email)
            const clientId = userProfileData.userId || profile.email

            const actor = await getJobMarketplaceActor()

            // Fetch Job Details
            const jobResult = await actor.getJobById(jobId as string)
            if (jobResult && jobResult.length > 0) {
                setJob(serializeBigInts(jobResult[0]))
            }

            // Fetch Proposals
            const propsResult = await actor.getProposalsByJob(jobId as string, clientId)
            if ('ok' in propsResult) {
                setProposals(serializeBigInts(propsResult.ok))
            } else {
                console.error('Error fetching proposals:', propsResult.err)
            }
        } catch (error) {
            console.error('Error fetching data from ICP:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [jobId, profile.email])

    const handleUpdateStatus = async (proposalId: string, newStatus: string) => {
        if (!profile.email) return

        setIsUpdating(proposalId)
        try {
            const userProfileData = await getUserProfileByEmail(profile.email)
            const clientId = userProfileData.userId || profile.email

            const actor = await getJobMarketplaceActor()

            // Map status string to variant
            const statusVariant =
                newStatus === 'SHORTLISTED' ? { SHORTLISTED: null } :
                    newStatus === 'REJECTED' ? { REJECTED: null } : { PENDING: null }

            const result = await actor.updateProposalStatus(proposalId, clientId, statusVariant)

            if ('ok' in result) {
                // Refresh data
                await fetchData()
            } else {
                alert('Failed to update status: ' + result.err)
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status. Please try again.')
        } finally {
            setIsUpdating(null)
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
                <Button onClick={() => router.push('/client/my-job-posts')}>Back to Jobs</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-gray-600 hover:text-blue-600 mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Review Proposals</h1>
                        <p className="text-gray-600">Managing bids for: <span className="font-semibold">{job.title}</span></p>
                    </div>
                    <Badge variant="outline" className="text-lg py-1 px-4 border-blue-200 bg-blue-50 text-blue-700">
                        {proposals.length} Proposals Received
                    </Badge>
                </div>

                {proposals.length === 0 ? (
                    <Card className="text-center py-20 border-dashed">
                        <CardContent>
                            <ThumbsUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900">No proposals yet</h3>
                            <p className="text-gray-500">Wait for freelancers to discover your job and submit their bids.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {proposals.map(proposal => {
                            const status = Object.keys(proposal.status)[0]
                            return (
                                <Card key={proposal.id} className={`overflow-hidden transition-all ${status === 'SHORTLISTED' ? 'border-green-200' : ''}`}>
                                    <div className="flex flex-col lg:flex-row">
                                        {/* Left: Freelancer Profile Info */}
                                        <div className="bg-gray-50 p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-100">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Freelancer ID</h4>
                                                    <p className="text-xs text-gray-500 font-mono">{proposal.freelancerId}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Bid Amount:</span>
                                                    <span className="font-bold text-green-600 flex items-center">
                                                        <DollarSign className="w-3 h-3" />
                                                        {(Number(proposal.bidAmount) / 100000000).toFixed(4)} ICP
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Delivery:</span>
                                                    <span className="font-medium flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {proposal.estimatedDeliveryDays} Days
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Status:</span>
                                                    <Badge
                                                        variant={
                                                            status === 'SHORTLISTED' ? 'default' :
                                                                status === 'REJECTED' ? 'destructive' : 'secondary'
                                                        }
                                                        className={status === 'SHORTLISTED' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                    >
                                                        {status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Proposal Content & Actions */}
                                        <div className="p-6 lg:w-2/3 flex flex-col justify-between">
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                                    Cover Letter
                                                </h4>
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                                                    {proposal.coverLetter}
                                                </p>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                                {status !== 'REJECTED' && (
                                                    <Button
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50 border-red-100"
                                                        onClick={() => handleUpdateStatus(proposal.id, 'REJECTED')}
                                                        disabled={isUpdating === proposal.id}
                                                    >
                                                        {isUpdating === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                        Reject
                                                    </Button>
                                                )}
                                                {status !== 'SHORTLISTED' && (
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleUpdateStatus(proposal.id, 'SHORTLISTED')}
                                                        disabled={isUpdating === proposal.id}
                                                    >
                                                        {isUpdating === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                        Shortlist
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
