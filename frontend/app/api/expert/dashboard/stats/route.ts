import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { expertDb, initializeExpertTables } from '@/lib/expert-db';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize tables if they don't exist
        await initializeExpertTables();

        // Get expert profile first
        const expert = await expertDb.getExpertByEmail(session.email);
        if (!expert) {
            return NextResponse.json({ success: false, error: 'Expert profile not found' }, { status: 404 });
        }

        const stats = await expertDb.getExpertStats(expert.id);

        return NextResponse.json({
            success: true,
            stats,
            expert
        });
    } catch (error) {
        console.error('Expert stats error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
