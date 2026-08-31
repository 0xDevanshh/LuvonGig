'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, CreditCard, Wallet, Bitcoin, Shield, RefreshCw, Headphones } from 'lucide-react';

interface Service {
  service_id: string;
  title: string;
  description: string;
  freelancer_email: string;
  freelancer_name: string;
  rating_avg: number;
  total_orders: number;
  cover_image_url: string;
  packages: Package[];
}

interface Package {
  package_id: string;
  tier: string;
  title: string;
  description: string;
  price_e8s: number;
  delivery_days: number;
  features: string[];
  revisions_included: number;
}

function PaymentCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'credit-card' | 'bitpay' | 'icp'>('credit-card');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const serviceId = searchParams.get('serviceId');
  const packageId = searchParams.get('packageId');

  useEffect(() => {
    if (!serviceId) {
      router.push('/client/browse-services');
      return;
    }

    const fetchService = async () => {
      try {
        const response = await fetch(`/api/marketplace/services/${serviceId}`);
        const data = await response.json();

        if (data.success) {
          setService(data.data);

          if (data.data.packages && packageId) {
            const pkg = data.data.packages.find((p: Package) => p.package_id === packageId);
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
  }, [serviceId, packageId, router]);

  const handleProceed = () => {
    if (!service || !selectedPackage) return;

    const params = new URLSearchParams({
      serviceId: service.service_id,
      packageId: selectedPackage.package_id,
      instructions: specialInstructions,
    });

    router.push(`/client/payment/${service.service_id}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!service || !selectedPackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-4">The service you're trying to book doesn't exist.</p>
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
            <Link href={`/client/service/${serviceId}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ChevronLeft size={20} />
              <span>Back to Service</span>
            </Link>

            <div className="flex items-center space-x-2">
              <Shield className="text-green-600" size={20} />
              <span className="text-sm text-gray-600">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

          {/* Service Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Service Details</h2>
            <div className="flex items-start space-x-4">
              <img
                src={service.cover_image_url || '/placeholder-service.jpg'}
                alt={service.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{service.freelancer_name}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>⭐ {service.rating_avg?.toFixed(1) || '0.0'}</span>
                  <span>📦 {service.total_orders || 0} orders</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">{selectedPackage.title}</h4>
              <p className="text-gray-600 text-sm mb-3">{selectedPackage.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-600">
                  ${(selectedPackage.price_e8s / 100000000).toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  📅 {selectedPackage.delivery_days} days delivery
                </span>
              </div>
              {selectedPackage.features && selectedPackage.features.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {selectedPackage.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Special Instructions (Optional)</h2>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Tell the freelancer about any specific requirements or preferences..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Choose Payment Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentMethod('credit-card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'credit-card'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="font-medium">Credit Card</div>
                <div className="text-sm text-gray-500">Visa, Mastercard, etc.</div>
              </button>

              <button
                onClick={() => setPaymentMethod('bitpay')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'bitpay'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Bitcoin className="mx-auto mb-2" size={24} />
                <div className="font-medium">BitPay</div>
                <div className="text-sm text-gray-500">Pay with cryptocurrency</div>
              </button>

              <button
                onClick={() => setPaymentMethod('icp')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'icp'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Wallet className="mx-auto mb-2" size={24} />
                <div className="font-medium">ICP Wallet</div>
                <div className="text-sm text-gray-500">Pay with ICP tokens</div>
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-medium mb-4">Why Trust Us?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Shield className="text-green-600" size={24} />
                <div>
                  <div className="font-medium">Payment Protection</div>
                  <div className="text-sm text-gray-600">Your money is safe</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RefreshCw className="text-blue-600" size={24} />
                <div>
                  <div className="font-medium">Quality Guarantee</div>
                  <div className="text-sm text-gray-600">Satisfaction guaranteed</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Headphones className="text-purple-600" size={24} />
                <div>
                  <div className="font-medium">24/7 Support</div>
                  <div className="text-sm text-gray-600">Always here to help</div>
                </div>
              </div>
            </div>
          </div>

          {/* Proceed Button */}
          <div className="flex justify-end">
            <button
              onClick={handleProceed}
              className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <PaymentCreateContent />
    </Suspense>
  );
}