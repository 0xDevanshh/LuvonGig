import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signupSchema } from '@/lib/validations';
import {
  hashPassword,
  createPasswordResetToken,
  verifyPasswordResetToken,
  generateOTP,
  generateUserId,
  isValidEmail
} from '@/lib/auth';
import { getUserActor } from '@/lib/ic-agent';
import emailService from '@/lib/email';
import {
  checkOTPRateLimit,
  checkOTPVerificationRateLimit,
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
  resetOTPRateLimit,
  resetOTPVerificationRateLimit,
  resetLoginRateLimit
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
    console.log('Received signup request:', body);

    // Validate input
    const validatedData = signupSchema.parse(body);

    // Check rate limiting
    const ip = await getClientIP(request);
    const rateLimit = checkOTPRateLimit(validatedData.email);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: `Too many OTP requests. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      }, { status: 429 });
    }

      // Check if user already exists
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

    let existingUser;
    try {
      existingUser = await userActor.getUserByEmail(validatedData.email);
      console.log('User lookup result:', existingUser);
    } catch (error) {
      console.error('Failed to check existing user:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check user existence. Please try again.',
      }, { status: 500 });
    }

    // Check if user exists (Opt<User> type)
    if (existingUser && 'id' in existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
      }, { status: 400 });
    }

    // Hash password
    let passwordHash;
    try {
      passwordHash = await hashPassword(validatedData.password);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Failed to hash password:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to process password. Please try again.',
      }, { status: 500 });
    }

    // Create user
    let result;
    try {
      console.log('Creating user with email:', validatedData.email);
      result = await userActor.createUser(validatedData.email, passwordHash);
      console.log('User creation result:', result);
    } catch (error) {
      console.error('Failed to create user:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create user account. Please try again.',
      }, { status: 500 });
    }

    if ('err' in result) {
      return NextResponse.json({
        success: false,
        error: result.err,
      }, { status: 500 });
    }

    const userId = result.ok;
    console.log('User created with ID:', userId);

    // Generate and send OTP
    let otpResult;
    try {
      console.log('Creating OTP for email:', validatedData.email);
      otpResult = await userActor.createOTP(validatedData.email);
      console.log('OTP creation result:', otpResult);
    } catch (error) {
      console.error('Failed to create OTP:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create verification code. Please try again.',
      }, { status: 500 });
    }

    if ('err' in otpResult) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create OTP. Please try again.',
      }, { status: 500 });
    }

    // Log OTP for development (useful when email service is not configured)
    console.log('='.repeat(50));
    console.log('🔔 DEVELOPMENT OTP CODE');
    console.log('Email:', validatedData.email);
    console.log('OTP Code:', otpResult.ok);
    console.log('='.repeat(50));

    // Send OTP email
    let emailSent = false;
    try {
      emailSent = await emailService.sendOTPEmail(
        validatedData.email,
        otpResult.ok,
        `${validatedData.firstName} ${validatedData.lastName}`
      );
      console.log('Email send result:', emailSent);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // In development, continue even if email fails
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({
          success: false,
          error: 'Failed to send verification email. Please try again.',
        }, { status: 500 });
      }
      console.warn('Continuing without email in development mode');
      emailSent = true; // Allow continuation in development
    }

    if (!emailSent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      userId,
    });

  } catch (error) {
    console.error('Signup error:', error);

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