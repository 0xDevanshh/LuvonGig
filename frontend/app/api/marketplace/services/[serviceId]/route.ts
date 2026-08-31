import { NextRequest, NextResponse } from 'next/server';
import { validateMarketplaceConfig, getMarketplaceActor, handleApiError } from '@/lib/ic-marketplace-agent';
import { getSession } from '@/lib/auth';

// GET /api/marketplace/services/[serviceId] - Get service by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params;

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: 'Service ID is required'
      }, { status: 400 });
    }

    const actor = await getMarketplaceActor();
    const result = await actor.getService(serviceId);

    // Handle both direct result and wrapped result formats
    let service = null;
    if (Array.isArray(result) && result.length > 0) {
      // Direct result (array with service data)
      service = result[0];
    } else if (result && typeof result === 'object' && 'ok' in result) {
      // Wrapped result object
      if ('err' in result) {
        return NextResponse.json({
          success: false,
          error: handleApiError(result.err)
        }, { status: 404 });
      }
      service = result.ok;
    } else if (result && !('err' in result) && !('ok' in result)) {
      // Direct service object
      service = result;
    }

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found'
      }, { status: 404 });
    }

    // Load additional service data from storage
    let additionalData = {};
    try {
      const { getAdditionalServiceData } = await import('@/lib/service-storage');
      additionalData = getAdditionalServiceData(serviceId) || {};
    } catch (error) {
      console.warn('Failed to load additional service data:', error);
    }

    // Fetch packages from canister (primary source)
    let packages: any[] = [];
    try {
      console.log('📦 Fetching packages from canister for service:', serviceId);
      const canisterPackages = await actor.getPackagesByServiceId(serviceId);
      console.log('✅ Fetched packages from canister:', canisterPackages.length, 'packages');

      // Get tier mapping from file storage if available (for backward compatibility)
      const fileStoragePackages = (additionalData as any).packages || [];
      const tierMap = new Map<string, string>();
      fileStoragePackages.forEach((pkg: any) => {
        if (pkg.package_id && pkg.tier) {
          tierMap.set(pkg.package_id, pkg.tier);
        }
      });

      // Sort packages by price (ascending) to determine tier order if needed
      const sortedPackages = [...canisterPackages].sort((a: any, b: any) => {
        const priceA = typeof a.price_e8s === 'bigint' ? Number(a.price_e8s) : Number(a.price_e8s || 0);
        const priceB = typeof b.price_e8s === 'bigint' ? Number(b.price_e8s) : Number(b.price_e8s || 0);
        return priceA - priceB;
      });

      // Transform canister packages to match frontend format
      packages = sortedPackages.map((pkg: any, index: number) => {
        // Try to get tier from file storage first
        let tier = tierMap.get(pkg.package_id);

        if (!tier) {
          // Try to extract tier from package name (format: "Tier: Title")
          const packageName = pkg.name || '';
          const tierMatch = packageName.match(/^(Basic|Standard|Advanced|Premium):\s*(.+)$/i);

          if (tierMatch) {
            // Tier is in the name format "Tier: Title"
            tier = tierMatch[1].charAt(0).toUpperCase() + tierMatch[1].slice(1).toLowerCase();
            // Remove tier prefix from title
            pkg.name = tierMatch[2];
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
          tier: tier,
          title: pkg.name || pkg.title || 'Package', // Use name from canister (with tier prefix removed if present)
          description: pkg.description || '',
          price_e8s: typeof pkg.price_e8s === 'bigint' ? Number(pkg.price_e8s) : Number(pkg.price_e8s || 0),
          delivery_days: typeof pkg.delivery_time_days === 'bigint' ? Number(pkg.delivery_time_days) : Number(pkg.delivery_time_days || 1),
          delivery_timeline: pkg.delivery_timeline || `${Number(pkg.delivery_time_days || 1)} days`,
          features: pkg.features || [],
          revisions_included: typeof pkg.revisions === 'bigint' ? Number(pkg.revisions) : Number(pkg.revisions || 1),
          status: pkg.is_active ? 'Available' : 'Unavailable',
          created_at: typeof pkg.created_at === 'bigint' ? Number(pkg.created_at) / 1000000 : Number(pkg.created_at || 0) / 1000000, // Convert from nanoseconds to milliseconds
          updated_at: typeof pkg.created_at === 'bigint' ? Number(pkg.created_at) / 1000000 : Number(pkg.created_at || 0) / 1000000 // Use created_at as updated_at fallback
        };
      });

      console.log('✅ Transformed packages:', packages.length, 'packages ready');
    } catch (packageError) {
      console.error('❌ Error fetching packages from canister:', packageError);
      // Fallback to file storage packages if canister fetch fails
      packages = (additionalData as any).packages || [];
      console.warn('⚠️ Using file storage packages as fallback:', packages.length, 'packages');
    }

    // Merge canister service data with additional data
    const mergedService = {
      service_id: service.service_id,
      freelancer_id: service.freelancer_id,
      freelancer_email: (additionalData as any).freelancer_email || service.freelancer_id,
      title: service.title,
      main_category: service.main_category,
      sub_category: service.sub_category,
      description: service.description,
      description_format: (additionalData as any).description_format || 'markdown',
      whats_included: service.whats_included,
      cover_image_url: (additionalData as any).cover_image_url || (Array.isArray(service.cover_image_url) ? service.cover_image_url[0] : service.cover_image_url) || '',
      portfolio_images: (additionalData as any).portfolio_images || service.portfolio_images || [],
      status: service.status && 'Active' in service.status ? 'Active' : (service.status && 'Paused' in service.status ? 'Paused' : 'Deleted'),
      rating_avg: Number(service.total_rating || 0),
      total_orders: Number(service.review_count || 0),
      created_at: Number(service.created_at) / 1000000, // Convert from nanoseconds to milliseconds
      updated_at: Number(service.updated_at) / 1000000,
      delivery_time_days: Number(service.delivery_time_days || 7),
      starting_from_e8s: Number(service.starting_from_e8s || 100000000),
      total_rating: Number(service.total_rating || 0),
      review_count: Number(service.review_count || 0),
      tags: service.tags || [],
      min_delivery_days: Number(service.delivery_time_days || 7),
      max_delivery_days: Number(service.delivery_time_days || 7),
      delivery_timeline: `${Number(service.delivery_time_days || 7)} days`,
      tier_mode: (additionalData as any).tier_mode || '3tier',
      packages: packages,
      client_questions: (additionalData as any).client_questions || [],
      faqs: (additionalData as any).faqs || [],
      similarServices: [] // Empty array for now
    };

    // Return merged service data
    return NextResponse.json({
      success: true,
      data: mergedService
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}

// PUT /api/marketplace/services/[serviceId] - Update service
export async function PUT(
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
    const body = await request.json();
    const { userEmail, userId, updates } = body;

    if (!userEmail || !userId) {
      return NextResponse.json({
        success: false,
        error: 'User email and ID are required'
      }, { status: 400 });
    }

    if (!updates) {
      return NextResponse.json({
        success: false,
        error: 'Update data is required'
      }, { status: 400 });
    }

    const actor = await getMarketplaceActor();

    if (typeof updates.status !== 'undefined') {
      return NextResponse.json({
        success: false,
        error: 'Service status updates are not supported yet.'
      }, { status: 400 });
    }

    const currentService = await actor.getService(serviceId);
    const serviceRecord = Array.isArray(currentService) ? currentService[0] : currentService?.ok;

    if (!serviceRecord) {
      return NextResponse.json({
        success: false,
        error: 'Service not found'
      }, { status: 404 });
    }

    const title = updates.title ?? serviceRecord.title;
    const mainCategory = updates.main_category ?? serviceRecord.main_category;
    const subCategory = updates.sub_category ?? serviceRecord.sub_category;
    const description = updates.description ?? serviceRecord.description;
    const whatsIncluded = updates.whats_included ?? serviceRecord.whats_included;
    const coverImageUrl = updates.cover_image_url ?? serviceRecord.cover_image_url;
    const portfolioImages = updates.portfolio_images ?? serviceRecord.portfolio_images ?? [];

    const deliveryTimeDaysRaw = updates.delivery_time_days ?? serviceRecord.delivery_time_days ?? 7;
    const deliveryTimeDays =
      typeof deliveryTimeDaysRaw === 'bigint'
        ? Number(deliveryTimeDaysRaw)
        : Math.round(Number(deliveryTimeDaysRaw ?? 7));

    const startingFromRaw = updates.starting_from_e8s ?? serviceRecord.starting_from_e8s ?? BigInt(0);
    const startingFromE8s =
      typeof startingFromRaw === 'bigint'
        ? startingFromRaw
        : BigInt(Math.round(Number(startingFromRaw)));

    const tagsValue = updates.tags ?? serviceRecord.tags ?? [];
    const tags: string[] = Array.isArray(tagsValue)
      ? tagsValue.map((tag) => String(tag))
      : [];

    const tierMode = updates.tier_mode ?? serviceRecord.tier_mode ?? '1tier';

    const asString = (val: any) => (typeof val === 'string' ? val : (Array.isArray(val) && val.length > 0 ? String(val[0]) : ''));
    const asOptString = (val: any) => {
      const s = asString(val);
      return s && s !== '' ? [s] : [];
    };

    const updateResult = await actor.updateService(
      serviceId,
      asString(title),
      asString(mainCategory),
      asString(subCategory),
      asString(description),
      asString(whatsIncluded),
      asOptString(coverImageUrl),
      Array.isArray(portfolioImages) ? portfolioImages.map(img => String(img)) : [],
      BigInt(deliveryTimeDays),
      startingFromE8s,
      tags,
      asString(tierMode)
    );

    if ('ok' in updateResult) {
      // Also update additional storage for FAQs and Client Questions
      try {
        const { updateAdditionalServiceData } = await import('@/lib/service-storage');
        await updateAdditionalServiceData(serviceId, {
          client_questions: updates.client_questions,
          faqs: updates.faqs,
          description_format: updates.description_format
        });
      } catch (storageError) {
        console.warn('Failed to update additional service data:', storageError);
      }

      return NextResponse.json({
        success: true,
        data: updateResult.ok
      });
    }

    return NextResponse.json({
      success: false,
      error: handleApiError(updateResult.err)
    }, { status: 400 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}

// DELETE /api/marketplace/services/[serviceId] - Delete service
export async function DELETE(
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

    // Get logged-in user from session - REQUIRED for security
    const session = await getSession();

    if (!session || !session.email || !session.userId) {
      console.error('❌ Delete service failed: User not authenticated');
      return NextResponse.json({
        success: false,
        error: 'You must be logged in to delete a service. Please log in and try again.'
      }, { status: 401 });
    }

    const authenticatedEmail = session.email;
    const authenticatedUserId = session.userId;

    console.log('🔐 Authenticated user deleting service:', authenticatedEmail);

    const { serviceId } = await params;

    console.log('🗑️ Deleting service:', serviceId, 'for user:', authenticatedEmail);

    const actor = await getMarketplaceActor();
    const result = await actor.deleteService(serviceId);

    if ('ok' in result) {
      return NextResponse.json({
        success: true,
        message: 'Service deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: handleApiError(result.err)
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
