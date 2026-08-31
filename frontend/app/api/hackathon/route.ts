import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon - List hackathons with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const hackathons = await HackathonCanister.listHackathons(limit, offset);

    return NextResponse.json({
      success: true,
      data: hackathons,
      count: hackathons.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error listing hackathons:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list hackathons'
    }, { status: 500 });
  }
}

// POST /api/hackathon - Create new hackathon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'title', 'tagline', 'description', 'theme', 'mode',
      'location', 'start_date', 'end_date', 'registration_start', 'registration_end',
      'min_team_size', 'max_team_size', 'prize_pool', 'rules'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate mode
    const validModes = ['Online', 'Offline', 'Hybrid'];
    if (!validModes.includes(body.mode)) {
      return NextResponse.json({
        success: false,
        error: `Invalid mode. Must be one of: ${validModes.join(', ')}`
      }, { status: 400 });
    }

    // Validate team sizes
    if (body.min_team_size > body.max_team_size) {
      return NextResponse.json({
        success: false,
        error: 'min_team_size cannot be greater than max_team_size'
      }, { status: 400 });
    }

    const hackathon = await HackathonCanister.createHackathon(body);

    return NextResponse.json({
      success: true,
      data: hackathon,
      message: 'Hackathon created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating hackathon:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create hackathon'
    }, { status: 500 });
  }
}