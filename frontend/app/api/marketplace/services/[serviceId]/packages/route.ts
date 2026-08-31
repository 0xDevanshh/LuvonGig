import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig, serializeBigInts } from '@/lib/ic-marketplace-agent';

// GET /api/marketplace/services/[serviceId]/packages - Get packages for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
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

    const { serviceId } = await params;

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: 'Service ID is required'
      }, { status: 400 });
    }

    // Get packages directly from canister using the new method
    console.log('About to get marketplace actor...');
    const actor = await getMarketplaceActor();
    console.log('Got marketplace actor successfully');

    try {
      // Get packages from canister
      console.log('Fetching packages for service:', serviceId);
      const packages = await actor.getPackagesByServiceId(serviceId);
      console.log('getPackagesByServiceId worked, result:', packages);

      // Sort packages by price (ascending) to determine tier order
      const sortedPackages = [...packages].sort((a: any, b: any) => {
        const priceA = typeof a.price_e8s === 'bigint' ? Number(a.price_e8s) : Number(a.price_e8s || 0);
        const priceB = typeof b.price_e8s === 'bigint' ? Number(b.price_e8s) : Number(b.price_e8s || 0);
        return priceA - priceB;
      });

      // Transform packages to convert BigInt values and ensure proper formatting
      const transformedPackages = sortedPackages.map((pkg: any, index: number) => {
        // Extract tier from package name if present (format: "Tier: Title")
        let tier = pkg.tier;
        let title = pkg.title || pkg.name || 'Package';
        
        if (!tier) {
          const packageName = pkg.name || pkg.title || '';
          const tierMatch = packageName.match(/^(Basic|Standard|Advanced|Premium):\s*(.+)$/i);
          
          if (tierMatch) {
            // Tier is in the name format "Tier: Title"
            tier = tierMatch[1].charAt(0).toUpperCase() + tierMatch[1].slice(1).toLowerCase();
            title = tierMatch[2]; // Remove tier prefix from title
          } else {
            // Try to infer tier from package name keywords
            const nameLower = packageName.toLowerCase();
            if (nameLower.includes('premium') || nameLower.includes('pro')) {
              tier = 'Premium';
            } else if (nameLower.includes('standard') || nameLower.includes('advanced')) {
              tier = 'Standard';
            } else if (nameLower.includes('basic') || nameLower.includes('starter')) {
              tier = 'Basic';
            } else {
              // Infer tier from order and price (cheapest = Basic, most expensive = Premium)
              if (sortedPackages.length === 1) {
                tier = 'Basic';
              } else if (sortedPackages.length === 2) {
                tier = index === 0 ? 'Basic' : 'Premium';
              } else {
                // 3+ packages: Basic, Standard, Premium
                if (index === 0) tier = 'Basic';
                else if (index === sortedPackages.length - 1) tier = 'Premium';
                else tier = 'Standard';
              }
            }
          }
        }

        return {
          package_id: pkg.package_id,
          service_id: pkg.service_id,
          tier: tier || 'Basic',
          title: title,
          description: pkg.description || '',
          price_e8s: typeof pkg.price_e8s === 'bigint' ? Number(pkg.price_e8s) : Number(pkg.price_e8s || 0),
          delivery_days: typeof pkg.delivery_time_days === 'bigint' ? Number(pkg.delivery_time_days) : Number(pkg.delivery_time_days || 1),
          delivery_timeline: pkg.delivery_timeline || `${Number(pkg.delivery_time_days || 1)} days`,
          features: pkg.features || [],
          revisions_included: typeof pkg.revisions === 'bigint' ? Number(pkg.revisions) : Number(pkg.revisions || 1),
          status: pkg.is_active ? 'Available' : 'Unavailable',
          created_at: typeof pkg.created_at === 'bigint' ? Number(pkg.created_at) / 1000000 : Number(pkg.created_at || 0) / 1000000,
          updated_at: typeof pkg.created_at === 'bigint' ? Number(pkg.created_at) / 1000000 : Number(pkg.created_at || 0) / 1000000
        };
      });

      return NextResponse.json({
        success: true,
        data: transformedPackages,
        count: transformedPackages.length
      });
    } catch (error) {
      console.error('Error fetching packages:', error);
      return NextResponse.json({
        success: false,
        error: handleApiError(error),
        serviceId: serviceId
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}