import { NextRequest, NextResponse } from 'next/server';

// GET /api/payment/booking-details?paymentId=<id> - Get booking details by payment ID
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

    console.log('🔍 Searching for booking details with paymentId:', paymentId);

    // Look for the booking in enhanced storage
    const fs = require('fs');
    const enhancedStoragePath = '/tmp/marketplace-storage/enhanced-bookings.json';

    if (fs.existsSync(enhancedStoragePath)) {
      const enhancedStorageData = JSON.parse(fs.readFileSync(enhancedStoragePath, 'utf8'));

      // Search for booking by payment_id
      for (const [bookingId, bookingData] of Object.entries(enhancedStorageData)) {
        const booking = bookingData as any;

        if (booking.payment_id === paymentId) {
          console.log('✅ Found booking in enhanced storage:', bookingId);

          // Get freelancer email from multiple sources
          let freelancerEmail = booking.freelancer_email || booking.freelancer_id;

          // If still no freelancer email, try to get it from service data
          if (!freelancerEmail && booking.service_id) {
            try {
              const fs = require('fs');
              const servicesPath = '/tmp/marketplace-storage/services.json';
              if (fs.existsSync(servicesPath)) {
                const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
                const service = servicesData.find((s: any) => s.service_id === booking.service_id);
                if (service) {
                  freelancerEmail = service.freelancer_email;
                }
              }
            } catch (error) {
              console.warn('Could not fetch service data for freelancer email:', error);
            }
          }

          // Transform booking data to match expected interface
          const transformedBooking = {
            booking_id: booking.booking_id,
            service_title: booking.service_title || booking.title,
            freelancer_email: freelancerEmail,
            total_amount: booking.total_amount_e8s / 100000000, // Convert from e8s
            payment_method: booking.payment_method || 'unknown',
            created_at: booking.created_at,
            delivery_deadline: booking.expires_at || (booking.created_at + (7 * 24 * 60 * 60 * 1000)), // 7 days from creation
            chat_initiated: true // Assume chat was initiated during booking
          };

          return NextResponse.json({
            success: true,
            booking: transformedBooking
          });
        }
      }
    }

    console.log('❌ No booking found with paymentId:', paymentId);

    return NextResponse.json({
      success: false,
      error: 'Booking not found'
    }, { status: 404 });

  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch booking details'
    }, { status: 500 });
  }
}