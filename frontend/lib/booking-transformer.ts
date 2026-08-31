import { Booking } from '@/hooks/useMarketplace';
import { getUserProfileByEmail } from './user-profile';

// Date formatting helper functions
export function formatBookingDate(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Date not set';
  }
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Time not set';
  }

  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((absDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (diff > 0) {
    // Future timestamp
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'soon';
  } else {
    // Past timestamp
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}

export function isOverdue(deadline: number): boolean {
  if (!deadline || deadline === 0) return false;
  return Date.now() > deadline;
}

export function getTimeRemaining(deadline: number): string {
  if (!deadline || deadline === 0) return 'No deadline set';

  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) return 'Overdue';

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  return 'Less than 1 hour remaining';
}

// Types for canister booking data (matching the IDL)
interface CanisterBooking {
  booking_id: string;
  service_id: string;
  package_id: string;
  client_id: string;
  freelancer_id: string;
  title: string;
  description: string;
  requirements: string[];
  status: { [key: string]: null };
  payment_status: { [key: string]: null };
  total_amount_e8s: bigint;
  currency: string;
  created_at: bigint;
  updated_at: bigint;
  deadline: bigint;
  milestones: string[];
  current_milestone?: string;
  client_review?: string;
  client_rating?: number;
  freelancer_review?: string;
  freelancer_rating?: number;
  dispute_id?: string;
}

// Status transformation functions
function transformCanisterStatus(canisterStatus: { [key: string]: null }): string {
  const statusKey = Object.keys(canisterStatus)[0];
  const statusMap: Record<string, string> = {
    'Pending': 'Pending',
    'Active': 'InProgress',
    'InDispute': 'Disputed',
    'Completed': 'Completed',
    'Paid': 'Paid',
    'Cancelled': 'Cancelled'
  };

  return statusMap[statusKey] || 'Pending';
}

function transformCanisterPaymentStatus(
  canisterPaymentStatus: { [key: string]: null },
  bookingStatus?: string
): string {
  const paymentKey = Object.keys(canisterPaymentStatus)[0];
  const paymentMap: Record<string, string> = {
    'Pending': 'Pending',
    'HeldInEscrow': 'Funded',
    'Released': 'Paid',
    'Refunded': 'Refunded',
    'Disputed': 'Disputed'
  };

  return paymentMap[paymentKey] || 'Pending';
}

function convertBigIntToNumber(value: bigint): number {
  return Number(value);
}

// Convert e8s (ICP smallest unit) to dollars
function convertE8sToDollars(e8s: number): number {
  // 1 ICP = 100,000,000 e8s
  // Assuming 1 ICP = $10 (this should be fetched from a price API in production)
  const icpPrice = 10; // USD per ICP
  const icpAmount = e8s / 100000000;
  return icpAmount * icpPrice;
}

function convertBigIntTimestamp(timestamp: bigint): number {
  try {
    // Convert BigInt to Number safely
    const timestampAsNumber = Number(timestamp);

    // Check if the conversion resulted in an invalid number (too large)
    if (!Number.isFinite(timestampAsNumber)) {
      console.warn('⚠️ BigInt value too large, using current time as fallback');
      return Date.now();
    }

    // Check if timestamp is already in milliseconds (if it's a large number)
    let milliseconds: number;
    if (timestampAsNumber > 1000000000000) {
      // Already in milliseconds
      milliseconds = timestampAsNumber;
    } else if (timestampAsNumber > 1000000000) {
      // In seconds, convert to milliseconds
      milliseconds = timestampAsNumber * 1000;
    } else {
      // In nanoseconds, convert to milliseconds
      milliseconds = timestampAsNumber / 1000000;
    }

    // Handle zero timestamp (returns 1/1/1970) by using current time as fallback
    if (milliseconds === 0) {
      console.warn('⚠️ Zero timestamp detected, using current time as fallback');
      return Date.now();
    }

    // Validate timestamp is reasonable (not too old or too far in future)
    const now = Date.now();
    const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60 * 1000);
    const tenYearsFromNow = now + (10 * 365 * 24 * 60 * 60 * 1000);

    if (milliseconds < tenYearsAgo || milliseconds > tenYearsFromNow) {
      console.warn('⚠️ Timestamp out of reasonable range, using current time:', {
        originalTimestamp: timestampAsNumber,
        convertedMilliseconds: milliseconds
      });
      return Date.now();
    }

    return Math.floor(milliseconds);
  } catch (error) {
    console.error('❌ Error converting BigInt timestamp:', error);
    return Date.now();
  }
}

