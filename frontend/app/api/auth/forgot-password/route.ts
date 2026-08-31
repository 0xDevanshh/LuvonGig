import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { forgotPasswordSchema } from '@/lib/validations';
import { getUserActor } from '@/lib/ic-agent';
import { createPasswordResetToken } from '@/lib/auth';
import emailService from '@/lib/email';
import { checkPasswordResetRateLimit } from '@/lib/rate-limit';

// Get client IP for rate limiting
async function getClientIP(request: NextRequest): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received forgot password request:', { email: body.email });

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);

    // Check rate limiting
    const ip = await getClientIP(request);
    const rateLimit = checkPasswordResetRateLimit(validatedData.email);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: `Too many password reset requests. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      }, { status: 429 });
    }

    // Check if user exists
    console.log('Checking if user exists for email:', validatedData.email);
    let userActor;
    try {
      userActor = await getUserActor();
    } catch (error) {
      console.error('Failed to get user actor:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to user service. Please try again.',
      }, { status: 500 });
    }

    let user;
    try {
      user = await userActor.getUserByEmail(validatedData.email);
      console.log('User lookup result:', user);
    } catch (error) {
      console.error('Failed to check existing user:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check user existence. Please try again.',
      }, { status: 500 });
    }

    if (!user || !('id' in user)) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    const userData = user;

    // Create password reset token
    let resetToken;
    try {
      console.log('Creating password reset token for user:', userData.id);
      resetToken = await createPasswordResetToken(userData.id);
      console.log('Password reset token created successfully');
    } catch (error) {
      console.error('Failed to create password reset token:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create reset token. Please try again.',
      }, { status: 500 });
    }

    // Get user name for email
    const firstName = userData.profile?.firstName || 'User';
    const lastName = userData.profile?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'User';

    // Log reset token for development
    console.log('='.repeat(50));
    console.log('🔔 DEVELOPMENT PASSWORD RESET TOKEN');
    console.log('Email:', userData.email);
    console.log('Reset Token:', resetToken);
    console.log('Reset URL:', `http://localhost:3001/reset-password?token=${resetToken}`);
    console.log('='.repeat(50));

    // Send password reset email
    let emailSent = false;
    try {
      emailSent = await emailService.sendPasswordResetEmail(
        userData.email,
        resetToken,
        fullName
      );
      console.log('Password reset email send result:', emailSent);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // In development, continue even if email fails
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({
          success: false,
          error: 'Failed to send password reset email. Please try again.',
        }, { status: 500 });
      }
      console.warn('Continuing without email in development mode');
      emailSent = true; // Allow continuation in development
    }

    if (!emailSent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send password reset email. Please try again.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors);
      return NextResponse.json({
        success: false,
        error: error.errors[0].message,
      }, { status: 400 });
    }

    // Log the full error for debugging
    console.error('Unexpected error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });

    return NextResponse.json({
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}