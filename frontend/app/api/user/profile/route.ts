import { NextRequest, NextResponse } from 'next/server';
import { getUserActor } from '@/lib/ic-agent';

// Simple in-memory cache for user profile data
const userProfileCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper function to get cached data
function getCachedData(email: string): any | null {
  const cached = userProfileCache.get(email);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
}

// Helper function to set cached data
function setCachedData(email: string, data: any): void {
  userProfileCache.set(email, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  });
}

// Get user profile by email (for chat purposes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter is required'
      }, { status: 400 });
    }

    // Check cache first
    const cachedData = getCachedData(email);
    if (cachedData) {
      console.log('📋 Returning cached user profile for:', email);
      return NextResponse.json({
        success: true,
        data: cachedData
      });
    }

    try {
      console.log('🔍 Fetching user profile for email:', email);

      const actor = await getUserActor();

      // Get user by email
      const userResult = await actor.getUserByEmail(email);

      if (!userResult || userResult.length === 0) {
        console.log('⚠️ User not found for email:', email);

        // Return basic profile from email
        const basicProfile = {
          email: email,
          firstName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          lastName: '',
          displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          bio: '',
          location: '',
          profileImage: '',
          isOnline: false,
          lastSeen: null
        };

        // Cache the basic profile
        setCachedData(email, basicProfile);

        return NextResponse.json({
          success: true,
          data: basicProfile
        });
      }

      // Extract user data
      const userProfile = userResult[0];
      const profileData = userProfile.profile && userProfile.profile[0] ? userProfile.profile[0] : null;

      // Transform profile data for chat
      const transformedProfile = {
        userId: userProfile.id,
        email: email,
        firstName: profileData ? profileData.firstName || '' : '',
        lastName: profileData ? profileData.lastName || '' : '',
        displayName: profileData && (profileData.firstName || profileData.lastName)
          ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
          : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        bio: profileData && profileData.bio && profileData.bio.length > 0 ? profileData.bio[0] || '' : '',
        location: profileData && profileData.location && profileData.location.length > 0 ? profileData.location[0] || '' : '',
        profileImage: profileData && profileData.profileImageUrl && profileData.profileImageUrl.length > 0
          ? profileData.profileImageUrl[0] || ''
          : '',
        skills: profileData ? profileData.skills || [] : [],
        phone: profileData && profileData.phone && profileData.phone.length > 0 ? profileData.phone[0] || '' : '',
        website: profileData && profileData.website && profileData.website.length > 0 ? profileData.website[0] || '' : '',
        linkedin: profileData && profileData.linkedin && profileData.linkedin.length > 0 ? profileData.linkedin[0] || '' : '',
        github: profileData && profileData.github && profileData.github.length > 0 ? profileData.github[0] || '' : '',
        isOnline: false, // TODO: Implement online status tracking
        lastSeen: null, // TODO: Implement last seen tracking
        profileSubmitted: await (async () => {
          try {
            return await actor.isProfileSubmitted(userProfile.id);
          } catch (error: any) {
            // Method doesn't exist on deployed canister - default to false
            if (error?.message?.includes('no update method') || error?.message?.includes('method not found')) {
              console.warn('⚠️ isProfileSubmitted method not available on canister - defaulting to false');
              return false;
            }
            throw error; // Re-throw other errors
          }
        })()
      };

      console.log('✅ Retrieved user profile for:', email);

      // Cache the response
      setCachedData(email, transformedProfile);

      return NextResponse.json({
        success: true,
        data: transformedProfile
      });

    } catch (icpError) {
      console.error('ICP user profile fetch error:', icpError);

      // Fallback to basic profile from email
      const basicProfile = {
        email: email,
        firstName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        lastName: '',
        displayName: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        bio: '',
        location: '',
        profileImage: '',
        isOnline: false,
        lastSeen: null,
        fallback: true
      };

      return NextResponse.json({
        success: true,
        data: basicProfile,
        fallback: true
      });
    }

  } catch (error) {
    console.error('User profile fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user profile'
    }, { status: 500 });
  }
}