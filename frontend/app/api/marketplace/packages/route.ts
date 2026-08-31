import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig } from '@/lib/ic-marketplace-agent';

// Mock package storage functions
const addPackage = (pkg: any) => {
  console.log('Mock: Adding package', pkg);
  return true;
};

const getPackagesByServiceId = (serviceId: string) => {
  console.log('Mock: Getting packages for service', serviceId);
  return [];
};

interface Package {
  package_id: string;
  service_id: string;
  name: string;
  description: string;
  price: number;
  delivery_time: string;
  features: string[];
  created_at: string;
}

// GET /api/marketplace/packages - List packages by service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: 'Service ID is required'
      }, { status: 400 });
    }

    console.log('Fetching packages for service:', serviceId);

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

    // Get packages directly from canister using getPackagesByServiceId
    const actor = await getMarketplaceActor();
    
    try {
      // First verify service exists
    const serviceResult = await actor.getService(serviceId);

    if ('err' in serviceResult) {
      return NextResponse.json({
        success: false,
        error: handleApiError(serviceResult.err)
      }, { status: 404 });
    }

      // Get packages using the dedicated method
      const packages = await actor.getPackagesByServiceId(serviceId);
      
      // Transform packages to convert BigInt values and ensure proper formatting
      const transformedPackages = packages.map((pkg: any) => ({
        package_id: pkg.package_id,
        service_id: pkg.service_id,
        tier: pkg.tier,
        title: pkg.title,
        description: pkg.description,
        price_e8s: typeof pkg.price_e8s === 'bigint' ? Number(pkg.price_e8s) : Number(pkg.price_e8s || 0),
        delivery_days: typeof pkg.delivery_days === 'bigint' ? Number(pkg.delivery_days) : Number(pkg.delivery_days || 1),
        delivery_timeline: pkg.delivery_timeline || `${Number(pkg.delivery_days || 1)} days`,
        features: pkg.features || [],
        revisions_included: typeof pkg.revisions_included === 'bigint' ? Number(pkg.revisions_included) : Number(pkg.revisions_included || 1),
        status: pkg.status || 'Available',
        created_at: typeof pkg.created_at === 'bigint' ? Number(pkg.created_at) : Number(pkg.created_at || 0),
        updated_at: typeof pkg.updated_at === 'bigint' ? Number(pkg.updated_at) : Number(pkg.updated_at || 0)
      }));

    return NextResponse.json({
      success: true,
        data: transformedPackages,
        count: transformedPackages.length
    });
    } catch (error) {
      console.error('Error fetching packages:', error);
      return NextResponse.json({
        success: false,
        error: handleApiError(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST /api/marketplace/packages - Create new package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, packageData } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!packageData) {
      return NextResponse.json({
        success: false,
        error: 'Package data is required'
      }, { status: 400 });
    }

    // Create new package with complete data
    const timestamp = Date.now() * 1000000; // nanoseconds
    const newPackage = {
      package_id: `package-${Date.now()}`,
      service_id: packageData.service_id,
      tier: packageData.tier || 'Basic',
      title: packageData.title,
      description: packageData.description || 'Professional service package',
      price_e8s: packageData.price_e8s.toString(),
      delivery_days: packageData.delivery_days || 1,
      delivery_timeline: packageData.delivery_timeline || `${packageData.delivery_days || 1} day${(packageData.delivery_days || 1) > 1 ? 's' : ''}`,
      features: packageData.features || [],
      revisions_included: packageData.revisions_included || 1,
      status: packageData.status || 'Available',
      created_at: timestamp.toString(),
      updated_at: timestamp.toString()
    };

    // Store package in persistent storage
    addPackage(newPackage as any);
    console.log('Package created and stored:', newPackage);
    const allPackages = getPackagesByServiceId(newPackage.service_id);
    console.log('Total packages for this service:', allPackages.length);

    return NextResponse.json({
      success: true,
      data: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}