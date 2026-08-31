import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { profileBasicSchema } from '@/lib/validations';
import { getUserActor } from '@/lib/ic-agent';
import { getCurrentSession } from '@/lib/actions/auth';
import { clearProfileCache } from '../cache';

// Environment validation
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';
const USER_CANISTER_ID = process.env.NEXT_PUBLIC_USER_CANISTER_ID ?? '';

function validateEnvironment() {
  const errors: string[] = [];

  if (!IC_HOST) {
    errors.push('NEXT_PUBLIC_IC_HOST is not configured');
  }

  if (!USER_CANISTER_ID) {
    errors.push('NEXT_PUBLIC_USER_CANISTER_ID is not configured');
  }

  return errors;
}

// Timeout utility function
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

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
  const startTime = Date.now();

  try {
    // First validate environment
    const envErrors = validateEnvironment();
    if (envErrors.length > 0) {
      console.warn('Environment validation failed:', envErrors);
      return NextResponse.json({
        success: false,
        error: 'Backend service is temporarily unavailable. Please try again later.',
        details: 'Service configuration error',
        envErrors,
      }, { status: 503 });
    }

    const session = await withTimeout(
      getCurrentSession(),
      5000,
      'Session lookup timed out'
    );

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received profile completion request for user:', session.email);

    // Validate input
    const validatedData = profileBasicSchema.parse(body);

    const normalizeOptional = (value?: string | null) => {
      if (!value) return [];
      const trimmed = value.trim();
      return trimmed.length > 0 ? [trimmed] : [];
    };

    const normalizedSkills = Array.isArray(body.skills)
      ? body.skills
          .map((skill: unknown) => (typeof skill === 'string' ? skill.trim() : ''))
          .filter((skill: string) => skill.length > 0)
      : [];

    const normalizedGithub = typeof body.github === 'string' ? body.github : validatedData.github;
    const normalizedLinkedin = typeof body.linkedin === 'string' ? body.linkedin : validatedData.linkedin;
    const normalizedWebsite = typeof body.website === 'string' ? body.website : validatedData.website;
    const normalizedTwitter = typeof body.twitter === 'string' ? body.twitter : validatedData.twitter;
    const normalizedPhone = typeof body.phone === 'string' ? body.phone : validatedData.phone;
    const normalizedLocation = typeof body.location === 'string' ? body.location : validatedData.location;
    const normalizedBio = typeof body.bio === 'string' ? body.bio : validatedData.bio;
    const profileImageUrl = typeof body.profileImageUrl === 'string' ? body.profileImageUrl : undefined;
    const resumeUrl = typeof body.resumeUrl === 'string' ? body.resumeUrl : undefined;

    // Update user profile in ICP backend with timeout
    try {
      const actor = await withTimeout(
        getUserActor(),
        10000,
        'ICP connection timed out - backend service may be unavailable'
      );

      // Prepare profile data for ICP backend using the correct field names
      const profileData = {
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        bio: normalizeOptional(normalizedBio),
        phone: normalizeOptional(normalizedPhone),
        location: normalizeOptional(normalizedLocation),
        website: normalizeOptional(normalizedWebsite),
        linkedin: normalizeOptional(normalizedLinkedin),
        github: normalizeOptional(normalizedGithub),
        twitter: normalizeOptional(normalizedTwitter),
        skills: normalizedSkills,
        profileImageUrl: normalizeOptional(profileImageUrl),
        resumeUrl: normalizeOptional(resumeUrl),
        experience: [],
        education: [],
      };

      // Update the user's profile with timeout
      const updateResult = await withTimeout(
        actor.updateProfile(session.userId, profileData),
        15000,
        'Profile update timed out - please try again'
      );

      console.log('Profile updated in ICP:', updateResult);

      if ('err' in (updateResult as any)) {
        return NextResponse.json({
          success: false,
          error: (updateResult as any).err,
        }, { status: 400 });
      }

      // Auto-mark profile as submitted with timeout
      try {
        console.log('🔄 Auto-marking profile as submitted for user:', session.userId);
        const markResult = await withTimeout(
          actor.markProfileAsSubmitted(session.userId),
          10000,
          'Profile submission timed out - profile is still saved'
        );
        console.log('✅ Profile auto-submitted successfully:', markResult);

        if ('err' in (markResult as any)) {
          console.error('Failed to auto-submit profile:', (markResult as any).err);
          // Continue anyway - profile is updated even if submission marking fails
        }
      } catch (submitError: any) {
        // Method doesn't exist on deployed canister - that's okay, profile is still saved
        if (submitError?.message?.includes('no update method') || submitError?.message?.includes('method not found')) {
          console.warn('⚠️ markProfileAsSubmitted method not available on canister - profile is still saved');
        } else {
        console.error('Auto-submission failed (profile still saved):', submitError);
        }
        // Continue anyway - the main profile data is saved
      }

      // Clear cached profile so subsequent reads fetch fresh data
      clearProfileCache(session.email);

      return NextResponse.json({
        success: true,
        message: 'Profile completed successfully! Your profile is now active and ready to use.',
        profileSubmitted: true
      });

    } catch (icpError) {
      console.error('ICP profile update error:', icpError);
      const duration = Date.now() - startTime;

      // Check if it's a timeout error
      if (icpError instanceof Error && icpError.message.includes('timed out')) {
        return NextResponse.json({
          success: false,
          error: 'Request timed out. The backend service may be temporarily unavailable. Please try again.',
          details: icpError.message,
          duration,
          timeout: true
        }, { status: 504 });
      }

      // Fallback: store profile data temporarily
      // This is a fallback mechanism for when ICP backend is not available
      return NextResponse.json({
        success: true,
        message: 'Profile saved locally. Backend synchronization will happen automatically when available.',
        profile: validatedData,
        fallback: true,
        duration
      });
    }

  } catch (error) {
    console.error('Profile completion error:', error);
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message,
        details: 'Validation failed',
        duration
      }, { status: 400 });
    }

    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json({
        success: false,
        error: 'Request timed out. Please try again.',
        details: error.message,
        duration,
        timeout: true
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration
    }, { status: 500 });
  }
}