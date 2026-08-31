import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { expertDb, initializeExpertTables } from '@/lib/expert-db';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize tables if they don't exist
        await initializeExpertTables();

        const data = await request.json();
        const { name, expertise, session_amount_icp, calendly_link, description, picture_url } = data;

        if (!name || !expertise || !session_amount_icp || !calendly_link) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const expert = await expertDb.registerExpert({
            user_email: session.email,
            name,
            expertise,
            session_amount_icp: parseFloat(session_amount_icp),
            calendly_link,
            description: description || '',
            picture_url: picture_url || null
        });

        return NextResponse.json({
            success: true,
            message: 'Expert profile saved successfully',
            expert
        });
    } catch (error) {
        console.error('Expert registration error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize tables if they don't exist
        await initializeExpertTables();

        const expert = await expertDb.getExpertByEmail(session.email);

        return NextResponse.json({
            success: true,
            expert: expert || null
        });
    } catch (error) {
        console.error('Fetch expert profile error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
