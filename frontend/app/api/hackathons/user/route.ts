import { NextRequest, NextResponse } from 'next/server';
import { getHackathonAgent } from '@/lib/hackathon-agent';
import { getAdditionalHackathonData, getHackathonsByOrganizer } from '@/lib/hackathon-storage';

// GET /api/hackathons/user - Get hackathons created by the logged-in user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User email is required'
      }, { status: 400 });
    }

    console.log('Fetching hackathons for user:', userEmail);

    const agent = await getHackathonAgent();
    if (!agent) {
      console.error('Failed to connect to hackathon canister');
      // Return empty array if canister is not available
      return NextResponse.json({
        success: true,
        hackathons: [],
        message: 'Hackathon service temporarily unavailable'
      });
    }

    let userHackathons: any[] = [];

    // Try to get hackathons from canister first
    try {
      const result = await agent.listHackathons(BigInt(1000), BigInt(0)); // Get first 1000 hackathons

      if (!('err' in result)) {
        let allHackathons = (result as any).ok || [];

        // Filter hackathons created by this user
        userHackathons = allHackathons.filter((hackathon: any) => {
          const additionalData = getAdditionalHackathonData(hackathon.hackathon_id);
          return additionalData?.organizer_email === userEmail;
        });
      }
    } catch (canisterError) {
      console.warn('⚠️ Failed to fetch from canister:', canisterError);
    }

    // Also get hackathons from additional storage (for mock IDs and canister failures)
    try {
      const storageHackathonsData = getHackathonsByOrganizer(userEmail);

      const storageHackathons = storageHackathonsData.map((data: any) => ({
        hackathon_id: data.hackathon_id,
        title: data.title || 'Hackathon', // Use actual title from storage
        tagline: data.tagline || 'Created hackathon',
        description: data.description || 'Hackathon created through the platform',
        theme: data.theme || 'General',
        mode: data.mode || { Online: null },
        location: data.location || 'Virtual',
        start_date: data.start_date || new Date().toISOString(),
        end_date: data.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        registration_start: data.registration_start || new Date().toISOString(),
        registration_end: data.registration_end || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        min_team_size: data.min_team_size || 1,
        max_team_size: data.max_team_size || 4,
        prize_pool: data.prize_pool || data.prizes?.reduce((total: number, prize: any) => {
          return total + (prize.type === 'cash' ? prize.amount : 0);
        }, 0).toString() || '0',
        rules: data.rules || '',
        status: data.status || { Upcoming: null },
        created_at: data.created_at ? new Date(data.created_at / 1000000).toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? new Date(data.updated_at / 1000000).toISOString() : new Date().toISOString(),
        ...data,
        isOwner: true,
        canEdit: true,
        canDelete: true,
        participantCount: 0,
        teamsCount: 0
      }));

      // Merge canister and storage hackathons, avoiding duplicates
      const existingIds = new Set(userHackathons.map(h => h.hackathon_id));
      const newHackathons = storageHackathons.filter(h => !existingIds.has(h.hackathon_id));
      userHackathons = [...userHackathons, ...newHackathons];

    } catch (storageError) {
      console.warn('⚠️ Failed to fetch from storage:', storageError);
    }

    // Transform canister data to match frontend interface
    const transformedHackathons = userHackathons.map((hackathon: any) => {
      const additionalData = getAdditionalHackathonData(hackathon.hackathon_id);

      return {
        hackathon_id: hackathon.hackathon_id,
        title: hackathon.title,
        tagline: hackathon.tagline,
        description: hackathon.description,
        theme: hackathon.theme,
        mode: hackathon.mode,
        location: hackathon.location,
        start_date: hackathon.start_date,
        end_date: hackathon.end_date,
        registration_start: hackathon.registration_start,
        registration_end: hackathon.registration_end,
        min_team_size: hackathon.min_team_size,
        max_team_size: hackathon.max_team_size,
        prize_pool: hackathon.prize_pool,
        rules: hackathon.rules,
        status: hackathon.status,
        created_at: hackathon.created_at,
        updated_at: hackathon.updated_at,

        // Additional data from storage
        banner_image: additionalData?.banner_image || '',
        registration_fee: additionalData?.registration_fee || 0,
        max_participants: additionalData?.max_participants || 100,
        prizes: additionalData?.prizes || [],
        judges: additionalData?.judges || [],
        schedule: additionalData?.schedule || [],
        tags: additionalData?.tags || [],
        social_links: additionalData?.social_links || [],
        organizer_email: additionalData?.organizer_email || userEmail,

        // UI-specific fields
        isOwner: true,
        canEdit: true,
        canDelete: true,
        participantCount: 0, // This would need to be implemented in the canister
        teamsCount: 0 // This would need to be implemented in the canister
      };
    });

    // Sort by creation date (newest first)
    transformedHackathons.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    console.log(`Returning ${transformedHackathons.length} hackathons for user ${userEmail}`);

    return NextResponse.json({
      success: true,
      hackathons: transformedHackathons,
      total: transformedHackathons.length
    });

  } catch (error) {
    console.error('Error in GET /api/hackathons/user:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      hackathons: []
    }, { status: 500 });
  }
}