import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor } from '@/lib/ic-marketplace-agent';
import { getCurrentSession } from '@/lib/actions/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { bookingId, clientId } = body;

        console.log('💰 [API] Request to mark booking as paid:', { bookingId, clientId });

        if (!bookingId || !clientId) {
            console.error('❌ [API] Missing bookingId or clientId:', { bookingId, clientId });
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const actor = await getMarketplaceActor();

        console.log(`🚀 [API] Calling canister.markBookingAsPaid("${bookingId}", "${clientId}")`);
        const result = await actor.markBookingAsPaid(bookingId, clientId) as any;

        if ('ok' in result) {
            console.log(`✅ [API] markBookingAsPaid SUCCESS for ${bookingId}`);
            return NextResponse.json({ success: true });
        } else {
            console.error(`❌ [API] markBookingAsPaid FAILED:`, result.err);
            return NextResponse.json({ success: false, error: result.err }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error marking booking as paid:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
