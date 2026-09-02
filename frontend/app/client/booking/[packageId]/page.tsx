'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { usePackages, useBookPackage } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/currency';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Shield,
  Star,
  Calendar,
  User
} from 'lucide-react';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.packageId as string;

  const [userId, setUserId] = useState<string>(''); // This should come from auth context
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'confirming' | 'success'>('details');
  const [bookingResult, setBookingResult] = useState<any>(null);

  const { packages, loading: packagesLoading, error: packagesError, refetch: fetchPackages } = usePackages();
  const { bookPackage, loading: bookingLoading, error: bookingError } = useBookPackage();

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [freelancerFee, setFreelancerFee] = useState<number>(0.04); // Default 4%

  useEffect(() => {
    // TODO: Get userId from auth context
    const mockUserId = 'USER123'; // Replace with actual user ID
    setUserId(mockUserId);

    // Find the package by ID
    if (packages.length > 0) {
      const pkg = packages.find(p => p.package_id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);

        // Fetch Freelancer's Plan Fee
        const fetchFreelancerFee = async () => {
          try {
            // Check if pkg has freelancer info, if not we might need to get it from service
            const freelancerEmail = pkg.freelancer_id || pkg.freelancer_email;
            if (freelancerEmail) {
              const subResponse = await fetch(`/api/subscription?email=${encodeURIComponent(freelancerEmail)}`);
              const subResult = await subResponse.json();
              if (subResult.success && subResult.data) {
                setFreelancerFee(subResult.data.marketplace_fee);
                console.log('✅ Freelancer fee found:', subResult.data.marketplace_fee);
              }
            }
          } catch (feeError) {
            console.warn('⚠️ Could not fetch freelancer fee:', feeError);
          }
        };

        fetchFreelancerFee();
      }
    }
  }, [packageId, packages]);

  const handleBookPackage = async () => {
    if (!userId || !selectedPackage) return;

    setBookingStep('payment');

    const result = await bookPackage(userId, packageId, specialInstructions);

    if (result) {
      setBookingResult(result);
      setBookingStep('confirming');

      // Simulate payment confirmation
      setTimeout(() => {
        setBookingStep('success');
      }, 3000);
    } else {
      setBookingStep('details');
    }
  };

  const getPaymentStatusIcon = () => {
    switch (bookingStep) {
      case 'details': return <CreditCard className="w-5 h-5 text-gray-500" />;
      case 'payment': return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'confirming': return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPaymentStatusText = () => {
    switch (bookingStep) {
      case 'details': return 'Review & Book';
      case 'payment': return 'Processing Payment...';
      case 'confirming': return 'Confirming Payment...';
      case 'success': return 'Payment Confirmed!';
      default: return 'Review & Book';
    }
  };

  if (packagesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading package details...</div>
          </div>
        </main>
      </div>
    );
  }

  if (packagesError || !selectedPackage) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Package Not Found</h2>
            <p className="text-gray-600 mb-4">
              {packagesError || 'The package you\'re looking for doesn\'t exist.'}
            </p>
            <Button onClick={() => router.push('/client/browse-services')}>
              Browse Services
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Package Details */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{selectedPackage.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedPackage.tier}</Badge>
                      <Badge
                        variant={selectedPackage.status === 'Available' ? 'default' : 'secondary'}
                      >
                        {selectedPackage.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#0B1F36]">
                      {formatMoney(selectedPackage.price_minor)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedPackage.delivery_days} days delivery
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{selectedPackage.description}</p>

                <div className="space-y-3">
                  <h4 className="font-medium">What's included:</h4>
                  <ul className="space-y-2">
                    {selectedPackage.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedPackage.delivery_days} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span>{selectedPackage.revisions_included} revisions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Freelancer Info */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">About the Freelancer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium">Freelancer Name</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>4.8 (1.2k reviews)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            {bookingStep === 'success' ? (
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-green-800 mb-2">Booking Confirmed!</h2>
                  <p className="text-green-600 mb-4">
                    Your project has been booked and payment is secured in escrow.
                  </p>
                  {bookingResult && (
                    <div className="text-sm text-green-700 mb-4">
                      <div>Booking ID: {bookingResult.booking_id}</div>
                      <div>Amount: {formatMoney(bookingResult.amount_minor)}</div>
                      {bookingResult.ledger_block && (
                        <div>Transaction: {bookingResult.ledger_block.toString()}</div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => router.push('/client/projects')}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      View Projects
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/client/browse-services')}
                    >
                      Browse More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Book This Package</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                      placeholder="Any specific requirements or preferences for this project..."
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Package Price</span>
                      <span className="font-semibold">{formatMoney(selectedPackage.price_minor)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Platform Fee ({Math.round(freelancerFee * 100)}%)</span>
                      <span className="text-sm text-gray-600">
                        {formatMoney(BigInt(Math.floor(Number(selectedPackage.price_minor) * freelancerFee)))}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total</span>
                        <span className="font-bold text-lg">
                          {formatMoney(BigInt(Math.floor(Number(selectedPackage.price_minor) * (1 + freelancerFee))))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {bookingError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Your payment is secured in escrow until project completion</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Funds released only after you approve each stage</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 text-blue-500" />
                      <span>Full refund available if project is cancelled</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookPackage}
                    disabled={bookingLoading || bookingStep !== 'details'}
                    className="w-full bg-[#0B1F36] text-white hover:bg-[#1a3a5f] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon()}
                      <span>{getPaymentStatusText()}</span>
                    </div>
                  </Button>

                  {bookingStep === 'confirming' && (
                    <div className="text-center text-sm text-gray-600">
                      <div className="animate-pulse">Confirming your payment...</div>
                      <div className="text-xs mt-1">
                        This may take a few moments while we verify the transaction.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
