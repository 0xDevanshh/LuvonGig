import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/[hackathonId] - Get hackathon by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    const { hackathonId } = await params;

    if (!hackathonId) {
      return NextResponse.json({
        success: false,
        error: 'Hackathon ID is required'
      }, { status: 400 });
    }

    const hackathon = await HackathonCanister.getHackathonById(hackathonId);

    return NextResponse.json({
      success: true,
      data: hackathon
    });
  } catch (error) {
    console.error('Error getting hackathon:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get hackathon'
    }, { status: 500 });
  }
}

// PUT /api/hackathon/[hackathonId] - Update hackathon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    const { hackathonId } = await params;
    const body = await request.json();

    if (!hackathonId) {
      return NextResponse.json({
        success: false,
        error: 'Hackathon ID is required'
      }, { status: 400 });
    }

    // Validate required fields
    const requiredFields = [
      'hackathon_id', 'title', 'tagline', 'description', 'theme', 'mode',
      'location', 'start_date', 'end_date', 'registration_start', 'registration_end',
      'min_team_size', 'max_team_size', 'prize_pool', 'rules', 'status'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate that hackathon_id matches URL parameter
    if (body.hackathon_id !== hackathonId) {
      return NextResponse.json({
        success: false,
        error: 'hackathon_id in request body must match URL parameter'
      }, { status: 400 });
    }

    // Validate mode
    const validModes = ['Online', 'Offline', 'Hybrid'];
    if (!validModes.includes(body.mode)) {
      return NextResponse.json({
        success: false,
        error: `Invalid mode. Must be one of: ${validModes.join(', ')}`
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    const updatedHackathon = await HackathonCanister.updateHackathon(hackathonId, body);

    return NextResponse.json({
      success: true,
      data: updatedHackathon,
      message: 'Hackathon updated successfully'
    });
  } catch (error) {
    console.error('Error updating hackathon:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update hackathon'
    }, { status: 500 });
  }
}

// DELETE /api/hackathon/[hackathonId] - Delete hackathon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    const { hackathonId } = await params;

    if (!hackathonId) {
      return NextResponse.json({
        success: false,
        error: 'Hackathon ID is required'
      }, { status: 400 });
    }

    const result = await HackathonCanister.deleteHackathon(hackathonId);

    return NextResponse.json({
      success: true,
      data: { deleted: result },
      message: 'Hackathon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hackathon:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete hackathon'
    }, { status: 500 });
  }
}