// Transform canister booking data to frontend booking interface
export async function transformCanisterBooking(canisterBooking: CanisterBooking): Promise<Booking> {
  try {
    const totalAmountE8s = convertBigIntToNumber(canisterBooking.total_amount_e8s);
    const totalAmountDollars = convertE8sToDollars(totalAmountE8s);

    // Fetch service data to get the correct freelancer
    let freelancerId = canisterBooking.freelancer_id;
    let freelancerName = canisterBooking.freelancer_id;

    // If freelancer_id is 'anonymous', try to get the real freelancer from service
    if (freelancerId === 'anonymous' && canisterBooking.service_id) {
      try {
        const { getMarketplaceActor } = await import('@/lib/ic-marketplace-agent');
        const actor = await getMarketplaceActor();
        const serviceResult = await actor.getService(canisterBooking.service_id);

        if (serviceResult && serviceResult.length > 0) {
          const service = serviceResult[0];
          freelancerId = service.freelancer_id;
          console.log('✅ Found real freelancer for booking:', freelancerId);
        } else {
          // Try to get from local storage
          const { getAdditionalServiceData } = await import('@/lib/service-storage');
          const additionalData = getAdditionalServiceData(canisterBooking.service_id);
          if (additionalData?.freelancer_email) {
            freelancerId = additionalData.freelancer_email;
            console.log('✅ Found freelancer from local storage:', freelancerId);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching freelancer for booking:', error);
      }
    }

    // Try to get freelancer name from profile
    if (freelancerId && freelancerId !== 'anonymous' && freelancerId.includes('@')) {
      try {
        const profile = await getUserProfileByEmail(freelancerId);
        if (profile) {
          freelancerName = profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || freelancerId;
        }
      } catch (error) {
        console.error('❌ Error fetching freelancer name:', error);
      }
    }

    // Default to email username if still anonymous
    if (freelancerName === 'anonymous' || !freelancerName) {
      freelancerName = freelancerId.includes('@') ? freelancerId.split('@')[0] : freelancerId;
    }

    const bookingStatus = transformCanisterStatus(canisterBooking.status);

    // Convert timestamps
    const created_at = convertBigIntTimestamp(canisterBooking.created_at);
    const deadlineTimestamp = convertBigIntTimestamp(canisterBooking.deadline);

    // If deadline is invalid (0 or too old), calculate from created_at + default delivery days
    // Check if deadline is reasonable (not 1970 or before created_at)
    const defaultDeliveryDays = 7; // Default 7 days
    let delivery_deadline = deadlineTimestamp;

    if (!deadlineTimestamp || deadlineTimestamp <= created_at || deadlineTimestamp < 946684800000) { // Before 2000-01-01
      // Calculate deadline from created_at + delivery days
      delivery_deadline = created_at + (defaultDeliveryDays * 24 * 60 * 60 * 1000);
      console.log('⚠️ Invalid deadline, calculating from created_at:', {
        originalDeadline: deadlineTimestamp,
        created_at,
        calculatedDeadline: delivery_deadline
      });
    }

    const transformedBooking: Booking = {
      booking_id: canisterBooking.booking_id,
      client_id: canisterBooking.client_id,
      freelancer_id: freelancerId,
      package_id: canisterBooking.package_id,
      service_id: canisterBooking.service_id,
      status: bookingStatus,
      total_amount_e8s: totalAmountE8s,
      total_amount_dollars: totalAmountDollars,
      escrow_amount_e8s: Math.floor(totalAmountE8s * 0.95), // 95% escrow
      escrow_amount_dollars: convertE8sToDollars(Math.floor(totalAmountE8s * 0.95)),
      payment_status: transformCanisterPaymentStatus(canisterBooking.payment_status, bookingStatus),
      client_notes: canisterBooking.description || canisterBooking.requirements.join(' '),
      created_at: created_at,
      updated_at: convertBigIntTimestamp(canisterBooking.updated_at),

      // Enhanced fields from canister data
      service_title: canisterBooking.title,
      package_title: 'Standard Package',
      package_tier: 'basic',
      delivery_deadline: delivery_deadline,

      // Additional fields with fetched data
      special_instructions: canisterBooking.requirements.join(' '),
      freelancer_name: freelancerName,

      // Set default values for fields not in canister
      ledger_deposit_block: null,
      payment_method: 'icp',
      payment_id: canisterBooking.booking_id,
      transaction_id: `txn_${canisterBooking.booking_id}`,
      upsells: [],
      promo_code: undefined
    };

    return transformedBooking;
  } catch (error) {
    console.error('Error transforming canister booking:', error);
    throw new Error(`Failed to transform booking data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Transform an array of canister bookings
export async function transformCanisterBookings(canisterBookings: CanisterBooking[]): Promise<Booking[]> {
  return await Promise.all(canisterBookings.map(booking => transformCanisterBooking(booking)));
}

// Convert UI status filter to canister status filter
export function convertStatusFilter(uiStatus?: string): [] | [{ [key: string]: null }] {
  if (!uiStatus) return [];

  const statusMap: Record<string, string> = {
    'Pending': 'Pending',
    'InProgress': 'Active',
    'Disputed': 'InDispute',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled'
  };

  const canisterStatus = statusMap[uiStatus];
  if (!canisterStatus) return [];

  return [{ [canisterStatus]: null }];
}

// Create a mock booking for testing when canister is not available
export function createMockBooking(userId: string): Booking {
  const timestamp = Date.now();
  return {
    booking_id: `mock-${timestamp}`,
    client_id: userId,
    freelancer_id: 'demo-freelancer@example.com',
    package_id: 'demo-package-1',
    service_id: 'demo-service-1',
    status: 'Pending',
    total_amount_e8s: 100000000, // 1 ICP
    total_amount_dollars: 10, // $10
    escrow_amount_e8s: 95000000, // 0.95 ICP
    escrow_amount_dollars: 9.5, // $9.50
    payment_status: 'Pending',
    client_notes: 'Demo booking for testing purposes',
    created_at: timestamp,
    updated_at: timestamp,
    service_title: 'Demo Web Development Service',
    freelancer_name: 'Demo Freelancer',
    package_title: 'Basic Package',
    package_tier: 'basic',
    delivery_deadline: timestamp + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    special_instructions: 'Demo booking created for testing marketplace integration',
    ledger_deposit_block: null,
    payment_method: 'icp',
    payment_id: `demo-payment-${timestamp}`,
    transaction_id: `demo-transaction-${timestamp}`,
    upsells: [],
    promo_code: undefined
  };
}