import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { getUserActor } from '@/lib/ic-agent';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const { newPassword }: { newPassword: string } = await request.json();
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a password with at least 8 characters',
      }, { status: 400 });
    }

    const actor = await getUserActor();
    const hashedPassword = await hashPassword(newPassword);
    const updateResult = await actor.updatePassword(session.userId, hashedPassword);

    if ('err' in updateResult) {
      return NextResponse.json({
        success: false,
        error: updateResult.err,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password settings error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update password',
    }, { status: 500 });
  }
}

