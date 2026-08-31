import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as escrowIdlFactory } from '@/lib/declarations/escrow/escrow.did.js';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const { id: escrowId } = await params;

    if (!escrowId) {
      return NextResponse.json({
        success: false,
        error: 'Escrow ID is required',
      }, { status: 400 });
    }

    const escrowActor = await getMainnetEscrowActor();

    try {
      const result: any = await escrowActor.refresh_funding(escrowId);

      return NextResponse.json({
        success: true,
        data: {
          funded: result.funded,
          balanceE8s: Number(result.balanceE8s),
        },
      });
    } catch (escrowError: any) {
      console.error('Escrow refresh error:', escrowError);
      return NextResponse.json({
        success: false,
        error: escrowError.message || 'Failed to refresh escrow funding status',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Escrow refresh API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh escrow funding status',
    }, { status: 500 });
  }
}

// Get escrow actor for ICP mainnet
async function getMainnetEscrowActor() {
  const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';
  const agent = new HttpAgent({ host: IC_HOST });

  // Only fetch root key for localhost development
  if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  if (!process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_ESCROW_CANISTER_ID is required');
  }

  const canisterId = Principal.fromText(process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID);
  return Actor.createActor(escrowIdlFactory, {
    agent,
    canisterId,
  });
}
