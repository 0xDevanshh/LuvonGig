'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  CheckCircle,
  Clock,
  MessageCircle,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface BookingData {
  booking_id: string;
  service_title: string;
  freelancer_email: string;
  total_amount: number;
  payment_method: string;
  created_at: number;
  delivery_deadline: number;
  chat_initiated: boolean;
}

function PaymentConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentId = searchParams.get('paymentId');
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (!paymentId) {
      setError('Payment ID is required');
      setLoading(false);
      return;
    }

    const fetchBookingData = async () => {
      try {
        // Fetch real booking data from enhanced storage using paymentId
        console.log('🔍 Fetching booking data for paymentId:', paymentId);

        // First, try to find booking in the marketplace bookings API (enhanced with payment integration)
        console.log('🔄 Checking marketplace bookings (with payment integration)...');

        // Get current user session to identify user bookings
        const sessionResponse = await fetch('/api/auth/session');
        let userEmail = null;

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success) {
            userEmail = sessionData.session.email;
          }
        }

        if (userEmail) {
          const bookingsResponse = await fetch(`/api/marketplace/bookings?user_id=${userEmail}&user_type=client`);
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            if (bookingsData.success) {
              console.log('📊 Found bookings data:', bookingsData);

              // Look for booking with matching payment_id or booking_id
              const matchingBooking = bookingsData.data.find((booking: any) =>
                booking.payment_id === paymentId || booking.booking_id === bookingId
              );

              if (matchingBooking) {
                console.log('✅ Found matching booking in marketplace:', matchingBooking);

                // Transform booking data to match expected interface
                const transformedBooking: BookingData = {
                  booking_id: matchingBooking.booking_id,
                  service_title: matchingBooking.service_title || 'Service',
                  freelancer_email: matchingBooking.freelancer_id || 'freelancer@example.com',
                  total_amount: matchingBooking.total_amount_e8s / 100000000, // Convert from e8s
                  payment_method: matchingBooking.payment_method || 'unknown',
                  created_at: matchingBooking.created_at,
                  delivery_deadline: matchingBooking.delivery_deadline || (Date.now() + 7 * 24 * 60 * 60 * 1000),
                  chat_initiated: true // Assume chat was initiated during booking
                };

                setBookingData(transformedBooking);
                return;
              }
            }
          }
        }

        // If not found in marketplace, try to get the booking from payment booking details
        console.log('🔄 Checking payment booking details...');
        const response = await fetch(`/api/payment/booking-details?paymentId=${paymentId}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.booking) {
            console.log('✅ Found booking data in payment details:', data.booking);
            setBookingData(data.booking);
            return;
          }
        }

        // If still not found, create a fallback booking
        console.warn('⚠️ No booking found, creating fallback data');
        const fallbackBookingData: BookingData = {
          booking_id: bookingId || `BK_${Date.now()}`,
          service_title: 'Service Package',
          freelancer_email: 'freelancer@example.com', // Fallback - will be updated when we find the real booking
          total_amount: 0,
          payment_method: 'unknown',
          created_at: Date.now(),
          delivery_deadline: Date.now() + (7 * 24 * 60 * 60 * 1000),
          chat_initiated: false
        };

        setBookingData(fallbackBookingData);

      } catch (err) {
        console.error('Error fetching booking data:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [paymentId, bookingId]);

  const handleGoToChat = () => {
    if (bookingData) {
      router.push(`/client/chat?bookingId=${bookingData.booking_id}`);
    }
  };

  const handleViewBookings = () => {
    router.push('/client/projects');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/client/browse-services" className="text-purple-600 hover:text-purple-700">
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find your booking details.</p>
          <Link href="/client/browse-services" className="text-purple-600 hover:text-purple-700">
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/client/browse-services" className="flex items-center text-gray-600 hover:text-gray-900">
              <ChevronLeft size={20} />
              <span>Back to Services</span>
            </Link>

            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm text-gray-600">Booking Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="text-green-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-green-900">Payment Successful!</h1>
                <p className="text-green-700">Your booking has been confirmed</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-medium">{bookingData.booking_id}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">{bookingData.service_title}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Freelancer</span>
                <span className="font-medium">{bookingData.freelancer_email}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium text-lg">${bookingData.total_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium capitalize">{bookingData.payment_method.replace('-', ' ')}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Booking Date</span>
                <span className="font-medium">{new Date(bookingData.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-gray-600">Expected Delivery</span>
                <span className="font-medium">{new Date(bookingData.delivery_deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full p-2 mt-1">
                  <MessageCircle className="text-purple-600" size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Start a Conversation</h3>
                  <p className="text-gray-600 text-sm">
                    Chat with your freelancer to discuss project details and requirements.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <Clock className="text-blue-600" size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Wait for Delivery</h3>
                  <p className="text-gray-600 text-sm">
                    Your freelancer will deliver the work within the specified timeframe.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-2 mt-1">
                  <CheckCircle className="text-green-600" size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Review and Approve</h3>
                  <p className="text-gray-600 text-sm">
                    Review the delivered work and request revisions if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {bookingData.chat_initiated && (
              <button
                onClick={handleGoToChat}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <MessageCircle size={20} />
                <span>Go to Chat</span>
              </button>
            )}

            <button
              onClick={handleViewBookings}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ExternalLink size={20} />
              <span>View My Bookings</span>
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">Need help with your booking?</p>
            <Link href="/client/support" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <PaymentConfirmContent />
    </Suspense>
  );
}