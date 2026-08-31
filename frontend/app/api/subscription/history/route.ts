import { NextRequest, NextResponse } from 'next/server';
import { getConnectsHistory } from '@/lib/db/usage-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const history = await getConnectsHistory(email);

        return NextResponse.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Error in connects history API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
