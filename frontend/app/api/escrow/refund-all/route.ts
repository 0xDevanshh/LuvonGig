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

export async function POST(request: NextRequest) {
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
        error: 'User wallet not connected. Please connect your wallet first.',
      }, { status: 400 });
    }

    const userPrincipal = userData.walletPrincipal[0];
    const userPrincipalText = userPrincipal.toString();

    console.log('🔄 Starting refund process for user:', userPrincipalText);

    // Get escrow actor
    const escrowActor = await getMainnetEscrowActor();

    // Get all bookings for the user to find escrow IDs
    const marketplaceActor = await getMarketplaceActor();
    let escrowIds: string[] = [];

    try {
      // Get bookings as client
      const bookingsResult = await marketplaceActor.listBookingsForClient(
        session.email || session.userId,
        [], // No status filter
        BigInt(100), // Limit
        BigInt(0) // Offset
      );

      if ('ok' in bookingsResult) {
        const bookings = bookingsResult.ok;
        console.log(`📋 Found ${bookings.length} bookings`);

        // Extract escrow IDs from bookings
        // Escrow IDs are typically in the format: projectId:number or serviceId:number
        for (const booking of bookings) {
          // Try to get escrow ID from payment_id or transaction_id
          if (booking.payment_id) {
            escrowIds.push(booking.payment_id);
          }
          if (booking.transaction_id && booking.transaction_id !== booking.payment_id) {
            escrowIds.push(booking.transaction_id);
          }
          // Also try service_id format (serviceId:number)
          if (booking.service_id) {
            // Check if it matches escrow format
            if (booking.service_id.includes(':')) {
              escrowIds.push(booking.service_id);
            }
            // Also try common patterns: serviceId:0, serviceId:1, etc.
            for (let i = 0; i < 20; i++) {
              const potentialId = `${booking.service_id}:${i}`;
              escrowIds.push(potentialId);
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch bookings, will try direct escrow IDs:', error);
    }

    // Remove duplicates
    escrowIds = [...new Set(escrowIds)];
    console.log(`🔍 Found ${escrowIds.length} unique potential escrow IDs`);

    // If we have potential IDs, verify which ones actually exist and belong to the user
    if (escrowIds.length > 0) {
      console.log('🔍 Verifying escrow IDs...');
      const verifiedEscrowIds: string[] = [];
      
      for (const escrowId of escrowIds) {
        try {
          const escrow = await escrowActor.get(escrowId);
          if (escrow.client.toString() === userPrincipalText) {
            verifiedEscrowIds.push(escrowId);
            console.log(`✅ Verified escrow: ${escrowId}`);
          }
        } catch (error) {
          // Escrow doesn't exist - skip
          continue;
        }
      }
      
      escrowIds = verifiedEscrowIds;
      console.log(`✅ Verified ${escrowIds.length} escrows belong to you`);
    }

    // If no escrow IDs from bookings, check if user provided them in request body
    const body = await request.json().catch(() => ({}));
    if (body.escrowIds && Array.isArray(body.escrowIds)) {
      escrowIds = [...new Set([...escrowIds, ...body.escrowIds])];
      console.log(`📝 Added ${body.escrowIds.length} escrow IDs from request body`);
    }

    if (escrowIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No escrow IDs found. Please provide escrow IDs in the request body as: { "escrowIds": ["escrow1", "escrow2", ...] }',
      }, { status: 400 });
    }

    // Process refunds for each escrow
    const results: Array<{
      escrowId: string;
      success: boolean;
      blockIndex?: number;
      error?: string;
    }> = [];

    for (const escrowId of escrowIds) {
      try {
        console.log(`🔄 Processing refund for escrow: ${escrowId}`);

        // First, verify the escrow exists and belongs to the user
        try {
          const escrow = await escrowActor.get(escrowId);
          
          // Verify user is the client
          if (escrow.client.toString() !== userPrincipalText) {
            console.log(`⏭️ Skipping ${escrowId} - user is not the client`);
            results.push({
              escrowId,
              success: false,
              error: 'Not authorized - you are not the client for this escrow',
            });
            continue;
          }

          // Check if already refunded or released
          if ('refunded' in escrow.status) {
            console.log(`⏭️ Skipping ${escrowId} - already refunded`);
            results.push({
              escrowId,
              success: false,
              error: 'Already refunded',
            });
            continue;
          }

          if ('released' in escrow.status) {
            console.log(`⏭️ Skipping ${escrowId} - already released`);
            results.push({
              escrowId,
              success: false,
              error: 'Cannot refund - already released',
            });
            continue;
          }

          // Check if there are funds to refund
          const refreshResult = await escrowActor.refresh_funding(escrowId);
          if (refreshResult.balanceE8s === 0) {
            console.log(`⏭️ Skipping ${escrowId} - no funds to refund`);
            results.push({
              escrowId,
              success: false,
              error: 'No funds to refund',
            });
            continue;
          }

          // Attempt refund
          const refundResult = await escrowActor.refund(escrowId);

          if ('err' in refundResult) {
            console.error(`❌ Refund failed for ${escrowId}:`, refundResult.err);
            results.push({
              escrowId,
              success: false,
              error: refundResult.err,
            });
          } else {
            console.log(`✅ Refund successful for ${escrowId}, block: ${refundResult.ok}`);
            results.push({
              escrowId,
              success: true,
              blockIndex: Number(refundResult.ok),
            });
          }
        } catch (getError: any) {
          // Escrow might not exist or other error
          console.error(`❌ Error getting escrow ${escrowId}:`, getError);
          results.push({
            escrowId,
            success: false,
            error: getError.message || 'Escrow not found or error accessing',
          });
        }

        // Small delay between refunds to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`❌ Unexpected error processing ${escrowId}:`, error);
        results.push({
          escrowId,
          success: false,
          error: error.message || 'Unexpected error',
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalRefunded = results
      .filter(r => r.success && r.blockIndex)
      .length;

    console.log(`📊 Refund summary: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      summary: {
        total: escrowIds.length,
        successful,
        failed,
        totalRefunded,
      },
      results,
      message: `Processed ${escrowIds.length} escrows. ${successful} refunded successfully, ${failed} failed.`,
    });

  } catch (error) {
    console.error('❌ Refund-all API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refunds',
    }, { status: 500 });
  }
}

