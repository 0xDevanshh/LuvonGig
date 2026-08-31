import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/teams - List teams with optional hackathon filter and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const hackathonId = searchParams.get('hackathon_id');

    const teams = await HackathonCanister.listTeams(hackathonId, limit, offset);

    return NextResponse.json({
      success: true,
      data: teams,
      count: teams.length,
      limit,
      offset,
      hackathonId
    });
  } catch (error) {
    console.error('Error listing teams:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list teams'
    }, { status: 500 });
  }
}

// POST /api/hackathon/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'team_name', 'leader_id', 'hackathon_id', 'project_title', 'project_idea'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate that team leader exists (basic validation)
    if (!body.leader_id || typeof body.leader_id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid leader_id format'
      }, { status: 400 });
    }

    // Validate hackathon_id format
    if (!body.hackathon_id || typeof body.hackathon_id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid hackathon_id format'
      }, { status: 400 });
    }

    const team = await HackathonCanister.createTeam(body);

    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create team. Make sure hackathon and leader exist.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: team,
      message: 'Team created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create team'
    }, { status: 500 });
  }
}