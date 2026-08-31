import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { idlFactory as escrowIdlFactory } from '@/lib/declarations/escrow/escrow.did.js';
import { getUserActor } from '@/lib/ic-agent';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { getMarketplaceActor } from '@/lib/ic-marketplace-agent';
import { getJobMarketplaceActor } from '@/lib/job-marketplace-agent';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const { projectId, freelancerUserId, amountE8s, clientPrincipal, packageId, proposalId, serviceTitle, packageTitle, specialInstructions }: {
      projectId: string;
      freelancerUserId: string;
      amountE8s: number;
      clientPrincipal?: string; // Optional: if provided, use directly
      packageId?: string; // Optional: for creating booking
      proposalId?: string; // Optional: for accepting proposal
      serviceTitle?: string; // Optional: for creating booking
      packageTitle?: string; // Optional: for creating booking
      specialInstructions?: string; // Optional: for creating booking
    } = await request.json();

    if (!projectId || !freelancerUserId || !amountE8s) {
      return NextResponse.json({
        success: false,
        error: 'projectId, freelancerUserId, and amountE8s are required',
      }, { status: 400 });
    }

    if (amountE8s <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than 0',
      }, { status: 400 });
    }

    // Get client principal - use provided principal or fetch from user canister
    const userActor = await getUserActor();
    let clientPrincipalObj: Principal;

    if (clientPrincipal) {
      // Use principal provided from frontend (from connected wallet)
      try {
        clientPrincipalObj = Principal.fromText(clientPrincipal);
      } catch (error: any) {
        console.error('Invalid principal provided:', error);
        return NextResponse.json({
          success: false,
          error: 'Invalid principal format provided',
        }, { status: 400 });
      }
    } else {
      // Fallback: Get from user canister
      try {
        const user = await userActor.getUserById(session.userId);
        if (!user || user.length === 0) {
          throw new Error('User not found');
        }
        const userData = user[0];
        // walletPrincipal is optional: [] or [Principal]
        if (!userData.walletPrincipal || userData.walletPrincipal.length === 0) {
          throw new Error('Client wallet not connected in profile');
        }
        clientPrincipalObj = userData.walletPrincipal[0];
      } catch (error: any) {
        console.error('Error getting client principal from canister:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to get client principal. Please ensure your wallet is connected in your profile settings, or connect your wallet in the escrow component.',
        }, { status: 400 });
      }
    }

    // Get freelancer principal from user canister
    let freelancerPrincipal: Principal;
    let freelancerPlanStr: string = 'Basic';

    try {
      console.log('Looking up freelancer with ID/Email:', freelancerUserId);

      // Get freelancer plan from usage service
      try {
        const { getUserUsage } = await import('@/lib/db/usage-service');
        const freelancerUsage = await getUserUsage(freelancerUserId);
        if (freelancerUsage) {
          freelancerPlanStr = freelancerUsage.plan;
          console.log('✅ Freelancer plan found:', freelancerPlanStr);
        }
      } catch (usageError) {
        console.warn('⚠️ Could not fetch freelancer usage/plan:', usageError);
        // Fallback to basic
      }

      // Try to get user by ID first, then by email if ID lookup returns empty
      let freelancerUser: any = null;
      let lookupMethod = 'unknown';

      // Try getUserById first
      freelancerUser = await userActor.getUserById(freelancerUserId);
      lookupMethod = 'getUserById';
      console.log('getUserById result:', freelancerUser ? `Found (length: ${freelancerUser.length})` : 'null');

      // If getUserById returns empty, try getUserByEmail (freelancer_id might be an email)
      if (!freelancerUser || freelancerUser.length === 0) {
        console.log('getUserById returned empty, trying getUserByEmail...');
        try {
          freelancerUser = await userActor.getUserByEmail(freelancerUserId);
          lookupMethod = 'getUserByEmail';
          console.log('getUserByEmail result:', freelancerUser ? `Found (length: ${freelancerUser.length})` : 'null');
        } catch (e2) {
          console.error('getUserByEmail also failed:', e2);
          throw new Error(`Freelancer not found. Tried both getUserById and getUserByEmail with: ${freelancerUserId}`);
        }
      }

      // Handle optional return type: [] or [User]
      if (!freelancerUser || freelancerUser.length === 0) {
        console.error('Freelancer user is empty or null. Lookup method:', lookupMethod);
        throw new Error(`Freelancer not found (empty result from ${lookupMethod})`);
      }

      const freelancerData = freelancerUser[0];
      console.log('Freelancer data retrieved. Has walletPrincipal:', !!freelancerData.walletPrincipal);

      // walletPrincipal is optional: [] or [Principal]
      if (!freelancerData.walletPrincipal || freelancerData.walletPrincipal.length === 0) {
        console.error('Freelancer walletPrincipal is missing or empty');
        throw new Error('Freelancer wallet not connected');
      }

      freelancerPrincipal = freelancerData.walletPrincipal[0];
      console.log('Freelancer principal extracted:', freelancerPrincipal.toText());
    } catch (error: any) {
      console.error('Error getting freelancer principal:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to get freelancer principal. Please ensure the freelancer has connected their wallet in their profile.',
      }, { status: 400 });
    }

    // Create escrow using mainnet
    const escrowActor = await getMainnetEscrowActor();

    try {
      // Map string plan to canister variant
      const canisterPlan = freelancerPlanStr === 'Premium' ? { premium: null } : { basic: null };

      const result: any = await escrowActor.create(
        projectId,
        clientPrincipalObj,
        freelancerPrincipal,
        BigInt(amountE8s),
        canisterPlan
      );

      const escrowId = result[0];
      const depositAccount = result[1];

      // Create booking in marketplace canister if packageId is provided
      let bookingId = null;
      if (packageId) {
        try {
          console.log('📝 Creating booking for escrow:', escrowId);

          // Create booking via marketplace API (internal call)
          const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/marketplace/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId: session.email || session.userId,
              packageId: packageId,
              specialInstructions: specialInstructions || '',
              paymentMethod: 'escrow',
              totalAmount: amountE8s / 100000000,
              paymentId: escrowId,
              transactionId: escrowId,
              serviceId: projectId,
              serviceTitle: serviceTitle,
              freelancerId: freelancerUserId,
              packageTitle: packageTitle,
              packageDescription: '',
              deliveryDays: 7,
              createdFromEscrow: true,
            }),
          });

          if (bookingResponse.ok) {
            const bookingData = await bookingResponse.json();
            if (bookingData.success) {
              bookingId = bookingData.data?.booking_id;
              console.log('✅ Booking created for escrow:', bookingId);
            } else {
              console.error('❌ Booking creation failed:', bookingData.error);
            }
          } else {
            const errorData = await bookingResponse.json();
            console.error('❌ Booking API error:', errorData);
          }
        } catch (bookingError: any) {
          console.error('⚠️ Failed to create booking for escrow (non-critical):', bookingError);
          // Don't fail escrow creation if booking creation fails
        }
      } else if (proposalId) {
        // Proposal acceptance moved to /api/job-marketplace/accept-proposal
        // Will be called by EscrowManager after funding verification
        console.log("Proposal stored in escrow response - will accept after funding:", proposalId);
      } else {
        console.log('ℹ️ No packageId or proposalId provided, skipping booking/acceptance');
      }

      return NextResponse.json({
        success: true,
        data: {
          escrowId: escrowId,
          bookingId: bookingId,
          proposalId: proposalId || null, // Include for frontend tracking
          depositAccount: {
            owner: depositAccount.owner.toString(),
            subaccount: depositAccount.subaccount && depositAccount.subaccount.length > 0
              ? Array.from(depositAccount.subaccount[0])
              : null,
          },
        },
      });
    } catch (escrowError: any) {
      console.error('Escrow creation error:', escrowError);
      return NextResponse.json({
        success: false,
        error: escrowError.message || 'Failed to create escrow',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Escrow create API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create escrow',
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
