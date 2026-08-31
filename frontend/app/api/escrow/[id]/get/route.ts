import { NextRequest, NextResponse } from 'next/server';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as escrowIdlFactory } from '@/lib/declarations/escrow/escrow.did.js';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: escrowId } = await params;

    if (!escrowId) {
      return NextResponse.json({
        success: false,
        error: 'Escrow ID is required',
      }, { status: 400 });
    }

    const escrowActor = await getMainnetEscrowActor();

    try {
      const escrow = await escrowActor.get(escrowId);

      return NextResponse.json({
        success: true,
        data: {
          escrowId: escrow.escrowId,
          projectId: escrow.projectId,
          client: escrow.client.toText(),
          freelancer: escrow.freelancer.toText(),
          expectedE8s: Number(escrow.expectedE8s),
          status: escrow.status,
          createdAtNs: Number(escrow.createdAtNs),
          fundedAtNs: escrow.fundedAtNs ? Number(escrow.fundedAtNs) : null,
          releaseAtNs: escrow.releaseAtNs ? Number(escrow.releaseAtNs) : null,
          ledgerBlockIndex: escrow.ledgerBlockIndex ? Number(escrow.ledgerBlockIndex) : null,
        },
      });
    } catch (escrowError: any) {
      console.error('Escrow get error:', escrowError);
      return NextResponse.json({
        success: false,
        error: escrowError.message || 'Failed to get escrow',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Escrow get API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get escrow',
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

