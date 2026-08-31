import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// GET /api/hackathon/stats/hackathons - Get hackathon statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await HackathonCanister.getHackathonStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting hackathon stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get hackathon statistics'
    }, { status: 500 });
  }
}