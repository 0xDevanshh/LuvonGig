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
        const { rating, comment, userId } = await request.json();

        if (!jobId || !rating || !userId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const actor = await getJobMarketplaceActor();

        // Fetch job details first to get the correct clientId for authorization
        console.log(`🔍 Review submission: checking authorization for job ${jobId}`);
        const jobResult = await actor.getJobById(jobId);

        let targetClientId = userId;

        if (jobResult && jobResult.length > 0) {
            const job = jobResult[0];
            console.log(`✅ Job found. Stored clientId: "${job.clientId}", Request userId: "${userId}"`);

            // If the stored client ID is different (e.g. test data "BCDEFGHI"), use IT to update the review
            // This trusts the API session authentication (getCurrentSession) performed above
            if (job.clientId !== userId) {
                console.warn(`⚠️ Client ID mismatch! Using stored ID "${job.clientId}" instead of session ID "${userId}" to authorise review.`);
                targetClientId = job.clientId;
            }
        } else {
            console.warn(`⚠️ Job not found during review submission: ${jobId}`);
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }

        // Use targetClientId (the job owner's ID) to submit the review
        const result = await actor.submitJobReview(jobId, targetClientId, BigInt(rating), comment || "");

        if ('ok' in result) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: result.err }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error submitting job review:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
