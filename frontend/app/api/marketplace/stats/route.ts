import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig } from '@/lib/ic-marketplace-agent';

// GET /api/marketplace/stats - Get marketplace statistics
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

    // Use mock agent for testing
    const actor = await getMarketplaceActor();

    let statsResult: any = null;
    const collectedErrors: unknown[] = [];

    if (actor && typeof (actor as any).getMarketplaceStats === 'function') {
      try {
        statsResult = await (actor as any).getMarketplaceStats();
        console.log('📊 Marketplace stats fetched via getMarketplaceStats:', statsResult);
      } catch (err) {
        collectedErrors.push(err);
      }
    }

    if (!statsResult && actor && typeof (actor as any).getStats === 'function') {
      try {
        statsResult = await (actor as any).getStats();
        console.log('📊 Marketplace stats fetched via getStats:', statsResult);
      } catch (err) {
        collectedErrors.push(err);
      }
    }

    if (!statsResult) {
      console.error('Marketplace stats methods unavailable or failed', collectedErrors);
      throw collectedErrors[0] || new Error('Marketplace stats method not available on canister');
    }

    const transformNat = (value: any) => {
      if (typeof value === 'bigint') return Number(value);
      if (typeof value === 'number') return value;
      if (value === undefined || value === null) return 0;
      try {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      } catch {
        return 0;
      }
    };

    const responsePayload = {
      success: true,
      data: {
        total_services: transformNat(statsResult.total_services),
        total_packages: transformNat(statsResult.total_packages ?? 0),
        total_bookings: transformNat(statsResult.total_bookings),
        total_stages: transformNat(statsResult.total_stages ?? 0),
        total_transactions: transformNat(statsResult.total_transactions ?? 0),
        active_services: transformNat(statsResult.active_services ?? 0),
        active_bookings: transformNat(statsResult.active_bookings ?? 0),
        total_revenue_e8s: transformNat(statsResult.total_revenue_e8s ?? 0)
      }
    };

    console.log('📦 Marketplace stats response payload:', responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
