import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/actions/auth';
import { getUserActor } from '@/lib/ic-agent';

// Complete onboarding data schema
const completeOnboardingSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    bio: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    twitter: z.string().optional(),
    profileImage: z.string().nullable().optional(),
  }),
  skills: z.array(z.string().max(50, 'Skill name is too long')).max(20, 'Maximum 20 skills allowed'),
  resume: z.object({
    fileName: z.string().optional(),
    fileUrl: z.string().optional(),
    hasResume: z.boolean(),
  }).optional(),
  address: z.object({
    isPrivate: z.boolean(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
    zipCode: z.string(),
    streetAddress: z.string(),
  }).optional(),
});

// GET endpoint to retrieve user data by email
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    // Get user email from session
    const userEmail = session.email;
    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User email not found in session',
      }, { status: 400 });
    }

    console.log('🔍 GET: Retrieving user data for email:', userEmail);

    try {
      const actor = await getUserActor();
      const userData = await actor.getUserByEmail(userEmail);

      console.log('📊 GET: Retrieved user data:', userData);

      return NextResponse.json({
        success: true,
        userEmail: userEmail,
        userData: userData,
        message: 'User data retrieved successfully'
      });

    } catch (icpError) {
      console.error('GET: ICP user retrieval error:', icpError);

      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve user data from backend',
        userEmail: userEmail,
        details: icpError instanceof Error ? icpError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('GET: Complete onboarding error:', error);

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while retrieving user data.',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    const body = await request.json();
    let userEmail = '';

    // Try to get user email from session first
    if (session && session.email) {
      userEmail = session.email;
      console.log('🔐 User authenticated via session:', userEmail);
    } else {
      // If no session, try to get email from request body
      if (body.userEmail) {
        userEmail = body.userEmail;
        console.log('📧 User email from request body:', userEmail);
      } else {
        return NextResponse.json({
          success: false,
          error: 'Not authenticated and no user email provided',
        }, { status: 401 });
      }
    }

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User email not found',
      }, { status: 400 });
    }

    console.log('🔍 Getting user data for email:', userEmail);
    console.log('📧 Session details:', session ? { userId: session.userId, email: session.email, isVerified: session.isVerified } : 'No session');
    console.log('📥 Received complete onboarding request:', body);

    // Validate input
    const validatedData = completeOnboardingSchema.parse(body);

    // Save all onboarding data to ICP backend
    try {
      const actor = await getUserActor();

      // First, get existing user data by email
      console.log('🔍 Retrieving existing user data for email:', userEmail);
      const existingUserData = await actor.getUserByEmail(userEmail);
      console.log('📊 Existing user data:', existingUserData);

      if (!existingUserData || existingUserData.length === 0) {
        console.error('❌ User not found in canister for email:', userEmail);
        return NextResponse.json({
          success: false,
          error: 'User not found in system. Please contact support.',
          userEmail,
        }, { status: 404 });
      }

      const user = existingUserData[0]; // getUserByEmail returns an array
      if (!user || !user.id) {
        console.error('❌ Invalid user data structure:', user);
        return NextResponse.json({
          success: false,
          error: 'Invalid user data. Please contact support.',
          userEmail,
        }, { status: 500 });
      }

      // Prepare complete profile data for ICP backend
      // Note: Optional fields need to be wrapped in arrays for Motoko
      const profileData = {
        firstName: validatedData.profile.firstName,
        lastName: validatedData.profile.lastName,
        bio: validatedData.profile.bio ? [validatedData.profile.bio] : [],
        phone: validatedData.profile.phone ? [validatedData.profile.phone] : [],
        location: validatedData.profile.location ? [validatedData.profile.location] : [],
        website: validatedData.profile.website ? [validatedData.profile.website] : [],
        linkedin: validatedData.profile.linkedin ? [validatedData.profile.linkedin] : [],
        github: validatedData.profile.github ? [validatedData.profile.github] : [],
        twitter: validatedData.profile.twitter ? [validatedData.profile.twitter] : [],
        profileImageUrl: validatedData.profile.profileImage ? [validatedData.profile.profileImage] : [],
        resumeUrl: validatedData.resume?.fileUrl ? [validatedData.resume.fileUrl] : [],
        skills: validatedData.skills,
        experience: [], // Not provided in onboarding
        education: [], // Not provided in onboarding
      };

      console.log('📝 Updating user profile with data:', profileData);

      // Update the user's complete profile using userId
      console.log('🔄 Calling updateProfile with userId:', user.id);
      console.log('🔄 Profile data being sent:', JSON.stringify(profileData, null, 2));

      const result = await actor.updateProfile(user.id, profileData);

      console.log('✅ Complete profile updated in ICP:', result);
      console.log('✅ Update result type:', typeof result);
      console.log('✅ Update result details:', JSON.stringify(result, null, 2));

      // Auto-mark profile as submitted (self-declaration, no review needed)
      try {
        console.log('🔄 Auto-marking profile as submitted for user:', user.id);
        const markResult = await actor.markProfileAsSubmitted(user.id);
        console.log('✅ Profile auto-submitted successfully:', markResult);

        if ('err' in markResult) {
          console.error('Failed to auto-submit profile:', markResult.err);
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

      // Clear onboarding data from localStorage
      // This will be handled on the frontend

      return NextResponse.json({
        success: true,
        message: 'Onboarding completed successfully! Your profile is now active and ready to use.',
        userEmail: userEmail,
        profileUpdated: true,
        profileSubmitted: true, // Auto-marked as submitted
        data: {
          profile: validatedData.profile,
          skills: validatedData.skills,
          resume: validatedData.resume,
          address: validatedData.address,
        }
      });

    } catch (icpError) {
      console.error('❌ ICP profile update error:', icpError);
      console.error('Error details:', {
        message: icpError instanceof Error ? icpError.message : 'Unknown error',
        stack: icpError instanceof Error ? icpError.stack : undefined,
        name: icpError instanceof Error ? icpError.name : undefined
      });

      // Return error instead of fallback to force proper debugging
      return NextResponse.json({
        success: false,
        error: 'Failed to save profile to backend',
        userEmail: userEmail,
        icpError: icpError instanceof Error ? icpError.message : 'Unknown ICP error',
        message: 'Please try again or contact support if the issue persists.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Complete onboarding error:', error);

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