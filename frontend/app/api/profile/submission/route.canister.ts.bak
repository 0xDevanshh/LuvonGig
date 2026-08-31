import { NextRequest, NextResponse } from 'next/server';
import { getUserActor } from '@/lib/ic-agent';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const body = await request.json();
    const { isSubmitted } = body;

    if (typeof isSubmitted !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'isSubmitted must be a boolean',
      }, { status: 400 });
    }

    // Get user actor and update profile submission status
    const userActor = await getUserActor();
    
    try {
    const result = await userActor.updateProfileSubmissionStatus(session.userId, isSubmitted);

    if ('err' in result) {
      return NextResponse.json({
        success: false,
        error: result.err,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: isSubmitted ? 'Profile marked as submitted' : 'Profile submission status updated',
    });
    } catch (error: any) {
      // Method doesn't exist on deployed canister
      if (error?.message?.includes('no update method') || error?.message?.includes('method not found')) {
        return NextResponse.json({
          success: false,
          error: 'Profile submission feature is not available on the current canister version. Please update the canister.',
        }, { status: 501 }); // 501 Not Implemented
      }
      throw error; // Re-throw other errors
    }

  } catch (error) {
    console.error('Profile submission update error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    // Get user actor and check profile submission status
    const userActor = await getUserActor();
    
    let isSubmitted = false;
    try {
      isSubmitted = await userActor.isProfileSubmitted(session.userId);
    } catch (error: any) {
      // Method doesn't exist on deployed canister - default to false
      if (error?.message?.includes('no update method') || error?.message?.includes('method not found')) {
        console.warn('⚠️ isProfileSubmitted method not available on canister - defaulting to false');
        isSubmitted = false;
      } else {
        throw error; // Re-throw other errors
      }
    }

    return NextResponse.json({
      success: true,
      isSubmitted,
    });

  } catch (error) {
    console.error('Profile submission status check error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}