import { NextRequest, NextResponse } from 'next/server';
import { Principal } from '@dfinity/principal';
import { getCurrentSession } from '@/lib/actions/auth';
import { getUserActor } from '@/lib/ic-agent';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    const { principal, accountId }: { principal: string; accountId: string } = await request.json();

    if (!principal || !accountId) {
      return NextResponse.json({
        success: false,
        error: 'Principal and accountId are required',
      }, { status: 400 });
    }

    // Validate principal format using DFINITY library
    try {
      Principal.fromText(principal);
    } catch (err) {
      console.warn('Invalid principal received for wallet update:', principal, err);
      return NextResponse.json({
        success: false,
        error: 'Invalid principal format',
      }, { status: 400 });
    }

    // Basic sanity check for accountId (hex string length 64)
    if (!/^[0-9a-fA-F]{64}$/.test(accountId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid accountId format',
      }, { status: 400 });
    }

    const actor = await getUserActor();

    // Convert principal string to Principal object
    const principalObj = Principal.fromText(principal);

    // Update wallet info in user canister
    // updateWalletInfo expects: (UserId, ?Principal, ?Text) -> Result<(), Text>
    const result = await actor.updateWalletInfo(
      session.userId,
      [principalObj], // Wrap in Option
      [accountId]     // Wrap in Option
    );

    if ('err' in result) {
      console.error('Failed to update wallet info:', result.err);
      return NextResponse.json({
        success: false,
        error: result.err,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet information updated successfully',
    });

  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update wallet information',
    }, { status: 500 });
  }
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

    const actor = await getUserActor();

    // Get wallet info from user canister
    // Use getUserById to get the full user object which includes walletPrincipal and walletAccountId
    const user = await actor.getUserById(session.userId);

    // Handle optional return type: [] or [User]
    if (!user || user.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const userData = user[0];
    
    // Check if wallet info exists
    if (!userData.walletPrincipal || userData.walletPrincipal.length === 0 || 
        !userData.walletAccountId || userData.walletAccountId.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No wallet information found',
      });
    }

    const principal = userData.walletPrincipal[0];
    const accountId = userData.walletAccountId[0];

    return NextResponse.json({
      success: true,
      data: {
        principal: principal.toText(),
        accountId: accountId,
      },
    });

  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch wallet information',
    }, { status: 500 });
  }
}

