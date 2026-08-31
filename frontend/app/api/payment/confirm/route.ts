import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getMarketplaceActor } from '@/lib/ic-marketplace-agent';
import { createBookingInCanister, ensurePackageExistsInCanister, ensureServiceExistsInCanister } from '@/lib/booking-utils';

// Timeout utility function
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// Fetch with timeout utility
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
}

// Helper function to determine upsell category
function getUpsellCategory(upsellId: string): string {
  const categoryMap: Record<string, string> = {
    'express-delivery': 'delivery',
    'extra-revisions': 'revisions',
    'priority-support': 'support',
    'commercial-license': 'features',
    'source-files': 'features',
    'extended-support': 'support'
  };
  return categoryMap[upsellId] || 'other';
}

interface PaymentConfirmationRequest {
  paymentId?: string;
  transactionId: string;
  paymentStatus: 'succeeded' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  tokenSymbol?: string;
  tokenAmount?: string;
  serviceId?: string;
  packageId?: string;
  clientId?: string;
  freelancerEmail?: string;
  metadata?: Record<string, any>;
}

interface PaymentSession {
  paymentId: string;
  packageId: string;
  serviceId: string;
  clientId: string;
  paymentMethod: string;
  totalAmount: number;
  platformFee: number;
  netAmount: number;
  upsells: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  promoCode?: string;
  specialInstructions?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  serviceData?: {
    freelancerEmail?: string;
    title?: string;
    mainCategory?: string;
    subCategory?: string;
    description?: string;
    whatsIncluded?: string;
  };
  packageData?: {
    title?: string;
    description?: string;
    deliveryDays?: number;
    deliveryTimeline?: string;
    revisionsIncluded?: number;
    features?: string[];
  };
}

// Shared payment session storage
const PAYMENT_SESSIONS_FILE = '/tmp/payment-sessions.json';

