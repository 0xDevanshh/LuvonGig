import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor } from '@/lib/ic-marketplace-agent';
import { getMarketplaceConfig, validateMarketplaceConfig } from '@/lib/marketplace-config';
import { getSession } from '@/lib/auth';
import { getUserUsage } from '@/lib/db/usage-service';

// Helper function to get freelancer email from canister service data
async function getFreelancerEmailFromService(actor: any, serviceId: string): Promise<string | null> {
  try {
    // Get service data from canister only
    const serviceResult = await actor.getService(serviceId);
    if ('ok' in serviceResult) {
      const serviceData = serviceResult.ok;

      // Check if service has freelancer_email field
      if (serviceData.freelancer_email) {
        console.log('✅ Found freelancer email from canister:', serviceData.freelancer_email);
        return serviceData.freelancer_email;
      }

      // If canister service data has freelancer_id, use that
      if (serviceData.freelancer_id && serviceData.freelancer_id.includes('@')) {
        console.log('✅ Using freelancer_id from canister:', serviceData.freelancer_id);
        return serviceData.freelancer_id;
      }
    }

  } catch (error) {
    console.warn('Failed to fetch service data from canister:', error);
  }

  console.log('ℹ️ No freelancer email found in canister for service:', serviceId);
  return null;
}

import {
  transformCanisterBookings,
  convertStatusFilter
} from '@/lib/booking-transformer';
import { emailsMatch } from '@/lib/email-matching';
import { getBookingsForClientFromCanister, getBookingsForFreelancerFromCanister } from '@/lib/booking-utils';
import { enrichBookings } from '@/lib/booking-enrichment';

// Helper function to map payment booking status to marketplace status
function mapBookingStatus(paymentStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'InProgress',
    'completed': 'Completed',
    'pending': 'Pending',
    'pending_payment': 'Pending',
    'cancelled': 'Cancelled',
    'expired': 'Cancelled'
  };

  return statusMap[paymentStatus.toLowerCase()] || 'Pending';
}

// Helper functions to get user information
async function getClientEmail(clientId: string): Promise<string | null> {
  try {
    // In a real implementation, this would query the user database or auth context
    // For now, we'll use the clientId directly if it looks like an email
    if (clientId.includes('@')) {
      return clientId;
    }
    return `client-${clientId}@example.com`;
  } catch (error) {
    console.error('Error getting client email:', error);
    return null;
  }
}

// Storage helper functions removed - using canister data directly

