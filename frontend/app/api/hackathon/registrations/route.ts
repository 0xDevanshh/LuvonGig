import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/registrations - List registrations with optional hackathon filter and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const hackathonId = searchParams.get('hackathon_id');

    const registrations = await HackathonCanister.listRegistrations(hackathonId, limit, offset);

    return NextResponse.json({
      success: true,
      data: registrations,
      count: registrations.length,
      limit,
      offset,
      hackathonId
    });
  } catch (error) {
    console.error('Error listing registrations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list registrations'
    }, { status: 500 });
  }
}

// POST /api/hackathon/registrations - Create new registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required field
    if (!body.hackathon_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: hackathon_id'
      }, { status: 400 });
    }

    // Validate that at least participant_id or team_id is provided
    if (!body.participant_id && !body.team_id) {
      return NextResponse.json({
        success: false,
        error: 'Either participant_id or team_id must be provided'
      }, { status: 400 });
    }

    // Validate that not both participant_id and team_id are provided
    if (body.participant_id && body.team_id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot register both participant and team simultaneously'
      }, { status: 400 });
    }

    // Validate hackathon_id format
    if (typeof body.hackathon_id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid hackathon_id format'
      }, { status: 400 });
    }

    const registration = await HackathonCanister.createRegistration(body);

    if (!registration) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create registration. Make sure hackathon exists and participant/team is valid.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: registration,
      message: 'Registration created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create registration'
    }, { status: 500 });
  }
}