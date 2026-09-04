'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useUserContext } from '@/contexts/UserContext';
import {
  ChevronLeft,
  Shield,
  Info
} from 'lucide-react';
import { ServiceSummary } from '@/components/payment/ServiceSummary';
import { UpsellSection } from '@/components/payment/UpsellSection';
import { OrderSummary } from '@/components/payment/OrderSummary';
import { PaymentProcessing } from '@/components/payment/PaymentProcessing';
import { PaymentSuccess } from '@/components/payment/PaymentSuccess';
import StripeCheckout from '@/components/payment/StripeCheckout';
import { toMajorUnits } from '@/lib/currency';

interface Service {
  service_id: string;
  title: string;
  description: string;
  freelancer_email: string;
  freelancer_name: string;
  freelancer_id: string;
  rating_avg: number;
  total_orders: number;
  cover_image_url: string;
  portfolio_images: string[];
  packages: Package[];
}

interface Package {
  package_id: string;
  tier: string;
  title: string;
  description: string;
  price_minor: number;
  currency?: string;
  delivery_days: number;
  features: string[];
  revisions_included: number;
}

interface UpsellItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: string;
  popular?: boolean;
  category: 'delivery' | 'revisions' | 'support' | 'features';
}

interface PaymentResult {
  transactionId: string;
  amount: string;
  symbol: string;
  status: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { profile } = useUserContext();
  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<UpsellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ discount: number; code: string } | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [freelancerFee, setFreelancerFee] = useState<number>(0.04); // Default 4%

  // Parse URL parameters
  const [packageId, setPackageId] = useState<string>('');
  const [packageTier, setPackageTier] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setPackageId(urlParams.get('packageId') || '');
      setPackageTier(urlParams.get('tier') || '');
      setSpecialInstructions(urlParams.get('instructions') || '');
    }
  }, []);

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/marketplace/services/${id}`);
        const data = await response.json();

        if (data.success) {
          setService(data.data);

          // Fetch Freelancer's Plan Fee
          try {
            const freelancerEmail = data.data.freelancer_email || data.data.freelancer_id;
            const subResponse = await fetch(`/api/subscription?email=${encodeURIComponent(freelancerEmail)}`);
            const subResult = await subResponse.json();
            if (subResult.success && subResult.data) {
              setFreelancerFee(subResult.data.marketplace_fee);
              console.log('✅ Freelancer fee found:', subResult.data.marketplace_fee);
            }
          } catch (feeError) {
            console.warn('⚠️ Could not fetch freelancer fee:', feeError);
          }

          if (data.data.packages && packageId) {
            const pkg = data.data.packages.find((p: Package) => p.package_id === packageId);
            setSelectedPackage(pkg || data.data.packages[0]);
          } else if (data.data.packages && packageTier) {
            const pkg = data.data.packages.find((p: Package) => p.tier.toLowerCase() === packageTier.toLowerCase());
            setSelectedPackage(pkg || data.data.packages[0]);
          } else if (data.data.packages) {
            setSelectedPackage(data.data.packages[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id, packageId, packageTier]);


  // Calculate fees and totals
  const calculateSubtotal = (): number => {
    if (!selectedPackage) return 0;
    const packagePrice = toMajorUnits(selectedPackage.price_minor, selectedPackage.currency);
    const upsellsTotal = selectedUpsells.reduce((sum, item) => sum + item.price, 0);
    return packagePrice + upsellsTotal;
  };

  const calculatePlatformFee = (): number => {
    const subtotal = calculateSubtotal();
    const discount = promoApplied ? subtotal * (promoApplied.discount / 100) : 0;
    const afterDiscount = subtotal - discount;
    return afterDiscount * freelancerFee;
  };

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    const discount = promoApplied ? subtotal * (promoApplied.discount / 100) : 0;
    const afterDiscount = subtotal - discount;
    const platformFee = calculatePlatformFee();
    return afterDiscount + platformFee;
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    if (!selectedPackage || !service) return;

    setPaymentStep('processing');
    setBookingError(null);

    try {
      const totalUSD = calculateTotal();

      // Extract payment info from ICPay widget
      const transactionId = paymentData.transactionId || paymentData.id;
      const tokenSymbol = paymentData.symbol || paymentData.ledger || 'ICP';
      const tokenAmount = paymentData.amount || paymentData.tokenAmount;

      // Store payment result
      const result: PaymentResult = {
        transactionId,
        amount: tokenAmount.toString(),
        symbol: tokenSymbol,
        status: 'completed',
      };
      setPaymentResult(result);

      // Confirm payment and create booking
      const confirmationResponse = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          amount: totalUSD,
          currency: 'USD',
          tokenSymbol,
          tokenAmount,
          paymentStatus: 'succeeded',
          serviceId: service.service_id,
          packageId: selectedPackage.package_id,
          clientId: profile.email,
          freelancerEmail: service.freelancer_email,
          metadata: {
            serviceId: service.service_id,
            packageId: selectedPackage.package_id,
            clientId: profile.email,
            freelancerEmail: service.freelancer_email,
            specialInstructions,
            upsells: selectedUpsells.map(u => ({
              id: u.id,
              name: u.name,
              price: u.price
            })),
            promoCode: promoApplied?.code,
          },
        })
      });

      const confirmationData = await confirmationResponse.json();

      if (!confirmationData.success) {
        throw new Error(confirmationData.error || 'Payment confirmation failed');
      }

      // Success! Show success page
      setTimeout(() => {
        setPaymentStep('success');
      }, 1000);

    } catch (error) {
      console.error('Payment error:', error);
      setBookingError(error instanceof Error ? error.message : 'Payment failed');
      setPaymentStep('details');
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('ICPay payment error:', error);
    setBookingError(error.message || 'Payment failed. Please try again.');
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setPromoApplied({ discount: 10, code: promoCode });
    } else if (promoCode.toLowerCase() === 'welcome20') {
      setPromoApplied({ discount: 20, code: promoCode });
    } else {
      alert('Invalid promo code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!service || !selectedPackage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-4">The service you're trying to book doesn't exist.</p>
          <Link href="/client/browse-services" className="text-purple-600 hover:text-purple-700 font-medium">
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStep === 'processing') {
    return <PaymentProcessing />;
  }

  if (paymentStep === 'success') {
    const currentTime = Date.now();
    const bookingData = {
      createdAt: currentTime,
      deliveryDeadline: currentTime + (selectedPackage.delivery_days * 24 * 60 * 60 * 1000),
      deliveryDays: selectedPackage.delivery_days,
      paymentCompletedAt: currentTime,
      bookingConfirmedAt: currentTime,
      transactionId: paymentResult?.transactionId,
      tokenSymbol: paymentResult?.symbol,
      tokenAmount: paymentResult?.amount,
    };

    return <PaymentSuccess bookingData={bookingData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/client/service/${id}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="ml-1">Back to Service</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">Review your order and pay securely</p>
        </div>

        {/* Error Message */}
        {bookingError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Payment Error</h4>
                <p className="text-sm text-red-700 mt-1">{bookingError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Summary */}
            <ServiceSummary
              service={service}
              selectedPackage={selectedPackage}
              specialInstructions={specialInstructions}
              onInstructionsChange={setSpecialInstructions}
            />

            {/* Upsells */}
            <UpsellSection
              selectedUpsells={selectedUpsells}
              onUpsellsChange={setSelectedUpsells}
            />

            {/* Special Instructions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium mb-3">Special Instructions (Optional)</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any specific requirements or preferences for your project?"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Payment */}
            {service && selectedPackage && (
              <div className="bg-white rounded-lg border border-dashed border-purple-200 p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-2">Payment</h3>
                  <p className="text-sm text-gray-600">
                    Your payment is held securely and only released to the freelancer once you approve the work.
                  </p>
                </div>

                <StripeCheckout
                  packageId={selectedPackage.package_id}
                  specialInstructions={specialInstructions}
                  onSuccess={(paymentId) => {
                    setPaymentResult({
                      transactionId: paymentId,
                      amount: calculateTotal().toString(),
                      symbol: 'USD',
                      status: 'held',
                    });
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <OrderSummary
                packagePrice={toMajorUnits(selectedPackage.price_minor, selectedPackage.currency)}
                upsells={selectedUpsells}
                promoApplied={promoApplied}
                total={calculateTotal()}
                platformFee={calculatePlatformFee()}
                platformFeeRate={freelancerFee}
                subtotal={calculateSubtotal()}
              />

              {/* Promo Code */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={applyPromoCode}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="text-green-600" size={20} />
                  <span className="font-medium text-green-900">Secure Payment</span>
                </div>
                <p className="text-sm text-green-700">
                  Your payment is protected by escrow until project completion
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