// GET /api/marketplace/bookings - List bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const userType = searchParams.get('user_type') as 'client' | 'freelancer';
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!userType || !['client', 'freelancer'].includes(userType)) {
      return NextResponse.json({
        success: false,
        error: 'User type must be client or freelancer'
      }, { status: 400 });
    }

    let bookings: any[] = [];
    let realBookingsCount = 0;
    let dataSource = 'unknown';

    // Get marketplace actor
    const actor = await getMarketplaceActor();

    try {
      // Try to get real data from marketplace canister
      console.log('🔍 Attempting to fetch bookings from marketplace canister...');
      validateMarketplaceConfig();

      // Call marketplace canister based on user type
      const result = userType === 'client'
        ? await actor.listBookingsForClient(
          userId,
          convertStatusFilter(status),
          BigInt(limit),
          BigInt(offset)
        )
        : await actor.listBookingsForFreelancer(
          userId,
          convertStatusFilter(status),
          BigInt(limit),
          BigInt(offset)
        );

      if ('ok' in result) {
        console.log('✅ Successfully fetched bookings from canister');
        const canisterBookings = result.ok;

        // Transform canister bookings
        let transformedBookings = await transformCanisterBookings(canisterBookings);

        // Enrich bookings with additional data
        console.log('🔧 Enriching bookings with package details, user names, and payment data...');
        bookings = await enrichBookings(transformedBookings);

        realBookingsCount = canisterBookings.length;
        dataSource = 'canister';

        console.log(`📊 Retrieved ${realBookingsCount} real bookings from marketplace canister for user ${userId}`);
        console.log(`✅ Enriched ${bookings.length} bookings with complete data`);
      } else {
        throw new Error(`Canister error: ${result.err}`);
      }

    } catch (canisterError) {
      console.error('❌ Failed to fetch from marketplace canister:', canisterError);
      console.log('🔄 Falling back to available data sources...');

      // Fallback 1: Try to get bookings from canister with fuzzy email matching
      try {
        console.log('🔄 Attempting to get bookings from canister with fuzzy matching...');

        if (userType === 'client') {
          // Get bookings for client from canister
          const canisterBookings = await getBookingsForClientFromCanister(userId, status, limit, offset);

          if (canisterBookings.length > 0) {
            // Transform canister bookings to match expected format
            const transformedBookings = await Promise.all(canisterBookings.map(async (booking) => {
              const totalAmountE8s = Number(booking.total_amount_e8s);
              const totalAmountDollars = (totalAmountE8s / 100000000) * 10; // Convert e8s to dollars (assuming $10 per ICP)
              // Get freelancer email from canister service data
              const freelancerEmail = await getFreelancerEmailFromService(actor, booking.service_id);

              // Use the email from canister or the original freelancer_id
              const finalFreelancerEmail = freelancerEmail || booking.freelancer_id;
              console.log(`[DEBUG] Final freelancer email: ${finalFreelancerEmail}`);

              // Fetch freelancer plan fee
              let freelancerPlanFee = 0.04;
              try {
                const usage = await getUserUsage(finalFreelancerEmail);
                if (usage && usage.marketplace_fee) {
                  freelancerPlanFee = usage.marketplace_fee;
                }
              } catch (error) {
                console.warn(`⚠️ Could not fetch fee for freelancer ${finalFreelancerEmail}, using default 0.04:`, error);
              }

              const escrowAmountE8s = Math.floor(totalAmountE8s / (1 + freelancerPlanFee));
              const escrowAmountDollars = (escrowAmountE8s / 100000000) * 10;

              return {
                booking_id: booking.booking_id,
                client_id: booking.client_id,
                freelancer_id: finalFreelancerEmail,
                freelancer_email: finalFreelancerEmail, // Add explicit freelancer_email field
                package_id: booking.package_id,
                service_id: booking.service_id,
                status: booking.status,
                total_amount_e8s: totalAmountE8s,
                total_amount_dollars: totalAmountDollars,
                escrow_amount_e8s: escrowAmountE8s,
                escrow_amount_dollars: escrowAmountDollars,
                payment_status: booking.payment_status || 'Completed',
                client_notes: booking.description || '',
                service_title: booking.title || 'Service',
                freelancer_name: finalFreelancerEmail.split('@')[0],
                package_title: 'Package', // Will be enhanced with service data
                package_tier: 'basic',
                payment_method: 'icp',
                payment_id: booking.booking_id,
                transaction_id: `txn_${booking.booking_id}`,
                created_at: Number(booking.created_at),
                updated_at: Number(booking.updated_at),
                ledger_deposit_block: null,
                delivery_deadline: Number(booking.deadline), // Use canister deadline only
                special_instructions: booking.description || '',
                upsells: [],
                promo_code: undefined
              };
            }));

            // Enrich the transformed bookings
            console.log('🔧 Enriching fallback bookings...');
            bookings = await enrichBookings(transformedBookings);

            realBookingsCount = transformedBookings.length;
            dataSource = 'canister';
            console.log(`📊 Retrieved ${realBookingsCount} bookings from canister for user ${userId} (${userType})`);
            console.log(`✅ Enriched ${bookings.length} fallback bookings`);
            console.log(`📋 Booking IDs found:`, transformedBookings.map(b => b.booking_id));
          } else {
            console.log(`❌ No bookings found for user ${userId} (${userType}) in canister`);
          }
        } else if (userType === 'freelancer') {
          // Get bookings for freelancer from canister
          const canisterBookings = await getBookingsForFreelancerFromCanister(userId, status, limit, offset);

          if (canisterBookings.length > 0) {
            // Transform canister bookings to match expected format
            const transformedBookings = await Promise.all(canisterBookings.map(async (booking) => {
              const totalAmountE8s = Number(booking.total_amount_e8s);
              const totalAmountDollars = (totalAmountE8s / 100000000) * 10; // Convert e8s to dollars (assuming $10 per ICP)
              // Get freelancer email from canister service data
              const freelancerEmail = await getFreelancerEmailFromService(actor, booking.service_id);

              // Use the email from canister or the original freelancer_id
              const finalFreelancerEmail = freelancerEmail || booking.freelancer_id;
              console.log(`[DEBUG] Final freelancer email: ${finalFreelancerEmail}`);

              // Fetch freelancer plan fee
              let freelancerPlanFee = 0.04;
              try {
                const usage = await getUserUsage(finalFreelancerEmail);
                if (usage && usage.marketplace_fee) {
                  freelancerPlanFee = usage.marketplace_fee;
                }
              } catch (error) {
                console.warn(`⚠️ Could not fetch fee for freelancer ${finalFreelancerEmail}, using default 0.04:`, error);
              }

              const escrowAmountE8s = Math.floor(totalAmountE8s / (1 + freelancerPlanFee));
              const escrowAmountDollars = (escrowAmountE8s / 100000000) * 10;

              return {
                booking_id: booking.booking_id,
                client_id: booking.client_id,
                freelancer_id: finalFreelancerEmail,
                freelancer_email: finalFreelancerEmail, // Add explicit freelancer_email field
                package_id: booking.package_id,
                service_id: booking.service_id,
                status: booking.status,
                total_amount_e8s: totalAmountE8s,
                total_amount_dollars: totalAmountDollars,
                escrow_amount_e8s: escrowAmountE8s,
                escrow_amount_dollars: escrowAmountDollars,
                payment_status: booking.payment_status || 'Completed',
                client_notes: booking.description || '',
                service_title: booking.title || 'Service',
                freelancer_name: finalFreelancerEmail.split('@')[0],
                package_title: 'Package', // Will be enhanced with service data
                package_tier: 'basic',
                payment_method: 'icp',
                payment_id: booking.booking_id,
                transaction_id: `txn_${booking.booking_id}`,
                created_at: Number(booking.created_at),
                updated_at: Number(booking.updated_at),
                ledger_deposit_block: null,
                delivery_deadline: Number(booking.deadline), // Use canister deadline only
                special_instructions: booking.description || '',
                upsells: [],
                promo_code: undefined
              };
            }));

            // Enrich the transformed bookings
            console.log('🔧 Enriching freelancer fallback bookings...');
            bookings = await enrichBookings(transformedBookings);

            realBookingsCount = transformedBookings.length;
            dataSource = 'canister';
            console.log(`📊 Retrieved ${realBookingsCount} bookings from canister for freelancer ${userId}`);
            console.log(`✅ Enriched ${bookings.length} freelancer fallback bookings`);
            console.log(`📋 Booking IDs found:`, transformedBookings.map(b => b.booking_id));
          } else {
            console.log(`❌ No bookings found for freelancer ${userId} in canister`);
          }
        }
      } catch (canisterError) {
        console.warn('⚠️  Canister fallback also failed:', canisterError);
      }


      // No fallbacks - return empty list if no bookings found in canister
      if (bookings.length === 0) {
        console.log(`📝 No bookings found for user ${userId} in canister - returning empty list`);
      }
    }

    console.log(`📊 Final result: ${bookings.length} bookings (Real: ${realBookingsCount}, Source: ${dataSource})`);

    return NextResponse.json({
      success: true,
      data: bookings,
      realBookingsCount,
      dataSource,
      canisterAvailable: dataSource === 'canister',
      environmentConfigured: getMarketplaceConfig().isConfigured
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings'
    }, { status: 500 });
  }
}

