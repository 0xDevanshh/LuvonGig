import { NextRequest, NextResponse } from 'next/server';
import { testHackathonCanister, initializeHackathon } from '@/lib/hackathon-agent';

export async function GET(request: NextRequest) {
  try {
    // Initialize the hackathon agent
    await initializeHackathon();

    // Test the canister
    const result = await testHackathonCanister();

    return NextResponse.json({
      success: true,
      message: result,
      canisterId: process.env.HACKATHON_CANISTER_ID,
    });

  } catch (error) {
    console.error('Hackathon test error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to hackathon canister',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}