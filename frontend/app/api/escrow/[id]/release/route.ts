import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as escrowIdlFactory } from '@/lib/declarations/escrow/escrow.did.js';
import { getUserActor } from '@/lib/ic-agent';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let originalEscrowId: string | null = null;
  let actualEscrowId: string | null = null;

  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const { id: escrowId } = await params;
    originalEscrowId = escrowId;

    if (!escrowId) {
      return NextResponse.json({
        success: false,
        error: 'Escrow ID is required',
      }, { status: 400 });
    }

    // Get escrow actor for mainnet
    const escrowActor = await getMainnetEscrowActor();

    console.log('🔍 Attempting to get escrow:', escrowId);

    // Try to find the escrow - if not found with given ID, try different counter values
    let escrow;
    let foundEscrowId = escrowId;
    let escrowFound = false;

    try {
      // First try the provided escrow ID
      escrow = await escrowActor.get(escrowId) as any;
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
          const providedCounter = parts[parts.length - 1];

          console.log(`🔍 Trying to find escrow with projectId: ${projectId}`);

          // Try counter values from 0 to 100
          for (let i = 0; i <= 100; i++) {
            const tryEscrowId = `${projectId}:${i}`;
            try {
              escrow = await escrowActor.get(tryEscrowId) as any;
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
    console.log('Escrow client principal:', escrow.client.toString());
    actualEscrowId = foundEscrowId; // Store the actual escrow ID found

    // Get current user's wallet principal
    const userActor = await getUserActor();
    const user = await userActor.getUserById(session.userId);

    if (!user || user.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        escrowId: actualEscrowId,
      }, { status: 404 });
    }

    const userData = user[0];
    if (!userData.walletPrincipal || userData.walletPrincipal.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User wallet not connected. Please connect your Plug wallet in your profile settings.',
        escrowId: actualEscrowId,
      }, { status: 400 });
    }

    const userPrincipal = userData.walletPrincipal[0];
    console.log('User wallet principal:', userPrincipal.toString());

    // Check if user is the client
    const escrowClientStr = escrow.client.toString();
    const userPrincipalStr = userPrincipal.toString();

    if (escrowClientStr !== userPrincipalStr) {
      console.error('Principal mismatch:', {
        escrowClient: escrowClientStr,
        userPrincipal: userPrincipalStr,
        match: escrowClientStr === userPrincipalStr
      });
      return NextResponse.json({
        success: false,
        error: `Unauthorized: only the client can release escrow. Escrow client: ${escrowClientStr.substring(0, 20)}..., Your wallet: ${userPrincipalStr.substring(0, 20)}...`,
        escrowId: actualEscrowId,
      }, { status: 403 });
    }

    // Get escrow details - we'll let the canister handle the release logic
    // The escrow.mo will check balance and release whatever is available
    console.log('📋 Preparing to release escrow:', actualEscrowId);
    console.log('💼 Expected amount:', Number(escrow.expectedE8s) / 100000000, 'ICP');

    // Log escrow status for debugging
    const currentStatus = 'funded' in escrow.status ? 'FUNDED' :
      'created' in escrow.status ? 'CREATED' :
        'released' in escrow.status ? 'RELEASED' :
          'refunded' in escrow.status ? 'REFUNDED' : 'UNKNOWN';
    console.log(`📊 Current escrow status: ${currentStatus}`);

    // Get service price (base amount) from booking data
    // Try to fetch booking data using escrow's projectId (which is typically service_id or booking_id)
    let servicePriceE8s: bigint | null = null;
    const projectId = escrow.projectId;

    try {
      // Try to get booking data from enhanced storage or marketplace
      const fs = require('fs');
      const path = require('path');
      const enhancedStoragePath = path.join(process.cwd(), 'tmp', 'marketplace-storage', 'bookings.json');

      if (fs.existsSync(enhancedStoragePath)) {
        const enhancedStorageData = JSON.parse(fs.readFileSync(enhancedStoragePath, 'utf8'));

        // Search for booking by service_id or booking_id
        for (const [bookingId, bookingData] of Object.entries(enhancedStorageData)) {
          const booking = bookingData as any;
          if (booking.service_id === projectId || booking.booking_id === projectId) {
            servicePriceE8s = BigInt(booking.base_amount_e8s || 0);
            console.log('✅ Found service price from booking data:', Number(servicePriceE8s) / 100000000, 'ICP');
            break;
          }
        }
      }

      // If not found, try to calculate from expected amount
      // Total = servicePrice + (servicePrice * FEE_PERCENT) + 0.0003 ICP
      // So: servicePrice = (expectedE8s - 30000) / (1 + FEE_PERCENT)
      if (!servicePriceE8s || servicePriceE8s === BigInt(0)) {
        const NETWORK_TRANSFER_FEE_E8S = BigInt(30000); // 0.0003 ICP
        const expectedE8s = BigInt(escrow.expectedE8s);

        // Determine fee percentage based on plan
        const isPremium = escrow.plan && 'premium' in escrow.plan;
        const feeMultiplier = isPremium ? BigInt(103) : BigInt(104);
        const feePercentStr = isPremium ? '3%' : '4%';

        if (expectedE8s > NETWORK_TRANSFER_FEE_E8S) {
          // Calculate: servicePrice = (expectedE8s - networkFee) * 100 / (100 + feePercent)
          const amountAfterNetworkFee = expectedE8s - NETWORK_TRANSFER_FEE_E8S;
          servicePriceE8s = (amountAfterNetworkFee * BigInt(100)) / feeMultiplier;
          console.log(`📊 Calculated service price (${feePercentStr} fee) from expected amount:`, Number(servicePriceE8s) / 100000000, 'ICP');
        } else {
          throw new Error('Invalid escrow amount: too small to calculate service price');
        }
      }
    } catch (error: any) {
      console.warn('⚠️ Could not get service price, using calculated value:', error.message);
      // Fallback calculation
      const NETWORK_TRANSFER_FEE_E8S = BigInt(30000);
      const expectedE8s = BigInt(escrow.expectedE8s);
      const isPremium = escrow.plan && 'premium' in escrow.plan;
      const feeMultiplier = isPremium ? BigInt(103) : BigInt(104);

      if (expectedE8s > NETWORK_TRANSFER_FEE_E8S) {
        const amountAfterNetworkFee = expectedE8s - NETWORK_TRANSFER_FEE_E8S;
        servicePriceE8s = (amountAfterNetworkFee * BigInt(100)) / feeMultiplier;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid escrow amount: cannot calculate service price',
          escrowId: actualEscrowId,
        }, { status: 400 });
      }
    }

    if (!servicePriceE8s || servicePriceE8s === BigInt(0)) {
      return NextResponse.json({
        success: false,
        error: 'Service price is required but could not be determined',
        escrowId: actualEscrowId,
      }, { status: 400 });
    }

    // Release the escrow with service price
    console.log('🚀 Releasing escrow:', actualEscrowId, 'with service price:', Number(servicePriceE8s) / 100000000, 'ICP');
    const releaseResult = await escrowActor.release(actualEscrowId, servicePriceE8s) as any;

    if ('err' in releaseResult) {
      return NextResponse.json({
        success: false,
        error: releaseResult.err,
        escrowId: actualEscrowId,
        expectedE8s: Number(escrow.expectedE8s),
      }, { status: 500 });
    }

    // After successful release, mark job as completed if this is a job project
    if (actualEscrowId && actualEscrowId.includes('job_')) {
      console.log('📋 Job project detected, marking as completed...');
      try {
        // Extract booking ID from escrow ID (format: "bookingId:counter")
        const bookingId = actualEscrowId.split(':')[0].replace('job_', '');
        console.log('📋 Extracted job ID:', bookingId);

        // Get job marketplace actor and mark as completed
        const { getJobMarketplaceActor } = await import('@/lib/job-marketplace-agent');
        const jobActor = await getJobMarketplaceActor();

        // Get escrow client ID to use as clientId
        const clientId = escrow.client.toString();

        const completionResult = await jobActor.markJobAsCompleted(bookingId, clientId);

        if ('ok' in completionResult) {
          console.log('✅ Job marked as completed and paid');
        } else {
          console.warn('⚠️ Failed to mark job as completed:', completionResult.err);
        }
      } catch (completionError: any) {
        // Log but don't fail the release - funds were already transferred successfully
        console.error('⚠️ Error marking job as completed (funds released successfully):', completionError.message);
      }
    } else if (actualEscrowId) {
      // Normal marketplace booking — mark as paid in marketplace canister
      console.log('📋 Normal booking detected, marking as paid...');
      try {
        const { getMarketplaceActor } = await import('@/lib/ic-marketplace-agent');
        const marketplaceActor = await getMarketplaceActor();

        // The escrow ID format is "serviceId:counter" — try to find booking by listing client bookings
        const clientId = escrow.client.toString();

        // Try listing bookings for the client to find the matching one
        const bookingsResult = await marketplaceActor.listBookingsForClient(clientId, [], 100, 0) as any;

        if ('ok' in bookingsResult) {
          const bookings = bookingsResult.ok;
          // Find booking that matches this escrow's service ID
          const escrowProjectId = actualEscrowId.split(':')[0];
          const matchingBooking = bookings.find((b: any) =>
            b.service_id === escrowProjectId ||
            b.payment_id === actualEscrowId ||
            b.transaction_id === actualEscrowId
          );

          if (matchingBooking) {
            console.log('📋 Found matching booking:', matchingBooking.booking_id);

            // Mark booking as paid (sets status=#Paid, payment_status=#Released, isPaid=true)
            const paidResult = await marketplaceActor.markBookingAsPaid(
              matchingBooking.booking_id,
              clientId
            );

            if ('ok' in paidResult) {
              console.log('✅ Booking marked as paid');
            } else {
              console.warn('⚠️ Failed to mark booking as paid:', paidResult.err);
            }
          } else {
            console.warn('⚠️ No matching booking found for escrow:', actualEscrowId);
          }
        }
      } catch (marketplaceError: any) {
        // Log but don't fail the release - funds were already transferred successfully
        console.error('⚠️ Error updating marketplace booking (funds released successfully):', marketplaceError.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        blockIndex: Number(releaseResult.ok),
        message: 'Escrow released successfully. Funds have been transferred to the freelancer.',
      },
    });

  } catch (error: any) {
    console.error('Escrow release API error:', error);
    // Use the actual escrow ID found, or fallback to original
    const errorEscrowId = actualEscrowId || originalEscrowId || 'unknown';
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to release escrow',
      escrowId: errorEscrowId,
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
