import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/participants/[participantId] - Get participant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const { participantId } = await params;

    if (!participantId) {
      return NextResponse.json({
        success: false,
        error: 'Participant ID is required'
      }, { status: 400 });
    }

    const participant = await HackathonCanister.getParticipantById(participantId);

    return NextResponse.json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Error getting participant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get participant'
    }, { status: 500 });
  }
}

// PUT /api/hackathon/participants/[participantId] - Update participant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const { participantId } = await params;
    const body = await request.json();

    if (!participantId) {
      return NextResponse.json({
        success: false,
        error: 'Participant ID is required'
      }, { status: 400 });
    }

    // Validate required fields
    const requiredFields = [
      'participant_id', 'full_name', 'email', 'phone', 'college', 'year_of_study', 'skills'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate that participant_id matches URL parameter
    if (body.participant_id !== participantId) {
      return NextResponse.json({
        success: false,
        error: 'participant_id in request body must match URL parameter'
      }, { status: 400 });
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

    const updatedParticipant = await HackathonCanister.updateParticipant(participantId, body);

    return NextResponse.json({
      success: true,
      data: updatedParticipant,
      message: 'Participant updated successfully'
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update participant'
    }, { status: 500 });
  }
}

// DELETE /api/hackathon/participants/[participantId] - Delete participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const { participantId } = await params;

    if (!participantId) {
      return NextResponse.json({
        success: false,
        error: 'Participant ID is required'
      }, { status: 400 });
    }

    const result = await HackathonCanister.deleteParticipant(participantId);

    return NextResponse.json({
      success: true,
      data: { deleted: result },
      message: 'Participant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete participant'
    }, { status: 500 });
  }
}