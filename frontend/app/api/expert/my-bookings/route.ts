import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { expertDb, initializeExpertTables } from '@/lib/expert-db';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await initializeExpertTables();
        const bookings = await expertDb.getUserBookings(session.email);

        return NextResponse.json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('User bookings error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