function getPaymentSessions(): Record<string, PaymentSession> {
  try {
    const fs = require('fs');
    if (fs.existsSync(PAYMENT_SESSIONS_FILE)) {
      const data = fs.readFileSync(PAYMENT_SESSIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading payment sessions:', error);
  }
  return {};
}

function savePaymentSession(paymentId: string, session: PaymentSession): void {
  try {
    const fs = require('fs');
    let sessions = getPaymentSessions();
    sessions[paymentId] = session;
    fs.writeFileSync(PAYMENT_SESSIONS_FILE, JSON.stringify(sessions), 'utf8');
  } catch (error) {
    console.error('Error saving payment session:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 POST /api/payment/confirm called at:', new Date().toISOString());

  try {
    const body: PaymentConfirmationRequest = await request.json();
    const { 
      paymentId, 
      transactionId, 
      paymentStatus, 
      amount, 
      currency, 
      tokenSymbol,
      tokenAmount,
      serviceId,
      packageId,
      clientId,
      freelancerEmail,
      metadata
    } = body;

    console.log('📝 ICPay payment confirmation:', { 
      paymentId, 
      transactionId, 
      paymentStatus, 
      amount, 
      tokenSymbol,
      tokenAmount 
    });

    // Validate required fields
    if (!transactionId || !paymentStatus) {
      return NextResponse.json({
        success: false,
        error: 'Missing required payment confirmation data (transactionId and paymentStatus)'
      }, { status: 400 });
    }

    if (paymentStatus !== 'succeeded') {
      return NextResponse.json({
        success: false,
        error: 'Payment was not successful',
        paymentStatus
      }, { status: 400 });
    }

    // For ICPay transactions, we may not have a payment session yet
    // Create one if needed using the provided data
    let paymentSession: PaymentSession | null = null;
    
    if (paymentId) {
      const paymentSessions = getPaymentSessions();
      paymentSession = paymentSessions[paymentId];
      
      if (paymentSession) {
        // Check if session has expired
        const currentTime = new Date();
        const expirationTime = new Date(paymentSession.expiresAt);
        if (currentTime > expirationTime) {
          console.error('❌ Payment session expired:', paymentId, 'expired at:', paymentSession.expiresAt);
          return NextResponse.json({
            success: false,
            error: 'Payment session expired'
          }, { status: 410 });
        }

        // Verify payment details match
        if (Math.abs(paymentSession.totalAmount - amount) > 0.01) {
          console.warn('⚠️ Payment amount mismatch - Session:', paymentSession.totalAmount, 'Received:', amount);
        }

        // Update payment session status
        paymentSession.status = 'completed';
        paymentSession.transactionId = transactionId;
      }
    }
    
    // If no session found, create a minimal one from the provided data
    if (!paymentSession) {
      console.log('📝 No payment session found, creating from ICPay transaction data');
      const timestamp = new Date().toISOString();
      const platformFee = amount * 0.05;
      const netAmount = amount - platformFee;
      
      paymentSession = {
        paymentId: paymentId || `PAY_ICPAY_${Date.now()}_${transactionId.slice(0, 8)}`,
        packageId: packageId || '',
        serviceId: serviceId || '',
        clientId: clientId || '',
        paymentMethod: 'icpay',
        totalAmount: amount,
        platformFee,
        netAmount,
        tokenSymbol: tokenSymbol || 'ICP',
        tokenAmount: tokenAmount || '',
        transactionId,
        upsells: metadata?.upsells || [],
        promoCode: metadata?.promoCode || null,
        specialInstructions: metadata?.specialInstructions || '',
        status: 'completed',
        createdAt: timestamp,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        serviceData: {
          freelancerEmail: freelancerEmail || '',
          title: metadata?.serviceTitle || 'Service',
        },
        packageData: metadata?.packageData || {}
      } as PaymentSession;
    }

    // Create booking after successful payment
    console.log('💰 Payment successful, creating booking...');

    try {
      // Validate payment session data
      if (!paymentSession.packageId) {
        throw new Error('Package ID is missing from payment session');
      }

      console.log('🔍 Looking for package:', paymentSession.packageId);

      // Use actual service and package data from payment session
      const sessionServiceData = paymentSession.serviceData || {};
      const sessionPackageData = paymentSession.packageData || {};

      // Fetch the actual service data from the marketplace to get the correct freelancer info
      let actualFreelancerEmail = sessionServiceData.freelancerEmail;
      
      if (!actualFreelancerEmail && paymentSession.serviceId) {
        try {
          console.log('🔍 Fetching service data to get freelancer email for service:', paymentSession.serviceId);
          const actor = await getMarketplaceActor();
          const serviceResult = await actor.getService(paymentSession.serviceId);
          
          if (serviceResult && serviceResult.length > 0) {
            const canisterService = serviceResult[0];
            actualFreelancerEmail = canisterService.freelancer_id;
            console.log('✅ Found freelancer from canister:', actualFreelancerEmail);
          } else {
            console.warn('⚠️ Service not found in canister, checking local storage...');
            // Try to get from service storage as fallback
            const { getAdditionalServiceData } = await import('@/lib/service-storage');
            const additionalData = getAdditionalServiceData(paymentSession.serviceId);
            if (additionalData?.freelancer_email) {
              actualFreelancerEmail = additionalData.freelancer_email;
              console.log('✅ Found freelancer from local storage:', actualFreelancerEmail);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching service data:', error);
        }
      }

      // If still no freelancer email found, throw an error instead of using client email
      if (!actualFreelancerEmail) {
        throw new Error('Freelancer information not found for this service. Please contact support.');
      }

      // Create service data from payment session with fallbacks
      const serviceData = {
        service_id: paymentSession.serviceId,
        freelancer_email: actualFreelancerEmail,
        title: sessionServiceData.title || 'Professional Service',
        main_category: sessionServiceData.mainCategory || 'Professional Services',
        sub_category: sessionServiceData.subCategory || 'General',
        description: sessionServiceData.description || 'Professional services delivered with quality and expertise.',
        whats_included: sessionServiceData.whatsIncluded || 'Quality service delivery',
        delivery_time_days: sessionPackageData.deliveryDays || 7,
        starting_from_e8s: Math.floor(amount * 100000000), // Use actual payment amount
        tags: ['professional', 'quality', 'reliable']
      };

      // Create package data from payment session with fallbacks
      const packageData = {
        package_id: paymentSession.packageId,
        service_id: paymentSession.serviceId,
        title: sessionPackageData.title || 'Standard Package',
        description: sessionPackageData.description || 'Professional service package with quality delivery.',
        delivery_days: sessionPackageData.deliveryDays || 7,
        price_e8s: Math.floor(amount * 100000000), // Use actual payment amount
        delivery_timeline: sessionPackageData.deliveryTimeline || `${sessionPackageData.deliveryDays || 7} days delivery`,
        revisions_included: sessionPackageData.revisionsIncluded || 1,
        features: sessionPackageData.features || ['Professional delivery', 'Quality assurance']
      };

      // Debug logging for package data
      console.log('📦 Package data validation:');
      console.log('  - sessionPackageData:', sessionPackageData);
      console.log('  - deliveryDays from session:', sessionPackageData.deliveryDays);
      console.log('  - final delivery_days:', packageData.delivery_days);

      console.log('✅ Service data created:', serviceData.title);
      console.log('✅ Package data created:', packageData.title);

      // Create booking via marketplace canister
      const bookingId = `BK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('📋 Creating booking with ID:', bookingId);
      console.log('📦 Package:', packageData);
      console.log('🛠️ Service:', serviceData);

      const currentTime = Date.now();
      
      // Ensure delivery days is at least 1 day
      const deliveryDays = Math.max(packageData.delivery_days || 1, 1);
      const deliveryDeadline = currentTime + (deliveryDays * 24 * 60 * 60 * 1000);
      
      // Debug logging for delivery deadline calculation
      console.log('🕐 Delivery deadline calculation:');
      console.log('  - Current time:', currentTime, new Date(currentTime).toISOString());
      console.log('  - Package delivery days (original):', packageData.delivery_days);
      console.log('  - Package delivery days (adjusted):', deliveryDays);
      console.log('  - Calculated deadline:', deliveryDeadline, new Date(deliveryDeadline).toISOString());
      console.log('  - Days difference:', (deliveryDeadline - currentTime) / (24 * 60 * 60 * 1000));

      // Fetch freelancer and client names in parallel with timeout
      console.log('👤 Fetching user names in parallel...');
      let freelancerName = serviceData.freelancer_email;
      let clientName = paymentSession.clientId;

      try {
        const userFetchPromises = await Promise.allSettled([
          // Freelancer name fetch with 3 second timeout
          Promise.race([
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/profile?email=${encodeURIComponent(serviceData.freelancer_email)}`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Freelancer fetch timeout')), 3000))
          ]),
          // Client name fetch with 3 second timeout  
          Promise.race([
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/profile?email=${encodeURIComponent(paymentSession.clientId)}`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Client fetch timeout')), 3000))
          ])
        ]);

        // Process freelancer result
        if (userFetchPromises[0].status === 'fulfilled') {
          const freelancerResponse = userFetchPromises[0].value as Response;
          if (freelancerResponse.ok) {
            const userData = await freelancerResponse.json();
            if (userData.success && userData.user?.profile) {
              freelancerName = `${userData.user.profile.firstName || ''} ${userData.user.profile.lastName || ''}`.trim() || serviceData.freelancer_email;
              console.log('✅ Freelancer name found:', freelancerName);
            }
          }
        } else {
          console.warn('⚠️ Freelancer name fetch failed, using email:', userFetchPromises[0].reason);
        }

        // Process client result
        if (userFetchPromises[1].status === 'fulfilled') {
          const clientResponse = userFetchPromises[1].value as Response;
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            if (clientData.success && clientData.user?.profile) {
              clientName = `${clientData.user.profile.firstName || ''} ${clientData.user.profile.lastName || ''}`.trim() || paymentSession.clientId;
              console.log('✅ Client name found:', clientName);
            }
          }
        } else {
          console.warn('⚠️ Client name fetch failed, using email:', userFetchPromises[1].reason);
        }
      } catch (error) {
        console.error('❌ Error fetching user names (non-blocking):', error);
        // Continue with emails as names - don't block booking creation
      }

      // Enhanced booking data with all payment details
      const bookingData = {
        booking_id: bookingId,
        client_id: paymentSession.clientId,
        client_name: clientName,
        client_email: paymentSession.clientId,
        freelancer_id: serviceData.freelancer_email,
        freelancer_email: serviceData.freelancer_email,
        freelancer_name: freelancerName,
        service_id: serviceData.service_id,
        service_title: serviceData.title,
        package_id: paymentSession.packageId,
        package_tier: (packageData as any).tier || 'basic',
        package_title: packageData.title,
        package_description: packageData.description,
        package_delivery_days: deliveryDays,
        package_revisions: packageData.revisions_included,
        package_features: packageData.features || [],

        // Payment details
        total_amount_e8s: Math.floor(amount * 100000000), // Convert to e8s
        base_amount_e8s: Math.floor(paymentSession.netAmount * 100000000),
        platform_fee_e8s: Math.floor(paymentSession.platformFee * 100000000),
        status: 'active',
        payment_id: paymentSession.paymentId,
        payment_method: 'icpay',
        transaction_id: transactionId,
        payment_status: 'completed',
        token_symbol: tokenSymbol || 'ICP',
        token_amount: tokenAmount || '',

        // Upsells and enhancements
        upsells: paymentSession.upsells.map(upsell => ({
          id: upsell.id,
          name: upsell.name,
          price: upsell.price,
          category: getUpsellCategory(upsell.id)
        })),

        // Additional details
        special_instructions: paymentSession.specialInstructions || '',
        promo_code: paymentSession.promoCode || null,
        discount_amount: paymentSession.promoCode ? (paymentSession.platformFee * 0.1) : 0,

        // Comprehensive timestamp tracking
        created_at: currentTime,
        updated_at: currentTime,
        expires_at: deliveryDeadline,

        // Booking lifecycle timestamps
        booking_confirmed_at: currentTime,
        payment_completed_at: currentTime,
        delivery_deadline: deliveryDeadline,

        // Human-readable date strings for display
        created_at_readable: new Date(currentTime).toISOString(),
        booking_confirmed_at_readable: new Date(currentTime).toISOString(),
        payment_completed_at_readable: new Date(currentTime).toISOString(),
        delivery_deadline_readable: new Date(deliveryDeadline).toISOString(),

        // Time tracking calculations
        delivery_days: deliveryDays,
        time_remaining_hours: Math.floor((deliveryDeadline - currentTime) / (60 * 60 * 1000))
      };

      // Run service and package checks in parallel for better performance
      console.log('⚡ Running service and package checks in parallel...');
      const [serviceResult, packageResult] = await Promise.all([
        ensureServiceExistsInCanister(serviceData, packageData),
        ensurePackageExistsInCanister(packageData, serviceData.service_id)
      ]);

      if (!serviceResult.success) {
        throw new Error(`Failed to ensure service exists in canister: ${serviceResult.error}`);
      }
      console.log('✅ Service ensured in canister:', serviceResult.serviceId);

      if (!packageResult.success) {
        throw new Error(`Failed to ensure package exists in canister: ${packageResult.error}`);
      }
      console.log('✅ Package ensured in canister:', packageResult.packageId);

      // Create booking in canister
      console.log('📝 Creating booking in canister...');
      const canisterResult = await createBookingInCanister(bookingData);
      if (!canisterResult.success) {
        throw new Error(`Failed to create booking in canister: ${canisterResult.error}`);
      }
      console.log('✅ Booking created in canister:', canisterResult.bookingId);

      // Save booking data via marketplace bookings API for better data management
      let marketplaceBookingResult = null;
      try {
        console.log('💾 Saving booking data via marketplace API...');

        // Prepare booking data for marketplace API
        const marketplaceBookingData = {
          clientId: bookingData.client_id,
          packageId: bookingData.package_id,
          specialInstructions: bookingData.special_instructions,
          paymentMethod: bookingData.payment_method,
          totalAmount: bookingData.total_amount_e8s / 100000000, // Convert to ICP
          upsells: bookingData.upsells,
          promoCode: bookingData.promo_code,
          paymentId: bookingData.payment_id,
          transactionId: bookingData.transaction_id,
          // Additional booking details for comprehensive storage
          serviceId: bookingData.service_id,
          serviceTitle: bookingData.service_title,
          freelancerId: bookingData.freelancer_id,
          packageTitle: bookingData.package_title,
          packageDescription: bookingData.package_description,
          deliveryDays: bookingData.package_delivery_days,
          createdFromPayment: true, // Flag to indicate this was created from payment
        };

        const bookingResponse = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/marketplace/bookings`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(marketplaceBookingData),
          },
          20000 // 20 second timeout (increased for canister operations)
        );

        if (bookingResponse.ok) {
          const bookingApiData = await bookingResponse.json();
          marketplaceBookingResult = {
            success: true,
            bookingData: bookingApiData,
            message: 'Booking saved via marketplace API'
          };
          console.log('✅ Booking saved via marketplace API:', bookingApiData);
        } else {
          const errorText = await bookingResponse.text();
          console.warn('⚠️ Failed to save booking via marketplace API:', errorText);
          marketplaceBookingResult = {
            success: false,
            error: 'Failed to save booking via marketplace API',
            details: errorText,
            bookingStillSuccessful: true
          };
        }
      } catch (bookingApiError) {
        console.warn('⚠️ Error saving booking via marketplace API:', bookingApiError);
        marketplaceBookingResult = {
          success: false,
          error: 'Error saving booking via marketplace API',
          details: bookingApiError instanceof Error ? bookingApiError.message : 'Unknown error',
          bookingStillSuccessful: true
        };
      }

      // Initiate chat after successful booking (async, non-blocking)
      let chatInitiationResult = null;
      const clientEmail = paymentSession.clientId;
      const freelancerEmail = serviceData.freelancer_email;
      const serviceTitle = serviceData.title;

      console.log('💬 Starting async chat initiation...');

      if (clientEmail && freelancerEmail) {
        // Start chat initiation in background with timeout, but don't block the payment confirmation
        const initiateChat = async () => {
          try {
            const chatResponse = await fetchWithTimeout(
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat/initiate`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  clientEmail,
                  freelancerEmail,
                  serviceTitle,
                  bookingId: bookingData.booking_id,
                  projectId: bookingData.booking_id,
                  bookingDetails: {
                    // Service and package details
                    serviceId: bookingData.service_id,
                    packageTier: bookingData.package_tier,
                    packageTitle: bookingData.package_title,
                    packageDescription: bookingData.package_description,
                    deliveryDays: bookingData.package_delivery_days,
                    revisionsIncluded: bookingData.package_revisions,
                    features: bookingData.package_features,

                    // Payment details
                    totalAmount: bookingData.total_amount_e8s / 100000000,
                    paymentMethod: bookingData.payment_method,
                    paymentId: bookingData.payment_id,
                    transactionId: bookingData.transaction_id,

                    // Upsells and enhancements
                    upsells: bookingData.upsells,

                    // Additional information
                    specialInstructions: bookingData.special_instructions,
                    promoCode: bookingData.promo_code,
                    deliveryDeadline: new Date(bookingData.expires_at).toISOString()
                  }
                }),
              },
              15000 // 15 second timeout for chat initiation (increased)
            );

            if (chatResponse.ok) {
              const chatData = await chatResponse.json();
              console.log('✅ Chat initiated successfully:', chatData);
              return {
                success: true,
                chatInitiated: true,
                messageId: chatData.messageId,
                participants: chatData.participants,
                initialMessage: chatData.initialMessage
              };
            } else {
              const errorText = await chatResponse.text();
              console.error('❌ Chat initiation failed:', errorText);
              return {
                success: false,
                error: 'Failed to initiate chat',
                details: errorText,
                bookingStillSuccessful: true
              };
            }
          } catch (chatError) {
            console.error('❌ Error initiating chat:', chatError);
            return {
              success: false,
              error: 'Chat initiation error',
              details: chatError instanceof Error ? chatError.message : 'Unknown error',
              bookingStillSuccessful: true
            };
          }
        };

        // Start chat initiation but don't await it - let it run in background
        initiateChat().then(result => {
          chatInitiationResult = result;
          // Optionally log completion or store result for later retrieval
          console.log('📝 Chat initiation completed with result:', result);
        }).catch(error => {
          console.error('📝 Chat initiation background task failed:', error);
        });
      }

      // Send confirmation email (mock)
      console.log('📧 Sending confirmation email...');

      const confirmationData = {
        paymentConfirmation: {
          paymentId: paymentSession.paymentId,
          amount,
          currency,
          paymentMethod: 'icpay',
          transactionId,
          tokenSymbol: tokenSymbol || 'ICP',
          tokenAmount: tokenAmount || '',
          confirmedAt: new Date().toISOString()
        },
        booking: bookingData,
        marketplaceBooking: marketplaceBookingResult,
        chat: chatInitiationResult,
        service: {
          title: serviceData.title,
          freelancerEmail: serviceData.freelancer_email
        }
      };

      const processingTime = Date.now() - startTime;
      console.log('✅ Payment confirmation successful in', processingTime, 'ms:', confirmationData);

      return NextResponse.json({
        success: true,
        data: {
          ...confirmationData,
          processingTime,
          chatStatus: chatInitiationResult ? 'completed' : 'pending_background'
        }
      });

    } catch (bookingError) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Error creating booking after', processingTime, 'ms:', bookingError);

      // Check if it's a timeout error
      if (bookingError instanceof Error && bookingError.message.includes('timed out')) {
        return NextResponse.json({
          success: false,
          error: 'Payment confirmation timed out. Your payment was processed but there was an issue creating the booking. Please contact support.',
          details: bookingError.message,
          processingTime,
          timeout: true,
          paymentProcessed: true
        }, { status: 504 });
      }

      return NextResponse.json({
        success: false,
        error: 'Payment successful but booking creation failed',
        details: bookingError instanceof Error ? bookingError.message : 'Unknown error',
        processingTime,
        paymentProcessed: true
      }, { status: 500 });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Payment confirmation error after', processingTime, 'ms:', error);

    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json({
        success: false,
        error: 'Payment confirmation timed out. Please try again or contact support if the issue persists.',
        details: error.message,
        processingTime,
        timeout: true
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Payment confirmation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    }, { status: 500 });
  }
}

// GET endpoint to retrieve payment confirmation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID is required'
      }, { status: 400 });
    }

    // In production, retrieve from database
    // For now, return mock data
    const mockConfirmationData = {
      paymentId,
      status: 'completed',
      bookingId: `BK_${Date.now()}`,
      confirmedAt: new Date().toISOString(),
      amount: 100.00,
      currency: 'USD'
    };

    return NextResponse.json({
      success: true,
      data: mockConfirmationData
    });

  } catch (error) {
    console.error('Payment confirmation status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve payment confirmation status'
    }, { status: 500 });
  }
}