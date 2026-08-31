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
        const body = await request.json();
        const { clientId } = body;

        console.log('💰 [API] Request to mark job as paid:', { jobId, clientId });

        if (!jobId || !clientId) {
            console.error('❌ [API] Missing jobId or clientId:', { jobId, clientId });
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const actor = await getJobMarketplaceActor();

        // Fetch job details first to get the correct clientId for authorization
        console.log(`🔍 [API] Paid status update: checking authorization for job ${jobId}`);
        const jobResult = await actor.getJobById(jobId);

        let targetClientId = clientId;

        if (jobResult && jobResult.length > 0) {
            const job = jobResult[0];
            console.log(`✅ [API] Job found. Stored clientId: "${job.clientId}", Request clientId: "${clientId}"`);

            if (job.clientId !== clientId) {
                console.warn(`⚠️ [API] Client ID mismatch! Using stored ID "${job.clientId}" to authorise.`);
                targetClientId = job.clientId;
            }
        } else {
            console.error(`❌ [API] Job not found: ${jobId}`);
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }

        console.log(`🚀 [API] Calling canister.markJobAsPaid("${jobId}", "${targetClientId}")`);
        const result = await actor.markJobAsPaid(jobId, targetClientId);

        if ('ok' in result) {
            console.log(`✅ [API] markJobAsPaid SUCCESS for ${jobId}`);
            return NextResponse.json({ success: true });
        } else {
            console.error(`❌ [API] markJobAsPaid FAILED:`, result.err);
            return NextResponse.json({ success: false, error: result.err }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error marking job as paid:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
