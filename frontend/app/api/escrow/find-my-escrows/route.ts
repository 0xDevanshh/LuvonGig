import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as escrowIdlFactory } from '@/lib/declarations/escrow/escrow.did.js';
import { getUserActor } from '@/lib/ic-agent';
import { getMarketplaceActor } from '@/lib/ic-marketplace-agent';

// Get escrow actor for ICP mainnet
async function getMainnetEscrowActor() {
  const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';
  const agent = new HttpAgent({ host: IC_HOST });

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

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    // Get user's wallet principal
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
    const userPrincipalText = userPrincipal.toString();

    console.log('🔍 Searching for escrows for user:', userPrincipalText);

    const escrowActor = await getMainnetEscrowActor();
    const foundEscrows: Array<{
      escrowId: string;
      projectId: string;
      status: string;
      balanceE8s: number;
      expectedE8s: number;
      canRefund: boolean;
      error?: string;
    }> = [];

    // Method 1: Get escrow IDs from bookings
    const escrowIdsFromBookings: string[] = [];
    try {
      const marketplaceActor = await getMarketplaceActor();
      const bookingsResult = await marketplaceActor.listBookingsForClient(
        session.email || session.userId,
        [],
        BigInt(100),
        BigInt(0)
      );

      if ('ok' in bookingsResult) {
        for (const booking of bookingsResult.ok) {
          if (booking.payment_id) escrowIdsFromBookings.push(booking.payment_id);
          if (booking.transaction_id && booking.transaction_id !== booking.payment_id) {
            escrowIdsFromBookings.push(booking.transaction_id);
          }
          if (booking.service_id && booking.service_id.includes(':')) {
            escrowIdsFromBookings.push(booking.service_id);
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch bookings:', error);
    }

    // Method 2: Try common escrow ID patterns
    // Escrow IDs are typically: projectId:number (e.g., SVC_1234567890_ABC:1)
    const potentialEscrowIds: string[] = [...new Set(escrowIdsFromBookings)];

    // Try to find escrows by checking service IDs from bookings
    try {
      const marketplaceActor = await getMarketplaceActor();
      const bookingsResult = await marketplaceActor.listBookingsForClient(
        session.email || session.userId,
        [],
        BigInt(100),
        BigInt(0)
      );

      if ('ok' in bookingsResult) {
        for (const booking of bookingsResult.ok) {
          const serviceId = booking.service_id;
          if (serviceId) {
            // Try common patterns: serviceId:0, serviceId:1, serviceId:2, etc.
            for (let i = 0; i < 20; i++) {
              const potentialId = `${serviceId}:${i}`;
              if (!potentialEscrowIds.includes(potentialId)) {
                potentialEscrowIds.push(potentialId);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not generate potential escrow IDs:', error);
    }

    console.log(`🔍 Checking ${potentialEscrowIds.length} potential escrow IDs`);

    // Check each potential escrow ID
    for (const escrowId of potentialEscrowIds) {
      try {
        const escrow = await escrowActor.get(escrowId);
        
        // Verify user is the client
        if (escrow.client.toString() === userPrincipalText) {
          // Check balance
          const refreshResult = await escrowActor.refresh_funding(escrowId);
          
          const status = escrow.status;
          const statusStr = 'created' in status ? 'created' :
                          'funded' in status ? 'funded' :
                          'released' in status ? 'released' :
                          'refunded' in status ? 'refunded' : 'unknown';

          const canRefund = !('refunded' in status) && 
                           !('released' in status) && 
                           refreshResult.balanceE8s > 0;

          foundEscrows.push({
            escrowId: escrow.escrowId,
            projectId: escrow.projectId,
            status: statusStr,
            balanceE8s: Number(refreshResult.balanceE8s),
            expectedE8s: Number(escrow.expectedE8s),
            canRefund,
          });

          console.log(`✅ Found escrow: ${escrow.escrowId}, status: ${statusStr}, balance: ${refreshResult.balanceE8s}`);
        }
      } catch (error: any) {
        // Escrow doesn't exist or error - skip
        continue;
      }
    }

    const totalBalance = foundEscrows.reduce((sum, e) => sum + e.balanceE8s, 0);
    const refundableEscrows = foundEscrows.filter(e => e.canRefund);
    const refundableBalance = refundableEscrows.reduce((sum, e) => sum + e.balanceE8s, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalFound: foundEscrows.length,
        refundable: refundableEscrows.length,
        totalBalanceE8s: totalBalance,
        totalBalanceICP: totalBalance / 100000000,
        refundableBalanceE8s: refundableBalance,
        refundableBalanceICP: refundableBalance / 100000000,
      },
      escrows: foundEscrows,
      escrowIds: foundEscrows.map(e => e.escrowId),
      message: `Found ${foundEscrows.length} escrows. ${refundableEscrows.length} can be refunded (${refundableBalance / 100000000} ICP).`,
    });

  } catch (error) {
    console.error('❌ Find escrows error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find escrows',
    }, { status: 500 });
  }
}


