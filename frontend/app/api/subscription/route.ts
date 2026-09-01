import { NextRequest, NextResponse } from 'next/server';
import { getUserUsage, upgradePlan, addConnects } from '@/lib/db/usage-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const usage = await getUserUsage(email);
        if (!usage) {
            return NextResponse.json({ success: false, error: 'Failed to fetch usage data' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: usage });
    } catch (error) {
        console.error('API Error in GET /subscription:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST() {
    // RETIRED (Phase 5). Subscription purchases now go through
    // /api/payments/subscription, which prices the plan on the server and
    // activates it only when a signature-verified Stripe webhook confirms
    // the charge.
    //
    // The version this replaces had two holes worth naming, so they are not
    // reintroduced elsewhere:
    //   - `paymentId: 'sandbox_success'` skipped payment verification outright,
    //     which meant a free Premium upgrade for anyone who sent that string
    //   - the account to upgrade came from `email` in the request body rather
    //     than from the session, so one user could upgrade another's plan
    return NextResponse.json(
        {
            success: false,
            error: 'Subscription changes now go through /api/payments/subscription.',
            code: 'GONE',
        },
        { status: 410 },
    );
}
