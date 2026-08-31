import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserActor } from '@/lib/ic-agent';
import emailService from '@/lib/email';
import { checkOTPRateLimit } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/auth';

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
    const { email } = body;

    if (!isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address',
      }, { status: 400 });
    }

    // Check rate limiting
    const rateLimit = checkOTPRateLimit(email);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: `Too many OTP requests. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      }, { status: 429 });
    }

    // Check if user exists
    const userActor = await getUserActor();
    const user = await userActor.getUserByEmail(email);

    if (!user || user.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    if (user[0].isVerified) {
      return NextResponse.json({
        success: false,
        error: 'Email is already verified',
      }, { status: 400 });
    }

    // Generate and send new OTP
    const otpResult = await userActor.createOTP(email);

    if ('err' in otpResult) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create OTP. Please try again.',
      }, { status: 500 });
    }

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(
      email,
      otpResult.ok,
      `${user[0].profile?.[0]?.firstName || 'User'} ${user[0].profile?.[0]?.lastName || ''}`
    );

    if (!emailSent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}