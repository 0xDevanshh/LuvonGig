import { NextRequest, NextResponse } from 'next/server';
import { getUserUsage, upgradePlan, addConnects } from '@/lib/db/usage-service';
import { verifyPayment } from '@/lib/icpay-server';

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

export async function POST(request: NextRequest) {
    try {
        const { email, action, plan, amount, paymentId } = await request.json();

        if (!email || !action) {
            return NextResponse.json({ success: false, error: 'Email and action are required' }, { status: 400 });
        }

        // Standard flow: Require paymentId for paid actions
        if (!paymentId && (action === 'upgrade' && plan === 'Premium' || action === 'connects' || action === 'add-connects')) {
            return NextResponse.json({ success: false, error: 'Payment verification ID is required' }, { status: 400 });
        }

        // Verify payment if paymentId is provided
        if (paymentId) {
            // Bypass verification for sandbox/testing if special ID is used
            if (paymentId === 'sandbox_success') {
                console.log('🧪 Sandbox payment bypass triggered for:', email);
            } else {
                try {
                    const payment = await verifyPayment(paymentId);
                    if (!payment || payment.status !== 'completed') {
                        return NextResponse.json({
                            success: false,
                            error: 'Payment verification failed. Payment is not completed.'
                        }, { status: 402 });
                    }

                    // Verify metadata matches requested action
                    const metadata = payment.metadata as any;
                    if (metadata.email !== email || metadata.type !== action) {
                        return NextResponse.json({
                            success: false,
                            error: 'Payment metadata mismatch.'
                        }, { status: 400 });
                    }
                } catch (error) {
                    console.error('ICPay Verification Error:', error);
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to verify payment with ICPay.'
                    }, { status: 502 });
                }
            }
        }

        let success = false;
        let message = '';

        if (action === 'upgrade' || action === 'upgrade') { // Action can be 'upgrade'
            const targetPlan = plan;
            if (!['Basic', 'Premium'].includes(targetPlan)) {
                return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
            }

            // Basic is free, Premium requires paymentId (already checked above)
            success = await upgradePlan(email, targetPlan);
            message = success ? `Successfully upgraded to ${targetPlan} plan` : 'Failed to upgrade plan';
        } else if (action === 'connects' || action === 'add-connects') {
            const connectAmount = parseInt(amount);
            if (isNaN(connectAmount) || connectAmount <= 0) {
                return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
            }

            success = await addConnects(email, connectAmount);
            message = success ? `Successfully added ${connectAmount} connects` : 'Failed to add connects';
        } else {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        if (!success) {
            return NextResponse.json({ success: false, error: message }, { status: 500 });
        }

        // Return updated usage
        const updatedUsage = await getUserUsage(email);
        return NextResponse.json({ success: true, message, data: updatedUsage });

    } catch (error) {
        console.error('API Error in POST /subscription:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