// POST /api/marketplace/bookings - Book a package
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/marketplace/bookings called');

  try {
    // Get logged-in user session
    const session = await getSession();
    let userEmail = '';
    let userId = '';

    if (session && session.email && session.userId) {
      userEmail = session.email;
      userId = session.userId;
      console.log('🔐 User authenticated:', userEmail);
    }

    const body = await request.json();
    const {
      clientId,
      packageId,
      specialInstructions,
      paymentMethod,
      totalAmount,
      upsells,
      promoCode,
      paymentId,
      transactionId,
      serviceId: bodyServiceId, // Get serviceId from body if provided
      serviceTitle,
      freelancerId,
      packageTitle,
      packageDescription,
      deliveryDays
    } = body;

    // Use logged-in user email if available, otherwise fall back to clientId from body
    const effectiveClientId = userEmail || clientId;
    const effectiveUserId = userId || clientId;

    console.log('📝 Request body:', {
      clientId: effectiveClientId,
      userId: effectiveUserId,
      packageId,
      specialInstructions,
      paymentMethod,
      totalAmount,
      upsells: upsells?.length || 0,
      promoCode,
      paymentId,
      transactionId
    });

    if (!effectiveClientId) {
      return NextResponse.json({
        success: false,
        error: 'User email is required. Please log in.'
      }, { status: 401 });
    }

    if (!packageId) {
      return NextResponse.json({
        success: false,
        error: 'Package ID is required'
      }, { status: 400 });
    }

    // Special instructions are optional - provide default if empty
    const instructions = specialInstructions || 'Standard service booking';
    console.log('📝 Instructions:', instructions);

    // Generate idempotency key
    const idempotencyKey = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔑 Idempotency key:', idempotencyKey);

    // Connect to real marketplace canister
    console.log('🔗 Connecting to marketplace canister...');

    try {
      // Get marketplace actor
      const actor = await getMarketplaceActor();

      // Get service ID from body if provided (for escrow-created bookings), otherwise try to extract from packageId
      const serviceId = bodyServiceId || (packageId.includes('_') ? packageId.split('_')[0] : null);

      if (!serviceId) {
        console.error('❌ Service ID is required but not provided. PackageId:', packageId);
        return NextResponse.json({
          success: false,
          error: 'Service ID is required. Please provide serviceId in the request body.'
        }, { status: 400 });
      }

      console.log('🔍 Using service ID:', serviceId, '(from bodyServiceId:', bodyServiceId, ', packageId:', packageId, ')');

      // Import helper functions for creating services and packages
      const { ensureServiceExistsInCanister, ensurePackageExistsInCanister, createBookingInCanister } = await import('@/lib/booking-utils');

      // Get service data from canister (optional for escrow-created bookings)
      let serviceData = null;
      let serviceResult = null;
      let packageData: any = null; // Declare at higher scope

      try {
        serviceResult = await actor.getService(serviceId);
        if ('ok' in serviceResult) {
          serviceData = serviceResult.ok;
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch service from canister:', error);
      }

      // For escrow-created bookings, create service and package if they don't exist
      if (body.createdFromEscrow) {
        console.log('📦 Creating booking from escrow - ensuring service and package exist');

        // If service doesn't exist, create it
        if (!serviceData) {
          console.log('🏢 Service not found in canister, creating it...');
          const serviceDataToCreate = {
            service_id: serviceId,
            freelancer_email: freelancerId || 'freelancer@example.com',
            title: serviceTitle || 'Service',
            description: packageDescription || 'Service description',
            main_category: 'General',
            sub_category: 'Service',
            delivery_time_days: deliveryDays || 7,
            starting_from_e8s: Math.floor(totalAmount * 100000000),
            tags: []
          };

          const serviceCreateResult = await ensureServiceExistsInCanister(serviceDataToCreate);
          if (!serviceCreateResult.success) {
            console.error('❌ Failed to create service in canister:', serviceCreateResult.error);
            return NextResponse.json({
              success: false,
              error: `Failed to create service: ${serviceCreateResult.error}`
            }, { status: 500 });
          }

          // Fetch the newly created service
          try {
            serviceResult = await actor.getService(serviceId);
            if ('ok' in serviceResult) {
              serviceData = serviceResult.ok;
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch newly created service:', error);
          }
        }

        // Create package data structure
        const packageDataToCreate = {
          package_id: packageId,
          name: packageTitle || 'Package',
          title: packageTitle || 'Package',
          description: packageDescription || 'Package description',
          price_e8s: Math.floor(totalAmount * 100000000),
          delivery_time_days: deliveryDays || 7,
          delivery_timeline: `${deliveryDays || 7} days delivery`,
          revisions_included: 1,
          features: []
        };

        // Ensure package exists in canister
        const packageCreateResult = await ensurePackageExistsInCanister(packageDataToCreate, serviceId);
        if (!packageCreateResult.success) {
          console.error('❌ Failed to create package in canister:', packageCreateResult.error);
          return NextResponse.json({
            success: false,
            error: `Failed to create package: ${packageCreateResult.error}`
          }, { status: 500 });
        }

        // Fetch package from canister to get full data
        if (serviceData) {
          packageData = serviceData.packages?.find((pkg: any) => pkg.package_id === packageId);
        }

        if (!packageData) {
          // If package still not found, use the data we created
          packageData = {
            package_id: packageId,
            name: packageTitle || 'Package',
            description: packageDescription || '',
            price_e8s: BigInt(Math.floor(totalAmount * 100000000)),
            delivery_time_days: deliveryDays || 7,
            revisions: 1,
            features: []
          };
        }
      } else {
        // For regular bookings, service must exist
        if (!serviceData) {
          console.error('❌ Service not found in canister:', serviceId);
          return NextResponse.json({
            success: false,
            error: { NotFound: 'Service not found' }
          }, { status: 400 });
        }

        // Find package in service packages
        packageData = serviceData.packages?.find((pkg: any) => pkg.package_id === packageId);
        if (!packageData) {
          console.error('❌ Package not found in service packages:', packageId);
          console.error('Available packages:', serviceData.packages?.map((p: any) => p.package_id));
          return NextResponse.json({
            success: false,
            error: { NotFound: 'Package not found in service' }
          }, { status: 400 });
        }
      }

      // Ensure packageData is defined
      if (!packageData) {
        console.error('❌ Package data is null or undefined');
        return NextResponse.json({
          success: false,
          error: 'Package data is required'
        }, { status: 400 });
      }

      console.log('✅ Found package and service data');
      console.log('📦 Package:', packageData ? {
        ...packageData,
        price_e8s: typeof packageData.price_e8s === 'bigint'
          ? packageData.price_e8s.toString()
          : packageData.price_e8s
      } : null);
      console.log('🛠️ Service:', serviceData ? {
        ...serviceData,
        packages: serviceData.packages?.map((p: any) => ({
          ...p,
          price_e8s: typeof p.price_e8s === 'bigint' ? p.price_e8s.toString() : p.price_e8s
        }))
      } : undefined);

      // Get user emails for chat initiation and booking creation
      const clientEmail = await getClientEmail(effectiveClientId) || effectiveClientId;
      // Use the helper function to safely get freelancer email, with fallback
      let freelancerEmail = null;
      if (serviceData) {
        freelancerEmail = await getFreelancerEmailFromService(actor, serviceId)
          || serviceData.freelancer_email
          || serviceData.freelancer_id;
      }
      freelancerEmail = freelancerEmail || freelancerId || null;
      const serviceTitleValue = serviceData?.title || serviceTitle || 'Service';

      // Create booking in canister
      console.log('🏗️ Creating booking in canister...');
      const bookingDataForCanister = {
        client_id: effectiveClientId,
        client_email: clientEmail,
        package_id: packageId,
        special_instructions: instructions,
        payment_method: paymentMethod || 'escrow',
        payment_id: paymentId || null,
        transaction_id: transactionId || null
      };

      // Create booking using bookPackage method
      // Note: The deployed canister expects 5 text parameters (confirmed by Candid UI):
      // 1. clientId (text)
      // 2. clientEmail (text)
      // 3. packageId (text)
      // 4. idempotencyKey (text)
      // 5. specialInstructions (text)
      const idempotencyKey = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let bookingResponse = null;

      // Ensure all parameters are strings (canister expects all 5 as text type)
      const params = [
        String(effectiveClientId || ''),    // 1. clientId: text
        String(clientEmail || ''),          // 2. clientEmail: text
        String(packageId || ''),            // 3. packageId: text
        String(idempotencyKey || ''),       // 4. idempotencyKey: text
        String(instructions || '')           // 5. specialInstructions: text
      ];

      // Validate all parameters are non-empty
      if (params.some(p => !p || p.trim() === '')) {
        console.error('❌ Invalid parameters for bookPackage:', params);
        return NextResponse.json({
          success: false,
          error: 'All booking parameters are required and must be non-empty'
        }, { status: 400 });
      }

      try {
        // Type assertion needed because DID file is outdated - canister actually expects 5 params
        console.log('📞 Calling bookPackage with 5 parameters:', {
          clientId: params[0],
          clientEmail: params[1],
          packageId: params[2],
          idempotencyKey: params[3],
          specialInstructions: params[4]
        });

        const bookResult = await (actor as any).bookPackage(
          params[0],  // clientId: text
          params[1],  // clientEmail: text
          params[2],  // packageId: text
          params[3],  // idempotencyKey: text
          params[4]   // specialInstructions: text
        );

        if ('ok' in bookResult) {
          bookingResponse = bookResult.ok;
          console.log('✅ Booking created successfully in canister:', bookingResponse);
        } else {
          console.error('❌ Failed to create booking in canister:', bookResult.err);
          return NextResponse.json({
            success: false,
            error: `Failed to create booking: ${JSON.stringify(bookResult.err)}`
          }, { status: 500 });
        }
      } catch (bookingError: any) {
        console.error('❌ Error creating booking in canister:', bookingError);
        return NextResponse.json({
          success: false,
          error: `Booking creation failed: ${bookingError.message || 'Unknown error'}`
        }, { status: 500 });
      }

      // Convert BigInt values to numbers for JSON serialization
      const safeBookingData = {
        booking_id: bookingResponse.booking_id,
        escrow_account: bookingResponse.escrow_account || `escrow-${bookingResponse.booking_id}`,
        amount_e8s: Number(bookingResponse.amount_e8s),
        ledger_block: bookingResponse.ledger_block ? Number(bookingResponse.ledger_block) : null
      };

      console.log('📧 User emails:', { clientEmail, freelancerEmail });
      console.log('📋 Service title:', serviceTitleValue);
      console.log('💬 Initiating chat after successful booking...');

      // Initiate chat after successful booking
      let chatInitiationResult = null;
      if (clientEmail && freelancerEmail) {
        try {
          console.log('🔗 Attempting to initiate chat between:', { clientEmail, freelancerEmail });

          const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/chat/initiate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientEmail,
              freelancerEmail,
              serviceTitle: serviceTitleValue,
              bookingId: safeBookingData.booking_id,
              projectId: safeBookingData.booking_id // Use booking ID as project ID for context
            }),
          });

          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            chatInitiationResult = {
              success: true,
              chatInitiated: true,
              messageId: chatData.messageId,
              participants: chatData.participants,
              initialMessage: chatData.initialMessage
            };
            console.log('✅ Chat initiated successfully:', chatData);
          } else {
            const errorText = await chatResponse.text();

            // Check if the error response is HTML (indicating canister is down)
            if (errorText.includes('<pre>') || errorText.includes('<html>') || errorText.includes('<!DOCTYPE')) {
              console.error('❌ Chat canister is not running or accessible');
              chatInitiationResult = {
                success: false,
                error: 'Chat service temporarily unavailable',
                details: 'The chat system is currently offline. You can still contact the freelancer through other means.',
                bookingStillSuccessful: true,
                canisterOffline: true
              };
            } else {
              console.error('❌ Chat initiation failed:', errorText);
              chatInitiationResult = {
                success: false,
                error: 'Failed to initiate chat',
                details: errorText,
                bookingStillSuccessful: true
              };
            }
          }
        } catch (chatError) {
          console.error('❌ Error initiating chat:', chatError);
          const errorMessage = chatError instanceof Error ? chatError.message : 'Unknown error';

          // Check for common canister connection errors
          if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
            chatInitiationResult = {
              success: false,
              error: 'Chat service temporarily unavailable',
              details: 'Unable to connect to the chat system. The booking was successful and you can start a chat later.',
              bookingStillSuccessful: true,
              canisterOffline: true
            };
          } else {
            chatInitiationResult = {
              success: false,
              error: 'Chat initiation error',
              details: errorMessage,
              bookingStillSuccessful: true
            };
          }
        }
      } else {
        console.warn('⚠️ Cannot initiate chat - missing user emails:', { clientEmail, freelancerEmail });
        chatInitiationResult = {
          success: false,
          error: 'Missing user information for chat initiation',
          details: `Client email: ${clientEmail ? 'Present' : 'Missing'}, Freelancer email: ${freelancerEmail ? 'Present' : 'Missing'}`,
          bookingStillSuccessful: true
        };
      }

      return NextResponse.json({
        success: true,
        data: {
          ...safeBookingData,
          chat: chatInitiationResult,
          participants: {
            client: clientEmail,
            freelancer: freelancerEmail
          },
          serviceTitle: serviceTitleValue,
          paymentDetails: {
            paymentMethod,
            totalAmount,
            upsells: upsells || [],
            promoCode: promoCode || null,
            paymentId: paymentId || null,
            transactionId: transactionId || null
          }
        }
      });
    } catch (error) {
      console.error('❌ Error connecting to marketplace canister:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to marketplace service. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error booking package:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      cause: error instanceof Error ? error.cause : 'No cause'
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}