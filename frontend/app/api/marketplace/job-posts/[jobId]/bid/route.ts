import { NextRequest, NextResponse } from 'next/server';
import { getJobMarketplaceActor } from '@/lib/job-marketplace-agent';
import { getUserUsage, deductConnects } from '@/lib/db/usage-service';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;
        const { freelancerId, coverLetter, bidAmount, deliveryDays, email } = await request.json();

        if (!email || !freelancerId || !coverLetter || !bidAmount || !deliveryDays) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check Connects in PostgreSQL
        const usage = await getUserUsage(email);
        if (!usage) {
            return NextResponse.json({ success: false, error: 'User usage profile not found' }, { status: 404 });
        }

        const CONNECTS_PER_BID = 2; // Fixed requirement for simulated usage
        if (usage.connects < CONNECTS_PER_BID) {
            return NextResponse.json({
                success: false,
                error: `Insufficient connects. This bid requires ${CONNECTS_PER_BID} connects, you have ${usage.connects}.`
            }, { status: 403 });
        }

        // 2. Call Motoko Canister
        const actor = await getJobMarketplaceActor();

        // Convert ICP bidAmount to e8s BigInt, handling decimals
        const bidFloat = typeof bidAmount === 'string' ? parseFloat(bidAmount) : Number(bidAmount);
        const bidAmountE8s = BigInt(Math.floor(bidFloat * 100000000));

        const result = await actor.placeBid(
            jobId,
            freelancerId,
            coverLetter,
            bidAmountE8s,
            BigInt(deliveryDays)
        );

        if ('err' in result) {
            return NextResponse.json({ success: false, error: result.err }, { status: 500 });
        }

        // 3. Deduct Connects in PostgreSQL on success
        const deduction = await deductConnects(email, CONNECTS_PER_BID, `Bid placed on job: ${jobId}`);
        if (!deduction.success) {
            // This is a rare state where canister succeeded but PG deduction failed
            console.error('Critical: Canister bid succeeded but PG deduction failed for', email);
        }

        return NextResponse.json({
            success: true,
            message: 'Bid placed successfully',
            connectsDeducted: CONNECTS_PER_BID
        });

    } catch (error) {
        console.error('Error in gated bid API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
