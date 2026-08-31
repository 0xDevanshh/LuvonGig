'use client'
import React from 'react';
import { Star, Clock, User, Image as ImageIcon } from 'lucide-react';

interface Service {
  service_id: string;
  title: string;
  description: string;
  freelancer_email: string;
  freelancer_name: string;
  rating_avg: number;
  total_orders: number;
  cover_image_url: string;
  portfolio_images: string[];
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

interface ServiceSummaryProps {
  service: Service;
  selectedPackage: Package;
  specialInstructions: string;
  onInstructionsChange: (value: string) => void;
}

export function ServiceSummary({
  service,
  selectedPackage,
  specialInstructions,
  onInstructionsChange
}: ServiceSummaryProps) {
  const price = selectedPackage.price_e8s / 100000000; // Convert from e8s to ICP

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium mb-4">Service Details</h3>

      {/* Service Header */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="relative">
          <img
            src={service.cover_image_url || "/default-service.svg"}
            alt={service.title}
            className="w-24 h-24 rounded-lg object-cover"
          />
          {service.portfolio_images && service.portfolio_images.length > 1 && (
            <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white rounded-full p-1">
              <ImageIcon size={14} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{service.title}</h2>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <User size={14} />
              <span>{service.freelancer_name || service.freelancer_email.split('@')[0]}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-yellow-500 fill-current" />
              <span>{service.rating_avg.toFixed(1)}</span>
              <span>({service.total_orders})</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
        </div>
      </div>

      {/* Selected Package */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Selected Package</h4>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
            {selectedPackage.tier}
          </span>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="font-medium text-purple-900">{selectedPackage.title}</h5>
              <p className="text-sm text-purple-700">{selectedPackage.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-900">
                ${price < 0.01 && price > 0 ? price.toFixed(4) : price.toFixed(2)}
              </div>
              <div className="text-sm text-purple-700">ICP {price.toFixed(4)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-purple-600" />
              <span className="text-purple-900">
                {selectedPackage.delivery_days} day{selectedPackage.delivery_days !== 1 ? 's' : ''} delivery
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-xs text-purple-700 font-medium">
                  {selectedPackage.revisions_included}
                </span>
              </div>
              <span className="text-purple-900">
                Revision{selectedPackage.revisions_included !== 1 ? 's' : ''} included
              </span>
            </div>
          </div>

          {selectedPackage.features && selectedPackage.features.length > 0 && (
            <div className="mt-3">
              <h6 className="text-sm font-medium text-purple-900 mb-2">What's included:</h6>
              <ul className="space-y-1">
                {selectedPackage.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="text-sm text-purple-700 flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
                {selectedPackage.features.length > 3 && (
                  <li className="text-sm text-purple-600 italic">
                    +{selectedPackage.features.length - 3} more features
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Special Instructions */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <label htmlFor="special-instructions" className="block text-sm font-medium text-gray-700 mb-2">
          Special Instructions <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          id="special-instructions"
          value={specialInstructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="Please provide any special requirements, deadlines, or specific instructions for the freelancer..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Help the freelancer understand your specific requirements and expectations
        </p>
      </div>

      {/* Service Guarantee */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Service Guarantee</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Money-back guarantee if service isn't delivered as described</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Secure payment held in escrow until completion</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>24/7 customer support for any issues</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}