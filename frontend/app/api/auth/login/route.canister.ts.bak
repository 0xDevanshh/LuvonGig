import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginSchema } from '@/lib/validations';
import { getUserActor } from '@/lib/ic-agent';
import { verifyPassword, createSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/rate-limit';

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
    console.log('Received login request:', { email: body.email });

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Check rate limiting
    const ip = await getClientIP(request);
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: `Too many login attempts. Try again in ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} minutes.`,
      }, { status: 429 });
    }

    // Get user
    const userActor = await getUserActor();
    const user = await userActor.getUserByEmail(validatedData.email);

    if (!user || user.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }

    const userData = user[0];

    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, userData.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }

    // Check if email is verified
    if (!userData.isVerified) {
      return NextResponse.json({
        success: false,
        error: 'Please verify your email before logging in',
      }, { status: 401 });
    }

    // Update last login
    await userActor.updateLastLogin(userData.id);

    // Create session
    const sessionToken = await createSession({
      userId: userData.id,
      email: userData.email,
      isVerified: userData.isVerified,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('sid', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Reset rate limit on successful login
    resetLoginRateLimit(ip);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        isVerified: userData.isVerified,
        profile: userData.profile?.[0],
      },
    });

  } catch (error) {
    console.error('Login error:', error);

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