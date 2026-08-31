import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig } from '@/lib/ic-marketplace-agent';

// GET /api/marketplace/escrow - Get escrow balance for booking
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    // Use mock agent for testing
    const actor = await getMarketplaceActor();
    const result = await actor.getEscrowBalance(bookingId);

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: {
          booking_id: bookingId,
          balance_e8s: result.ok.toString(),
          balance_icp: Number(result.ok) / 100_000_000
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: handleApiError(result.err)
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching escrow balance:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
