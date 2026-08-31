'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Users,
    DollarSign,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    Loader2
} from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import { getUserProfileByEmail } from '@/lib/user-profile'
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent'

export default function JobApplicationsPage({ params }: { params: Promise<{ jobId: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const jobId = resolvedParams.jobId
    const { profile } = useUserContext()

    const [job, setJob] = useState<any>(null)
    const [proposals, setProposals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchData = async () => {
        if (!profile?.email || !jobId) return

        try {
            const userProfileData = await getUserProfileByEmail(profile.email)
            const clientId = userProfileData.userId || profile.email
            const actor = await getJobMarketplaceActor()

            // Fetch Job Details
            const jobResult = await actor.getJobById(jobId)
            if (jobResult && jobResult.length > 0) {
                setJob(serializeBigInts(jobResult[0]))
            }

            // Fetch Proposals
            const propsResult = await actor.getProposalsByJob(jobId, clientId)
            if ('ok' in propsResult) {
                setProposals(serializeBigInts(propsResult.ok))
            } else {
                console.error('Error fetching proposals:', propsResult.err)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [profile?.email, jobId])

    const handleAcceptProposal = async (proposal: any) => {
        router.push(`/client/checkout/proposal/${proposal.id}?jobId=${jobId}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!job) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Job Not Found</h2>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Proposals List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Applications ({proposals.length})
                        </h1>
                    </div>

                    {proposals.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                No applications received yet.
                            </CardContent>
                        </Card>
                    ) : (
                        proposals.map((proposal) => (
                            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-12 h-12">
                                                <AvatarFallback>{proposal.freelancerId.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-lg">{proposal.freelancerId}</h3>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-blue-600">
                                                {(Number(proposal.bidAmount) / 100000000).toFixed(5)} ICP
                                            </div>
                                            <div className="text-sm text-gray-500">{proposal.estimatedDeliveryDays} days delivery</div>
                                        </div>
                                    </div>

                                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Cover Letter</h4>
                                        <p className="text-gray-600 whitespace-pre-wrap">{proposal.coverLetter}</p>
                                    </div>

                                    <div className="flex justify-end gap-3">

                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            size="sm"
                                            onClick={() => handleAcceptProposal(proposal)}
                                            disabled={!!actionLoading || proposal.status.ACCEPTED !== undefined}
                                        >
                                            {actionLoading === proposal.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                            )}
                                            {proposal.status.ACCEPTED !== undefined ? 'Selected' : 'Select Freelancer'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Right Column: Job Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Post Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-bold text-gray-900">{job.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-4 mt-2">{job.description}</p>
                            </div>

                            <div className="flex items-center justify-between text-sm py-2 border-y">
                                <div className="flex items-center text-gray-600 font-medium">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Budget
                                </div>
                                <span className="font-bold text-blue-600">
                                    {(Number(job.budgetAmount) / 100000000).toFixed(5)} ICP
                                </span>
                            </div>

                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Skills Needed</h4>
                                <div className="flex flex-wrap gap-2">
                                    {job.requiredSkills.map((skill: string, i: number) => (
                                        <Badge key={i} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push(`/client/edit-job/${jobId}`)}
                            >
                                Edit Job Post
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 flex gap-3 text-sm text-blue-800">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p>Choosing a freelancer will notify them and start the project timeline.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
