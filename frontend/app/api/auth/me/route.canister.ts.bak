import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active session',
        session: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Active session found',
      session: {
        userId: session.userId,
        email: session.email,
        isVerified: session.isVerified,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check session',
      session: null,
    }, { status: 500 });
  }
}