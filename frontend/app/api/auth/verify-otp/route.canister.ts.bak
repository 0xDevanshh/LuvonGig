import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { otpVerificationSchema } from '@/lib/validations';
import { getUserActor } from '@/lib/ic-agent';
import emailService from '@/lib/email';
import {
  checkOTPVerificationRateLimit,
  resetOTPRateLimit,
  resetOTPVerificationRateLimit,
} from '@/lib/rate-limit';

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
    console.log('Received OTP verification request:', body);

    // Validate input
    const validatedData = otpVerificationSchema.parse(body);

    // Check rate limiting
    const rateLimit = checkOTPVerificationRateLimit(validatedData.email);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: `Too many verification attempts. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      }, { status: 429 });
    }

    // Verify OTP
    const userActor = await getUserActor();
    const result = await userActor.verifyOTP(validatedData.email, validatedData.otp);

    if ('err' in result) {
      return NextResponse.json({
        success: false,
        error: result.err,
      }, { status: 400 });
    }

    if (!result.ok) {
      return NextResponse.json({
        success: false,
        error: 'Invalid OTP code',
      }, { status: 400 });
    }

    // Get user and verify email
    const user = await userActor.getUserByEmail(validatedData.email);
    if (!user || user.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const userData = user[0];

    // Mark email as verified
    const verifyResult = await userActor.verifyEmail(userData.id);
    if ('err' in verifyResult) {
      return NextResponse.json({
        success: false,
        error: 'Failed to verify email',
      }, { status: 500 });
    }

    // Send welcome email
    await emailService.sendWelcomeEmail(
      userData.email,
      `${userData.profile?.[0]?.firstName || 'User'} ${userData.profile?.[0]?.lastName || ''}`
    );

    // Reset rate limits
    resetOTPRateLimit(validatedData.email);
    resetOTPVerificationRateLimit(validatedData.email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });

  } catch (error) {
    console.error('OTP verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}