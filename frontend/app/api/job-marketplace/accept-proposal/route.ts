import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { getJobMarketplaceActor } from '@/lib/job-marketplace-agent';

/**
 * POST /api/job-marketplace/accept-proposal
 * 
 * Accepts a job proposal after escrow has been successfully funded.
 * This endpoint should only be called after verifying escrow funding.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated',
            }, { status: 401 });
        }

        const { proposalId, freelancerUserId, jobTitle }: {
            proposalId: string;
            freelancerUserId: string;
            jobTitle?: string;
        } = await request.json();

        if (!proposalId) {
            return NextResponse.json({
                success: false,
                error: 'proposalId is required',
            }, { status: 400 });
        }

        console.log('📝 Accepting proposal after escrow funding:', proposalId);
        const jobMarketplaceActor = await getJobMarketplaceActor();
        const clientId = session.userId || session.email;

        const result = await jobMarketplaceActor.acceptProposal(proposalId, clientId);

        if ('ok' in result) {
            console.log('✅ Proposal accepted after escrow funding:', proposalId);

            // Send notification to freelancer
            if (freelancerUserId) {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: session.email || session.userId,
                            to: freelancerUserId,
                            text: `Congratulations! Your proposal for "${jobTitle || 'the job'}" has been accepted and the escrow has been funded. The job has been moved to your active projects.`,
                            messageType: 'system'
                        })
                    });
                    console.log('✅ Notification sent to freelancer');
                } catch (notifyErr) {
                    console.error('⚠️ Failed to send notification:', notifyErr);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Proposal accepted successfully'
            });
        } else {
            console.error('❌ Proposal acceptance failed:', result.err);
            return NextResponse.json({
                success: false,
                error: result.err
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('❌ Error accepting proposal:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to accept proposal',
        }, { status: 500 });
    }
}
