// Enhanced booking data storage (canister-based implementation)
import { getMarketplaceActor } from './ic-marketplace-agent';

// Helper function to ensure service exists in canister (create if needed)
export async function ensureServiceExistsInCanister(serviceData: any, packageData?: any): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  try {
    console.log('🏢 Creating service in canister for booking:', serviceData.service_id);
    
    const actor = await getMarketplaceActor();
    
    // Use package price if available, otherwise use service price, fallback to 100000000 (1 ICP)
    const startingPrice = packageData?.price_e8s || serviceData.starting_from_e8s || 100000000;
    
    // Ensure title meets canister validation requirements (minimum length)
    const serviceTitle = serviceData.title && serviceData.title.length >= 3 
      ? serviceData.title 
      : 'Web Development Service';
    
    const serviceDescription = serviceData.description && serviceData.description.length >= 10
      ? serviceData.description
      : 'Professional web development services with modern technologies and best practices.';
    
    const whatsIncluded = serviceData.whats_included && serviceData.whats_included.length >= 10
      ? serviceData.whats_included
      : 'Complete web development solution including design, development, testing, and deployment.';
    
    // Use the new createServiceForBooking method that doesn't require freelancer auth
    const createResult = await actor.createServiceForBooking(
      serviceData.service_id,
      serviceData.freelancer_email || 'freelancer@example.com',
      serviceTitle,
      serviceData.main_category || 'Web Development',
      serviceData.sub_category || 'Frontend Development',
      serviceDescription,
      whatsIncluded,
      BigInt(serviceData.delivery_time_days || 7),
      BigInt(startingPrice),
      serviceData.tags || ['web', 'development', 'modern']
    );
    
    if ('ok' in createResult) {
      console.log('✅ Service created successfully in canister:', createResult.ok);
      return { success: true, serviceId: createResult.ok };
    } else {
      console.error('❌ Failed to create service in canister:', createResult.err);
      return { success: false, error: JSON.stringify(createResult.err) };
    }
  } catch (error) {
    console.error('❌ Error creating service in canister:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper function to ensure package exists in canister (create if needed)
export async function ensurePackageExistsInCanister(packageData: any, serviceId: string): Promise<{ success: boolean; packageId?: string; error?: string }> {
  try {
    console.log('📦 Creating package in canister for booking:', packageData.package_id);
    
    const actor = await getMarketplaceActor();
    
    // Ensure package data meets canister validation requirements
    const packageTitle = (packageData.title || packageData.name) && (packageData.title || packageData.name).length >= 3
      ? (packageData.title || packageData.name)
      : 'Basic Package';
    
    const packageDescription = packageData.description && packageData.description.length >= 10
      ? packageData.description
      : 'Complete service package with professional delivery and quality assurance.';
    
    const deliveryTimeline = packageData.delivery_timeline && packageData.delivery_timeline.length >= 5
      ? packageData.delivery_timeline
      : `${packageData.delivery_days || 7} days delivery`;
    
    // Ensure price is valid (greater than 0)
    const packagePrice = packageData.price_e8s && packageData.price_e8s > 0
      ? packageData.price_e8s
      : 100000000; // 1 ICP minimum
    
    // Use the new createPackageForBooking method that doesn't require freelancer auth
    const createResult = await actor.createPackageForBooking(
      serviceId,
      packageData.package_id,
      packageTitle,
      packageDescription,
      BigInt(packagePrice),
      BigInt(packageData.delivery_days || 7),
      deliveryTimeline,
      BigInt(packageData.revisions_included || 1),
      packageData.features || ['Professional delivery', 'Quality assurance', 'Support included']
    );
    
    if ('ok' in createResult) {
      console.log('✅ Package created successfully in canister:', createResult.ok);
      return { success: true, packageId: createResult.ok };
    } else {
      console.error('❌ Failed to create package in canister:', createResult.err);
      return { success: false, error: JSON.stringify(createResult.err) };
    }
  } catch (error) {
    console.error('❌ Error creating package in canister:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper function to create booking in canister (used by payment confirmation)
export async function createBookingInCanister(bookingData: any): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    console.log('🏗️ Creating booking in canister:', bookingData.booking_id);
    
    const actor = await getMarketplaceActor();
    
    // Create booking via canister using bookPackage method
    // Generate unique idempotency key to prevent duplicate booking errors
    // Note: Canister expects 5 parameters: clientId, clientEmail, packageId, idempotencyKey, specialInstructions
    const idempotencyKey = `${bookingData.booking_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get client email - use client_email if provided, otherwise use client_id if it looks like an email
    const clientEmail = bookingData.client_email || 
                       (bookingData.client_id?.includes('@') ? bookingData.client_id : `${bookingData.client_id}@example.com`);
    
    const result = await (actor as any).bookPackage(
      bookingData.client_id,
      clientEmail,  // clientEmail: Text (required by canister)
      bookingData.package_id,
      idempotencyKey,
      bookingData.special_instructions || ''
    );
    
    if ('ok' in result) {
      console.log('✅ Booking created successfully in canister:', result.ok);
      return { success: true, bookingId: result.ok.booking_id };
    } else {
      console.error('❌ Failed to create booking in canister:', result.err);
      return { success: false, error: JSON.stringify(result.err) };
    }
  } catch (error) {
    console.error('❌ Error creating booking in canister:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper function to get booking from canister (used by other APIs)
export async function getBookingFromCanister(bookingId: string): Promise<any> {
  try {
    const actor = await getMarketplaceActor();
    const result = await actor.getBookingById(bookingId);
    
    if ('ok' in result) {
      return result.ok;
    } else {
      console.error('❌ Failed to get booking from canister:', result.err);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting booking from canister:', error);
    return null;
  }
}

// Helper function to get bookings for a client from canister
export async function getBookingsForClientFromCanister(clientId: string, statusFilter?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
  try {
    console.log('🔍 Getting bookings for client from canister:', clientId);
    const actor = await getMarketplaceActor();
    
    // Convert status filter to canister format
    let statusVariant: [] | [{ [key: string]: null }] = [];
    if (statusFilter) {
      switch (statusFilter) {
        case 'Pending': statusVariant = [{ Pending: null }]; break;
        case 'Active': statusVariant = [{ Active: null }]; break;
        case 'InDispute': statusVariant = [{ InDispute: null }]; break;
        case 'Completed': statusVariant = [{ Completed: null }]; break;
        case 'Cancelled': statusVariant = [{ Cancelled: null }]; break;
      }
    }
    
    const result = await actor.listBookingsForClient(clientId, statusVariant, BigInt(limit), BigInt(offset));
    
    if ('ok' in result) {
      console.log('✅ Retrieved bookings from canister:', result.ok.length, 'bookings for client:', clientId);
      return result.ok;
    } else {
      console.error('❌ Failed to get bookings for client from canister:', result.err);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting bookings for client from canister:', error);
    return [];
  }
}

// Helper function to get bookings for freelancer from canister (used by other APIs)
export async function getBookingsForFreelancerFromCanister(freelancerId: string, statusFilter?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
  try {
    console.log('🔍 Getting bookings for freelancer from canister:', freelancerId);
    const actor = await getMarketplaceActor();

    // Convert status filter to canister format
    let statusVariant: [] | [{ [key: string]: null }] = [];
    if (statusFilter) {
      switch (statusFilter) {
        case 'Pending': statusVariant = [{ Pending: null }]; break;
        case 'Active': statusVariant = [{ Active: null }]; break;
        case 'InDispute': statusVariant = [{ InDispute: null }]; break;
        case 'Completed': statusVariant = [{ Completed: null }]; break;
        case 'Cancelled': statusVariant = [{ Cancelled: null }]; break;
      }
    }

    const result = await actor.listBookingsForFreelancer(freelancerId, statusVariant, BigInt(limit), BigInt(offset));

    if ('ok' in result) {
      console.log('✅ Retrieved bookings from canister:', result.ok.length, 'bookings for freelancer:', freelancerId);
      return result.ok;
    } else {
      console.error('❌ Failed to get bookings for freelancer from canister:', result.err);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting bookings for freelancer from canister:', error);
    return [];
  }
}

// Get enhanced booking data by booking ID
export function getEnhancedBookingData(bookingId: string): any {
  try {
    // This would typically fetch from the canister or database
    // For now, return null to indicate that the booking should be fetched from the canister
    // The calling code should handle the null case appropriately
    console.log('🔍 getEnhancedBookingData called for booking:', bookingId);
    return null; // Let the calling code handle fetching from canister
  } catch (error) {
    console.error('❌ Error getting enhanced booking data:', error);
    return null;
  }
}
