'use client'
import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface UpsellItem {
  id: string;
  name: string;
  price: number;
}

interface PromoApplied {
  discount: number;
  code: string;
}

interface OrderSummaryProps {
  packagePrice: number;
  upsells: UpsellItem[];
  promoApplied: PromoApplied | null;
  total: number;
  platformFee?: number;
  platformFeeRate?: number; // Fee rate as decimal (e.g., 0.04 for 4%)
  subtotal?: number;
}

export function OrderSummary({
  packagePrice,
  upsells,
  promoApplied,
  total,
  platformFee: providedPlatformFee,
  platformFeeRate = 0.04, // Default to 4% for Basic plan
  subtotal: providedSubtotal
}: OrderSummaryProps) {
  const upsellTotal = upsells.reduce((sum, upsell) => sum + upsell.price, 0);
  const subtotal = providedSubtotal ?? (packagePrice + upsellTotal);
  const discountAmount = promoApplied ? subtotal * (promoApplied.discount / 100) : 0;
  const afterDiscount = subtotal - discountAmount;
  const platformFee = providedPlatformFee ?? (afterDiscount * platformFeeRate);
  const formatUSD = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="bg-white rounded-xl border-2 border-purple-100 shadow-lg p-6">
      {/* Header with gradient */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
          <Sparkles className="text-purple-600" size={20} />
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" />
      </div>

      {/* Package Price */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Package Price</span>
          <span className="text-lg font-bold text-gray-900">{formatUSD(packagePrice)}</span>
        </div>
      </div>

      {/* Selected Upsells */}
      {upsells.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Sparkles size={16} className="text-purple-600" />
            <span>Enhancements</span>
          </h5>
          <div className="space-y-2">
            {upsells.map((upsell) => (
              <div key={upsell.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-700">{upsell.name}</span>
                <span className="text-sm font-semibold text-purple-700">+{formatUSD(upsell.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatUSD(subtotal)}</span>
          </div>

          {promoApplied && (
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-700 font-medium">Discount ({promoApplied.code})</span>
                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">-{promoApplied.discount}%</span>
              </div>
              <span className="text-sm text-green-700 font-bold">-{formatUSD(discountAmount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Platform Fee ({(platformFeeRate * 100).toFixed(0)}%)</span>
              <div className="group relative">
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center cursor-help">
                  <span className="text-[10px] text-gray-600">?</span>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                  <div className="font-semibold mb-1">Platform Fee Benefits:</div>
                  <ul className="space-y-1">
                    <li>• Secure escrow protection</li>
                    <li>• Dispute resolution</li>
                    <li>• 24/7 customer support</li>
                    <li>• Payment processing</li>
                  </ul>
                </div>
              </div>
            </div>
            <span className="font-medium text-gray-900">{formatUSD(platformFee)}</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="border-t-2 border-gray-300 pt-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              {formatUSD(total)}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Security */}
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-green-800">
            <div className="font-semibold mb-2">Secure Payment Protection</div>
            <ul className="space-y-1.5">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Payment held in escrow until completion</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Full refund if service isn't delivered</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Processed securely by Stripe</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 leading-relaxed">
          By completing this payment, you agree to our{' '}
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">Terms of Service</a> and{' '}
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">Refund Policy</a>.
          The freelancer will be notified immediately after payment confirmation.
        </div>
      </div>
    </div>
  );
}
