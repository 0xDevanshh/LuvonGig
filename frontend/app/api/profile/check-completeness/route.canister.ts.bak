import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { getUserActor } from '@/lib/ic-agent';
import {
  getCachedProfile,
  setCachedProfile,
  clearProfileCache,
  getProfileCacheTTL,
} from '../cache';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Profile check started at:', new Date().toISOString());

  try {
    const sessionStart = Date.now();
    const session = await getCurrentSession();
    console.log('⏱️ Session lookup took:', Date.now() - sessionStart, 'ms');

    if (!session) {
      console.log('⚠️ No session found, returning incomplete profile status');
      return NextResponse.json({
        success: true,
        isComplete: false,
        profileSubmitted: false,
        profile: {
          firstName: '',
          lastName: '',
          email: '',
          bio: '',
          phone: '',
          location: '',
          website: '',
          linkedin: '',
          github: '',
          twitter: '',
          skills: [],
          hasResume: false,
          profileImage: '',
        },
        completionPercentage: 0,
        missingFields: ['Authentication required'],
        message: 'Please log in to check your profile status',
        userEmail: '',
        details: {
          hasBasicInfo: false,
          hasContactInfo: false,
          hasLocation: false,
          hasSkills: false,
          hasResume: false,
          hasBio: false
        }
      });
    }

    // Check cache first
    const cacheStart = Date.now();
    const cachedData = getCachedProfile(session.email);
    if (cachedData) {
      console.log('📋 Returning cached profile data for:', session.email);
      console.log('⏱️ Cache lookup took:', Date.now() - cacheStart, 'ms');
      console.log('⏱️ Total response time:', Date.now() - startTime, 'ms');
      return NextResponse.json(cachedData);
    }
    console.log('⏱️ Cache lookup took:', Date.now() - cacheStart, 'ms');

    try {
      console.log('🔍 Environment check:');
      console.log('  • IC_HOST:', process.env.NEXT_PUBLIC_IC_HOST);
      console.log('  • USER_CANISTER_ID:', process.env.NEXT_PUBLIC_USER_CANISTER_ID);

      const actorStart = Date.now();
      const actor = await getUserActor();
      console.log('✅ User actor created successfully');
      console.log('⏱️ Actor creation took:', Date.now() - actorStart, 'ms');

      // Get user profile from ICP backend using email with timeout
      console.log('🔍 Checking profile completeness for user:', session.email);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('ICP request timeout')), 15000) // Increased to 15 seconds
      );

      const userResultPromise = actor.getUserByEmail(session.email);

      let userResult;
      try {
        const icpStart = Date.now();
        userResult = await Promise.race([userResultPromise, timeoutPromise]);
        console.log('📊 Retrieved user result:', userResult);
        console.log('⏱️ ICP call took:', Date.now() - icpStart, 'ms');
      } catch (timeoutError) {
        console.log('⏰ ICP request timed out after 15 seconds, returning fallback response');
        throw timeoutError;
      }

      if (!userResult || userResult.length === 0) {
        return NextResponse.json({
          success: true,
          isComplete: false,
          profileSubmitted: false,
          profile: null,
          message: 'Profile not found - please complete onboarding',
          userEmail: session.email,
        });
      }

      // Extract the user from the array result
      const userProfile = userResult[0];
      
      // Try to get profile submitted status, but handle case where method doesn't exist
      let profileSubmitted = false;
      try {
        profileSubmitted = await actor.isProfileSubmitted(userProfile.id);
      } catch (error: any) {
        // Method doesn't exist on deployed canister - default to false
        // If profile exists, we can infer it's been submitted/active
        if (error?.message?.includes('no update method') || error?.message?.includes('method not found')) {
          console.warn('⚠️ isProfileSubmitted method not available on canister - using fallback');
          profileSubmitted = userProfile.profile !== null && userProfile.profile.length > 0;
        } else {
          console.warn('⚠️ Error checking profile submission status:', error?.message || error);
          profileSubmitted = false;
        }
      }

      console.log('📊 Extracted user profile:', userProfile);
      console.log('📊 Profile submitted status:', profileSubmitted);

      // Get profile data from the user
      const profileData = userProfile.profile && userProfile.profile[0] ? userProfile.profile[0] : null;

      // Comprehensive profile completeness check
      const hasBasicInfo = profileData && profileData.firstName && profileData.lastName &&
        profileData.firstName.trim() !== '' && profileData.lastName.trim() !== '';

      const hasContactInfo = profileData && profileData.phone && profileData.phone.length > 0 &&
        profileData.phone[0] && profileData.phone[0].trim() !== '';

      const hasLocation = profileData && profileData.location && profileData.location.length > 0 &&
        profileData.location[0] && profileData.location[0].trim() !== '';

      const hasSkills = profileData && profileData.skills && profileData.skills.length > 0;

      const hasResume = profileData && profileData.resumeUrl && profileData.resumeUrl.length > 0 &&
        profileData.resumeUrl[0] && profileData.resumeUrl[0].trim() !== '';

      const hasBio = profileData && profileData.bio && profileData.bio.length > 0 &&
        profileData.bio[0] && profileData.bio[0].trim() !== '';

      // Calculate completion percentage
      const completionChecks = [
        hasBasicInfo,
        hasContactInfo,
        hasLocation,
        hasSkills,
        hasResume,
        hasBio
      ];
      
      const completedChecks = completionChecks.filter(Boolean).length;
      const completionPercentage = Math.round((completedChecks / completionChecks.length) * 100);
      
      const isProfileComplete = hasBasicInfo && hasContactInfo && hasLocation && hasSkills;

      // Transform profile data for frontend
      const transformedProfile = {
        firstName: profileData ? profileData.firstName || '' : '',
        lastName: profileData ? profileData.lastName || '' : '',
        email: session.email || '',
        bio: profileData && profileData.bio && profileData.bio.length > 0 ? profileData.bio[0] || '' : '',
        phone: profileData && profileData.phone && profileData.phone.length > 0 ? profileData.phone[0] || '' : '',
        location: profileData && profileData.location && profileData.location.length > 0 ? profileData.location[0] || '' : '',
        website: profileData && profileData.website && profileData.website.length > 0 ? profileData.website[0] || '' : '',
        linkedin: profileData && profileData.linkedin && profileData.linkedin.length > 0 ? profileData.linkedin[0] || '' : '',
        github: profileData && profileData.github && profileData.github.length > 0 ? profileData.github[0] || '' : '',
        twitter: profileData && profileData.twitter && profileData.twitter.length > 0 ? profileData.twitter[0] || '' : '',
        skills: profileData ? profileData.skills || [] : [],
        hasResume: profileData && profileData.resumeUrl && profileData.resumeUrl.length > 0 ? !!profileData.resumeUrl[0] : false,
        profileImage: profileData && profileData.profileImageUrl && profileData.profileImageUrl.length > 0 ? profileData.profileImageUrl[0] || '' : '',
      };

      // Generate detailed completion message
      const missingFields = [];
      if (!hasBasicInfo) missingFields.push('Basic Information (Name)');
      if (!hasContactInfo) missingFields.push('Contact Information (Phone)');
      if (!hasLocation) missingFields.push('Location');
      if (!hasSkills) missingFields.push('Skills');
      if (!hasResume) missingFields.push('Resume');
      if (!hasBio) missingFields.push('Bio');

      const message = isProfileComplete
        ? 'Profile is complete and active!'
        : `Profile is ${completionPercentage}% complete. Missing: ${missingFields.join(', ')}`;

      console.log('📊 Profile completeness analysis:', {
        isComplete: isProfileComplete,
        completionPercentage,
        missingFields,
        userEmail: session.email
      });

      const processingStart = Date.now();
      const responseData = {
        success: true,
        isComplete: isProfileComplete,
        profileSubmitted,
        profile: transformedProfile,
        completionPercentage,
        missingFields,
        message,
        userEmail: session.email,
        details: {
          hasBasicInfo,
          hasContactInfo,
          hasLocation,
          hasSkills,
          hasResume,
          hasBio
        }
      };

      console.log('⏱️ Profile processing took:', Date.now() - processingStart, 'ms');

      // Cache the response for future requests
      setCachedProfile(session.email, responseData, getProfileCacheTTL());

      const totalTime = Date.now() - startTime;
      console.log('⏱️ Total response time:', totalTime, 'ms');

      return NextResponse.json(responseData);

    } catch (icpError) {
      console.error('ICP profile fetch error:', icpError);
      console.log('⚠️ Backend error for user:', session.email);
      console.log('Error details:', {
        message: icpError instanceof Error ? icpError.message : 'Unknown error',
        stack: icpError instanceof Error ? icpError.stack : undefined
      });

      // Clear any stale cached data
      clearProfileCache(session.email);

      // Return a more user-friendly response instead of an error
      return NextResponse.json({
        success: true,
        isComplete: false,
        profileSubmitted: false,
        profile: {
          firstName: '',
          lastName: '',
          email: session.email,
          bio: '',
          phone: '',
          location: '',
          website: '',
          linkedin: '',
          github: '',
          twitter: '',
          skills: [],
          hasResume: false,
          profileImage: '',
        },
        completionPercentage: 0,
        missingFields: ['Backend connection issue'],
        message: 'Unable to check profile status. Please try again later.',
        userEmail: session.email,
        details: {
          hasBasicInfo: false,
          hasContactInfo: false,
          hasLocation: false,
          hasSkills: false,
          hasResume: false,
          hasBio: false
        },
        backendError: true
      });
    }

  } catch (error) {
    console.error('Profile check error:', error);

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}