import { NextRequest, NextResponse } from 'next/server';
import { expertDb, initializeExpertTables } from '@/lib/expert-db';

export async function GET(request: NextRequest) {
    try {
        // Initialize tables if they don't exist
        await initializeExpertTables();

        const experts = await expertDb.listExperts();

        return NextResponse.json({
            success: true,
            experts
        });
    } catch (error) {
        console.error('List experts error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
