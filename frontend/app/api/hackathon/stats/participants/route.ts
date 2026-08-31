import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/stats/participants - Get participant statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await HackathonCanister.getParticipantStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting participant stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get participant statistics'
    }, { status: 500 });
  }
}