import { NextRequest, NextResponse } from 'next/server';
import { getJobMarketplaceActor } from '@/lib/job-marketplace-agent';
import { getCurrentSession } from '@/lib/actions/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await params;
        const { freelancerId } = await request.json();

        if (!jobId || !freelancerId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const actor = await getJobMarketplaceActor();
        const result = await actor.completeJob(jobId, freelancerId);

        if ('ok' in result) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: result.err }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error completing job:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
