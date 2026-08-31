import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/participants - List participants with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const participants = await HackathonCanister.listParticipants(limit, offset);

    return NextResponse.json({
      success: true,
      data: participants,
      count: participants.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error listing participants:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list participants'
    }, { status: 500 });
  }
}

// POST /api/hackathon/participants - Create new participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'full_name', 'email', 'phone', 'college', 'year_of_study', 'skills'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Validate skills is an array
    if (!Array.isArray(body.skills)) {
      return NextResponse.json({
        success: false,
        error: 'Skills must be an array'
      }, { status: 400 });
    }

    const participant = await HackathonCanister.createParticipant(body);

    return NextResponse.json({
      success: true,
      data: participant,
      message: 'Participant created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating participant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create participant'
    }, { status: 500 });
  }
}