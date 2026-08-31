import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as escrowIdlFactory } from '@/lib/declarations/escrow/escrow.did.js';
import { getUserActor } from '@/lib/ic-agent';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get escrow actor for mainnet
    const escrowActor = await getMainnetEscrowActor();

    console.log('🔍 Attempting to get escrow for refund:', escrowId);

    // Try to find the escrow - if not found with given ID, try different counter values
    let escrow;
    let foundEscrowId = escrowId;
    let escrowFound = false;

    try {
      // First try the provided escrow ID
      escrow = await escrowActor.get(escrowId);
      escrowFound = true;
      console.log('✅ Escrow found with provided ID:', escrowId);
    } catch (getError: any) {
      // Check if it's an "Escrow not found" error
      const errorMessage = getError.message || '';
      if (errorMessage.includes('Escrow not found') || errorMessage.includes('not found')) {
        console.log('⚠️ Escrow not found with ID:', escrowId);
        
        // Try to extract projectId and try different counter values
        // Escrow ID format is: projectId:counter (e.g., SVC_123:0, SVC_123:1, etc.)
        if (escrowId.includes(':')) {
          const parts = escrowId.split(':');
          const projectId = parts.slice(0, -1).join(':'); // Handle projectIds that might contain colons
          
          console.log(`🔍 Trying to find escrow with projectId: ${projectId}`);
          
          // Try counter values from 0 to 100
          for (let i = 0; i <= 100; i++) {
            const tryEscrowId = `${projectId}:${i}`;
            try {
              escrow = await escrowActor.get(tryEscrowId);
              foundEscrowId = tryEscrowId;
              escrowFound = true;
              console.log(`✅ Found escrow with ID: ${tryEscrowId}`);
              break;
            } catch (e: any) {
              // Not found, continue
            }
            
            // Small delay every 10 attempts to avoid rate limiting
            if (i % 10 === 0 && i > 0) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }
        
        if (!escrowFound) {
          console.error('❌ Escrow not found after trying multiple IDs');
          return NextResponse.json({
            success: false,
            error: `Escrow not found: ${escrowId}. Tried multiple variations but none matched.`,
            escrowId: escrowId,
            suggestion: 'Please verify the escrow was created and the escrow ID is correct. Check your booking details or contact support.'
          }, { status: 404 });
        }
      } else {
        // Re-throw if it's a different error
        throw getError;
      }
    }

    // Use the found escrow - update escrowId variable for subsequent calls
    const actualEscrowId = foundEscrowId; // Use a new variable since escrowId is const

    try {
      // Get current user's wallet principal
      const userActor = await getUserActor();
      const user = await userActor.getUserById(session.userId);
      
      if (!user || user.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User not found',
        }, { status: 404 });
      }

      const userData = user[0];
      if (!userData.walletPrincipal || userData.walletPrincipal.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User wallet not connected',
        }, { status: 400 });
      }

      const userPrincipal = userData.walletPrincipal[0];

      // Check if user is the client
      if (escrow.client.toString() !== userPrincipal.toString()) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized: only the client can refund escrow',
        }, { status: 403 });
      }

      // Check escrow status - cannot refund if already released
      if ('released' in escrow.status) {
        return NextResponse.json({
          success: false,
          error: 'Cannot refund a released escrow',
        }, { status: 400 });
      }

      // Refresh funding to get current balance (needed for refund to work correctly)
      console.log('Refreshing escrow funding status before refund...');
      try {
        const refreshResult = await escrowActor.refresh_funding(actualEscrowId); // Use the found escrow ID
        console.log('Refresh funding result:', {
          funded: refreshResult.funded,
          balanceE8s: Number(refreshResult.balanceE8s)
        });
        
        if (Number(refreshResult.balanceE8s) === 0) {
          return NextResponse.json({
            success: false,
            error: 'No funds available to refund',
          }, { status: 400 });
        }
      } catch (refreshError: any) {
        console.error('Error refreshing funding:', refreshError);
        // Continue anyway - the refund call will check balance
      }

      // Refund the escrow (use the found escrow ID)
      console.log('Refunding escrow:', actualEscrowId);
      const refundResult = await escrowActor.refund(actualEscrowId);

      if ('err' in refundResult) {
        return NextResponse.json({
          success: false,
          error: refundResult.err,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          blockIndex: Number(refundResult.ok),
          message: 'Escrow refunded successfully. Funds have been returned to your wallet.',
        },
      });

    } catch (escrowError: any) {
      console.error('Escrow refund error:', escrowError);
      return NextResponse.json({
        success: false,
        error: escrowError.message || 'Failed to refund escrow',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Escrow refund API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refund escrow',
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

