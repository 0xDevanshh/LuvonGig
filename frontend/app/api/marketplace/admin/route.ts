import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig, serializeBigInts } from '@/lib/ic-marketplace-agent';

// POST /api/marketplace/admin - Admin operations (refund, reconciliation)
export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    try {
      validateMarketplaceConfig();
    } catch (configError) {
      console.warn('Marketplace configuration missing:', configError);
      return NextResponse.json({
        success: false,
        error: 'Marketplace service not configured'
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, adminId, bookingId, amount_e8s, reason, startBlock, endBlock } = body;

    if (!adminId) {
      return NextResponse.json({
        success: false,
        error: 'Admin ID is required'
      }, { status: 400 });
    }

    if (!action || !['refund', 'reconcile'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Action must be refund or reconcile'
      }, { status: 400 });
    }

    // Use mock agent for testing
    const actor = await getMarketplaceActor();
    let result;

    switch (action) {
      case 'refund':
        if (!bookingId) {
          return NextResponse.json({
            success: false,
            error: 'Booking ID is required for refund'
          }, { status: 400 });
        }
        if (!amount_e8s) {
          return NextResponse.json({
            success: false,
            error: 'Refund amount is required'
          }, { status: 400 });
        }
        if (!reason) {
          return NextResponse.json({
            success: false,
            error: 'Refund reason is required'
          }, { status: 400 });
        }
        result = await actor.refundToClient(adminId, bookingId, BigInt(amount_e8s), reason);
        break;
      
      case 'reconcile':
        if (!startBlock || !endBlock) {
          return NextResponse.json({
            success: false,
            error: 'Start and end block numbers are required for reconciliation'
          }, { status: 400 });
        }
        result = await actor.reconcileLedger(adminId, BigInt(startBlock), BigInt(endBlock));
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: serializeBigInts(result.ok),
        action: action
      });
    } else {
      return NextResponse.json({
        success: false,
        error: handleApiError(result.err)
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing admin action:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
