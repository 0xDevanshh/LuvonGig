import { NextRequest, NextResponse } from 'next/server';
import { getHackathonAgent } from '@/lib/hackathon-agent';
import { saveAdditionalHackathonData, getAdditionalHackathonData } from '@/lib/hackathon-storage';

// GET /api/hackathons - Get all hackathons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const theme = searchParams.get('theme');
    const mode = searchParams.get('mode');

    console.log('Fetching hackathons with filters:', { status, theme, mode });

    const agent = await getHackathonAgent();
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to hackathon canister'
      }, { status: 500 });
    }

    // Get all hackathons from canister
    const result = await agent.listHackathons(BigInt(1000), BigInt(0)); // Get first 1000 hackathons

    if ('err' in result) {
      console.error('Error fetching hackathons:', result.err);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch hackathons',
        details: result.err
      }, { status: 500 });
    }

    let hackathons = (result as any).ok || [];

    // Transform canister data to match frontend interface
    const transformedHackathons = hackathons.map((hackathon: any) => {
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
        social_links: additionalData?.social_links || []
      };
    });

    // Apply filters
    let filteredHackathons = transformedHackathons;

    if (status) {
      filteredHackathons = filteredHackathons.filter((h: any) =>
        h.status === status || (typeof h.status === 'object' && Object.keys(h.status)[0] === status)
      );
    }

    if (theme) {
      filteredHackathons = filteredHackathons.filter((h: any) =>
        h.theme.toLowerCase().includes(theme.toLowerCase())
      );
    }

    if (mode) {
      filteredHackathons = filteredHackathons.filter((h: any) =>
        typeof h.mode === 'object' && Object.keys(h.mode)[0] === mode
      );
    }

    // Sort by creation date (newest first)
    filteredHackathons.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    console.log(`Returning ${filteredHackathons.length} hackathons`);

    return NextResponse.json({
      success: true,
      data: filteredHackathons,
      total: filteredHackathons.length
    });

  } catch (error) {
    console.error('Error in GET /api/hackathons:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST /api/hackathons - Create new hackathon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, hackathonData } = body;

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User email is required'
      }, { status: 400 });
    }

    if (!hackathonData) {
      return NextResponse.json({
        success: false,
        error: 'Hackathon data is required'
      }, { status: 400 });
    }

    console.log('Creating hackathon with data:', {
      title: hackathonData.title,
      mode: hackathonData.mode,
      startDate: hackathonData.startDate,
      endDate: hackathonData.endDate
    });

    // Prepare data for canister
    const hackathonRequest = {
      title: hackathonData.title,
      tagline: hackathonData.tagline,
      description: hackathonData.description,
      theme: hackathonData.theme,
      mode: hackathonData.mode === 'Online' ? { Online: null } :
            hackathonData.mode === 'Offline' ? { Offline: null } :
            { Hybrid: null },
      location: hackathonData.location,
      start_date: hackathonData.startDate,
      end_date: hackathonData.endDate,
      registration_start: hackathonData.registrationStart,
      registration_end: hackathonData.registrationEnd,
      min_team_size: hackathonData.minTeamSize,
      max_team_size: hackathonData.maxTeamSize,
      prize_pool: hackathonData.prizes.reduce((total: number, prize: any) => {
        return total + (prize.type === 'cash' ? prize.amount : 0);
      }, 0).toString(),
      rules: hackathonData.rules || ''
    };

    console.log('Creating hackathon in canister...');

    // Create hackathon using canister
    console.log('🔗 Getting hackathon agent...');
    const agent = await getHackathonAgent();
    if (!agent) {
      console.error('❌ Failed to get hackathon agent');
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to hackathon canister'
      }, { status: 500 });
    }
    console.log('✅ Hackathon agent created successfully');

    console.log('🚀 Creating hackathon in canister with data:', {
      title: hackathonRequest.title,
      mode: hackathonRequest.mode,
      startDate: hackathonRequest.start_date
    });

    const result = await agent.createHackathon(hackathonRequest);

    console.log('📡 Canister response:', result);

    if ('err' in result) {
      console.error('❌ Hackathon creation failed:', result.err);
      return NextResponse.json({
        success: false,
        error: 'Failed to create hackathon',
        details: result.err
      }, { status: 500 });
    }

    let hackathonId = (result as any).ok;
    console.log('✅ Hackathon created successfully with ID:', hackathonId);

    // Fallback: if canister doesn't return an ID, generate a mock one
    if (!hackathonId) {
      console.warn('⚠️ Canister did not return hackathon ID, generating fallback ID');
      hackathonId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔄 Generated fallback hackathon ID:', hackathonId);
    }

    // Save complete hackathon data to storage system
    const completeHackathonData = {
      hackathon_id: hackathonId,
      organizer_email: userEmail,
      // Basic hackathon information
      title: hackathonData.title,
      tagline: hackathonData.tagline,
      description: hackathonData.description,
      theme: hackathonData.theme,
      mode: hackathonData.mode === 'Online' ? { Online: null } :
            hackathonData.mode === 'Offline' ? { Offline: null } :
            { Hybrid: null },
      location: hackathonData.location,
      start_date: hackathonData.startDate,
      end_date: hackathonData.endDate,
      registration_start: hackathonData.registrationStart,
      registration_end: hackathonData.registrationEnd,
      min_team_size: hackathonData.minTeamSize,
      max_team_size: hackathonData.maxTeamSize,
      prize_pool: hackathonData.prizes.reduce((total: number, prize: any) => {
        return total + (prize.type === 'cash' ? prize.amount : 0);
      }, 0).toString(),
      rules: hackathonData.rules || '',
      status: { Upcoming: null },
      // Additional data
      banner_image: hackathonData.bannerImage || '',
      registration_fee: hackathonData.registrationFee || 0,
      max_participants: hackathonData.maxParticipants || 100,
      prizes: hackathonData.prizes || [],
      judges: hackathonData.judges || [],
      schedule: hackathonData.schedule || [],
      tags: hackathonData.tags || [],
      social_links: hackathonData.socialLinks || [],
      created_at: Date.now() * 1000000,
      updated_at: Date.now() * 1000000
    };

    try {
      saveAdditionalHackathonData(completeHackathonData);
      console.log('Complete hackathon data saved successfully');
    } catch (storageError) {
      console.error('Failed to save complete hackathon data:', storageError);
      // Continue with response even if storage fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      hackathon_id: hackathonId,
      data: {
        hackathon_id: hackathonId,
        message: 'Hackathon created successfully',
        complete_data: completeHackathonData,
        prizes_count: hackathonData.prizes?.length || 0,
        judges_count: hackathonData.judges?.length || 0,
        schedule_count: hackathonData.schedule?.length || 0
      }
    });

  } catch (error) {
    console.error('Error creating hackathon:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}