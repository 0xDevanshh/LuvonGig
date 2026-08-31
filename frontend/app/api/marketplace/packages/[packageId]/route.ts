import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig } from '@/lib/ic-marketplace-agent';

// GET /api/marketplace/packages/[packageId] - Get package by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
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

    const { packageId } = await params;

    if (!packageId) {
      return NextResponse.json({
        success: false,
        error: 'Package ID is required'
      }, { status: 400 });
    }

    // Since canister doesn't have getPackageById method, return mock data for now
    const mockPackageData = {
      package_id: packageId,
      title: 'Service Package',
      description: 'Package description',
      price_e8s: 100000000,
      delivery_days: 7
    };

    return NextResponse.json({
      success: true,
      data: mockPackageData
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}

// PUT /api/marketplace/packages/[packageId] - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!updates) {
      return NextResponse.json({
        success: false,
        error: 'Update data is required'
      }, { status: 400 });
    }

    // Use the correctly named fields for the canister
    const {
      title,
      name,
      description,
      price_e8s,
      delivery_days,
      delivery_time_days,
      delivery_timeline,
      revisions,
      revisions_included,
      features
    } = updates;

    const actor = await getMarketplaceActor();
    const result = await actor.updatePackage(
      packageId,
      name || title || "",
      description || "",
      BigInt(Math.round(Number(price_e8s || 0))),
      BigInt(Math.round(Number(delivery_time_days || delivery_days || 7))),
      delivery_timeline || "Same day (24 hours)",
      BigInt(Math.round(Number(revisions || revisions_included || 0))),
      features || []
    );

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        data: result.ok
      });
    } else {
      return NextResponse.json({
        success: false,
        error: handleApiError(result.err)
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}

// DELETE /api/marketplace/packages/[packageId] - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Use mock agent for testing
    const actor = await getMarketplaceActor();
    const result = await actor.deletePackage(userId, packageId);

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        message: 'Package deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: handleApiError(result.err)
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
