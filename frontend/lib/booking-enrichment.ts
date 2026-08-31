import { getMarketplaceActor } from './ic-marketplace-agent';
import { getUserProfileByEmail } from './user-profile';

// Cache for package details (10 minute TTL)
const packageCache = new Map<string, { data: any; timestamp: number }>();
const PACKAGE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch user profile using centralized utility
 */
export async function fetchUserProfile(email: string): Promise<any> {
  if (!email || !email.includes('@')) {
    return null;
  }

  try {
    const profile = await getUserProfileByEmail(email);
    if (profile) {
      return {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        fullName: profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        email: email
      };
    }
  } catch (error) {
    console.warn(`⚠️ Failed to fetch profile for ${email} in enrichment:`, error);
  }

  return null;
}

/**
 * Fetch package details from canister with caching
 */
export async function fetchPackageDetails(packageId: string): Promise<any> {
  if (!packageId) {
    return null;
  }

  // Check cache
  const cached = packageCache.get(packageId);
  if (cached && Date.now() - cached.timestamp < PACKAGE_CACHE_TTL) {
    console.log(`✅ Using cached package for ${packageId}`);
    return cached.data;
  }

  try {
    const actor = await getMarketplaceActor();
    const result = await actor.getPackagesByServiceId(packageId.split('-')[0]); // Attempt to get by service ID

    if (result && result.length > 0) {
      const pkg = result.find((p: any) => p.package_id === packageId) || result[0];

      const packageData = {
        package_id: pkg.package_id,
        name: pkg.name,
        description: pkg.description,
        price_e8s: Number(pkg.price_e8s),
        delivery_time_days: Number(pkg.delivery_time_days),
        delivery_timeline: pkg.delivery_timeline,
        revisions: Number(pkg.revisions),
        features: pkg.features || [],
        tier: extractTierFromPackageName(pkg.name) // Extract from name
      };

      // Cache the result
      packageCache.set(packageId, { data: packageData, timestamp: Date.now() });
      return packageData;
    }
  } catch (error) {
    console.warn(`⚠️ Failed to fetch package details for ${packageId}:`, error);
  }

  return null;
}

/**
 * Extract tier from package name
 */
function extractTierFromPackageName(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('premium') || nameLower.includes('pro')) {
    return 'premium';
  } else if (nameLower.includes('standard') || nameLower.includes('advanced')) {
    return 'standard';
  } else if (nameLower.includes('basic') || nameLower.includes('starter')) {
    return 'basic';
  }
  return 'basic'; // Default
}

/**
 * Get payment session data from local storage (if available)
 */
export function getPaymentSessionData(bookingId: string): any {
  try {
    const fs = require('fs');
    const path = '/tmp/bookings.json';

    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf8');
      const bookings = JSON.parse(data);

      // Find booking by ID
      const booking = Object.values(bookings).find((b: any) => b.booking_id === bookingId);

      if (booking) {
        return booking;
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not read payment session data for ${bookingId}:`, error);
  }

  return null;
}

/**
 * Main enrichment function - enriches a single booking
 */
export async function enrichBooking(booking: any): Promise<any> {
  console.log(`🔧 Enriching booking: ${booking.booking_id}`);

  // Start all async operations in parallel
  const [packageDetails, clientProfile, freelancerProfile, paymentData] = await Promise.allSettled([
    fetchPackageDetails(booking.package_id),
    fetchUserProfile(booking.client_id),
    fetchUserProfile(booking.freelancer_id),
    Promise.resolve(getPaymentSessionData(booking.booking_id))
  ]);

  // Extract package details
  const pkgData = packageDetails.status === 'fulfilled' ? packageDetails.value : null;

  // Extract user profiles
  const clientData = clientProfile.status === 'fulfilled' ? clientProfile.value : null;
  const freelancerData = freelancerProfile.status === 'fulfilled' ? freelancerProfile.value : null;

  // Extract payment data
  const payData = paymentData.status === 'fulfilled' ? paymentData.value : null;

  // Calculate amounts if not present
  const totalAmountE8s = Number(booking.total_amount_e8s || 0);
  const platformFeeE8s = payData?.platform_fee_e8s || Math.floor(totalAmountE8s * 0.05);
  const baseAmountE8s = totalAmountE8s - platformFeeE8s;
  const escrowAmountE8s = Math.floor(totalAmountE8s * 0.95);

  // Build enriched booking
  const enrichedBooking = {
    ...booking,

    // User names
    client_name: clientData?.fullName || booking.client_id,
    client_email: booking.client_id,
    freelancer_name: freelancerData?.fullName || booking.freelancer_id,
    freelancer_email: booking.freelancer_id,

    // Package details
    package_title: pkgData?.name || booking.package_title || 'Package',
    package_description: pkgData?.description || booking.package_description || '',
    package_tier: pkgData?.tier || booking.package_tier || 'basic',
    package_delivery_days: pkgData?.delivery_time_days || booking.delivery_days || 7,
    package_revisions: pkgData?.revisions || booking.package_revisions || 1,
    package_features: pkgData?.features || booking.package_features || [],

    // Payment details
    base_amount_e8s: baseAmountE8s,
    platform_fee_e8s: platformFeeE8s,
    escrow_amount_e8s: escrowAmountE8s,
    escrow_amount_dollars: (escrowAmountE8s / 100000000) * 10, // Assuming $10 per ICP
    payment_method: payData?.payment_method || booking.payment_method || 'icp',
    payment_id: payData?.payment_id || booking.payment_id || booking.booking_id,
    transaction_id: payData?.transaction_id || booking.transaction_id || `txn_${booking.booking_id}`,

    // Upsells
    upsells: payData?.upsells || booking.upsells || [],

    // Promo
    promo_code: payData?.promo_code || booking.promo_code || null,
    discount_amount: payData?.discount_amount || 0,

    // Time tracking (recalculate if needed)
    time_remaining_hours: booking.delivery_deadline
      ? Math.floor((Number(booking.delivery_deadline) - Date.now()) / (60 * 60 * 1000))
      : booking.time_remaining_hours || 0,

    // Ensure readable timestamps
    created_at_readable: booking.created_at_readable || new Date(Number(booking.created_at)).toISOString(),
    delivery_deadline_readable: booking.delivery_deadline_readable || new Date(Number(booking.delivery_deadline || booking.deadline)).toISOString(),
  };

  console.log(`✅ Enriched booking ${booking.booking_id}`);
  return enrichedBooking;
}

/**
 * Enrich multiple bookings in parallel
 */
export async function enrichBookings(bookings: any[]): Promise<any[]> {
  console.log(`🔧 Enriching ${bookings.length} bookings...`);

  // Process in parallel with a reasonable concurrency limit
  const enrichedBookings = await Promise.all(
    bookings.map(booking => enrichBooking(booking))
  );

  console.log(`✅ Successfully enriched ${enrichedBookings.length} bookings`);
  return enrichedBookings;
}

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export function clearEnrichmentCaches() {
  packageCache.clear();
  console.log('🧹 Cleared all enrichment caches');
}


