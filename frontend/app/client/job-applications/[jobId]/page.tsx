'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Users,
    DollarSign,
    Clock,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Loader2,
    FileText
} from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import { getJob, setProposalStatus } from '@/lib/api/jobs'
import { formatMoney } from '@/lib/currency'

function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

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
            // One request: the job carries its proposals, scoped by the API
            // to what this caller is allowed to see.
            const data = await getJob(jobId)
            setJob(data)
            setProposals(data.proposals ?? [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [profile?.email, jobId])

    const handleAcceptProposal = (proposal: any) => {
        router.push(`/client/checkout/proposal/${proposal.id}?jobId=${jobId}`)
    }

    const handleUpdateStatus = async (proposalId: string, newStatus: 'shortlisted' | 'rejected') => {
        setActionLoading(proposalId)
        try {
            await setProposalStatus(jobId, proposalId, newStatus)
            await fetchData()
        } catch (error) {
            console.error('Error updating proposal status:', error)
            alert(error instanceof Error ? error.message : 'Failed to update status. Please try again.')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl p-6">
                <Skeleton className="mb-6 h-8 w-48" />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <Skeleton className="h-64 lg:col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <EmptyState title="Job not found" action={<Button onClick={() => router.back()}>Go back</Button>} />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl p-6">
            <Button variant="ghost" onClick={() => router.back()} className="-ml-2 mb-6">
                <ArrowLeft className="size-4" />
                Back to dashboard
            </Button>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <PageHeader title={`Proposals (${proposals.length})`} />

                    {proposals.length === 0 ? (
                        <EmptyState icon={Users} title="No proposals yet" description="Applications will appear here once freelancers apply." />
                    ) : (
                        proposals.map((proposal) => {
                            const status = (proposal.status || '').toUpperCase()
                            const isAccepted = status === 'ACCEPTED'
                            const isRejected = status === 'REJECTED'
                            const isShortlisted = status === 'SHORTLISTED'

                            return (
                                <Card key={proposal.id} className="transition-shadow hover:shadow-md">
                                    <CardContent className="pt-6">
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-12">
                                                    <AvatarFallback className="bg-primary-soft font-semibold text-primary-hover">
                                                        {(proposal.freelancer_name || proposal.freelancer_email || 'F').slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold text-foreground">
                                                        {proposal.freelancer_name || proposal.freelancer_email}
                                                    </h3>
                                                    <StatusBadge status={titleCase(status || 'Pending')} className="mt-1" />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-xl font-bold text-success">
                                                    <DollarSign className="size-4" />
                                                    {formatMoney(proposal.bid_minor, proposal.currency)}
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Clock className="size-3.5" />
                                                    {proposal.estimatedDeliveryDays} days delivery
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6 rounded-lg bg-secondary p-4">
                                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                <FileText className="size-3.5" />
                                                Cover letter
                                            </h4>
                                            <p className="whitespace-pre-wrap text-sm text-foreground">{proposal.coverLetter}</p>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            {!isRejected && !isAccepted && (
                                                <Button
                                                    variant="outline"
                                                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleUpdateStatus(proposal.id, 'rejected')}
                                                    disabled={!!actionLoading}
                                                >
                                                    {actionLoading === proposal.id ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                                                    Reject
                                                </Button>
                                            )}
                                            {!isShortlisted && !isAccepted && !isRejected && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(proposal.id, 'shortlisted')}
                                                    disabled={!!actionLoading}
                                                >
                                                    {actionLoading === proposal.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                                    Shortlist
                                                </Button>
                                            )}
                                            {!isRejected && (
                                                <Button onClick={() => handleAcceptProposal(proposal)} disabled={!!actionLoading || isAccepted}>
                                                    <CheckCircle2 className="size-4" />
                                                    {isAccepted ? 'Selected' : 'Select freelancer'}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job post summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-foreground">{job.title}</h3>
                                <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{job.description}</p>
                            </div>

                            <div className="flex items-center justify-between border-y border-border py-2 text-sm">
                                <div className="flex items-center font-medium text-muted-foreground">
                                    <DollarSign className="mr-2 size-4" />
                                    Budget
                                </div>
                                <span className="font-semibold text-foreground">
                                    {formatMoney(job.budget_minor, job.currency)}
                                </span>
                            </div>

                            <div className="pt-2">
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills needed</h4>
                                <div className="flex flex-wrap gap-2">
                                    {job.requiredSkills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </div>

                            <Button variant="outline" className="w-full" onClick={() => router.push(`/client/edit-job/${jobId}`)}>
                                Edit job post
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="rounded-lg border border-primary/20 bg-primary-soft p-4 text-sm text-primary-hover">
                        Choosing a freelancer will notify them and start the project timeline.
                    </div>
                </div>
            </div>
        </div>
    )
}
