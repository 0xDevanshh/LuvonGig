import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';

// GET /api/auth/session - Get current user session
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (session) {
      return NextResponse.json({
        success: true,
        session: {
          userId: session.userId,
          email: session.email,
          isAuthenticated: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No active session'
      });
    }
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch session'
    }, { status: 500 });
  }
}