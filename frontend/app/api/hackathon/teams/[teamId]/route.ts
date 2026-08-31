import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/teams/[teamId] - Get team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    const team = await HackathonCanister.getTeamById(teamId);

    return NextResponse.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error getting team:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get team'
    }, { status: 500 });
  }
}

// DELETE /api/hackathon/teams/[teamId] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    // Note: This would need to be implemented in the canister
    // For now, we'll return a not implemented response
    return NextResponse.json({
      success: false,
      error: 'Team deletion not yet implemented'
    }, { status: 501 });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete team'
    }, { status: 500 });
  }
}