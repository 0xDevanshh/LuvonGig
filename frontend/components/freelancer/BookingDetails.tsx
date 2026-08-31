'use client'
import React from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  DollarSign,
  Package,
  Star,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Zap,
  Shield,
  Headphones,
  FileText
} from 'lucide-react';

interface BookingDetailsProps {
  booking: {
    booking_id: string;
    service_title: string;
    package_tier: string;
    package_title: string;
    package_description: string;
    package_delivery_days: number;
    package_revisions: number;
    package_features: string[];
    client_id: string;
    freelancer_id: string;
    total_amount_usd: number;
    base_amount_usd: number;
    platform_fee_usd: number;
    upsells_total: number;
    payment_method: string;
    payment_status: string;
    upsells: Array<{
      id: string;
      name: string;
      price: number;
      category: string;
    }>;
    special_instructions: string;
    promo_code?: string;
    status: string;
    delivery_deadline: string;
    days_remaining: number;
    created_date: string;
    last_updated: string;
  };
}

export function BookingDetails({ booking }: BookingDetailsProps) {
  const [showFeatures, setShowFeatures] = React.useState(false);
  const [showUpsells, setShowUpsells] = React.useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit-card':
        return <DollarSign size={16} />;
      case 'bitpay':
        return <Shield size={16} />;
      case 'icp':
        return <Package size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  const getUpsellIcon = (category: string) => {
    switch (category) {
      case 'delivery':
        return <Zap size={16} />;
      case 'revisions':
        return <RefreshCw size={16} />;
      case 'support':
        return <Headphones size={16} />;
      case 'features':
        return <FileText size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{booking.service_title}</h3>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {booking.package_tier} Package
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${booking.total_amount_usd.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Payment</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Client Information */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {booking.client_id.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Client</h4>
              <p className="text-sm text-gray-600">{booking.client_id}</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <MessageCircle size={16} />
            <span>Start Chat</span>
          </button>
        </div>

        {/* Package Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Package Details</h4>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h5 className="font-medium text-purple-900">{booking.package_title}</h5>
                <p className="text-sm text-purple-700 mt-1">{booking.package_description}</p>
              </div>
              <div className="text-right">
                <div className="font-medium text-purple-900">${booking.base_amount_usd.toFixed(2)}</div>
                <div className="text-xs text-purple-600">Base price</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="text-purple-600" size={16} />
                <span className="text-purple-900">
                  {booking.package_delivery_days} day{booking.package_delivery_days !== 1 ? 's' : ''} delivery
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="text-purple-600" size={16} />
                <span className="text-purple-900">
                  {booking.package_revisions} revision{booking.package_revisions !== 1 ? 's' : ''} included
                </span>
              </div>
            </div>

            {/* Features */}
            {booking.package_features && booking.package_features.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="flex items-center space-x-2 text-sm font-medium text-purple-900 hover:text-purple-700"
                >
                  <span>What's Included ({booking.package_features.length} items)</span>
                  {showFeatures ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showFeatures && (
                  <ul className="mt-2 space-y-1">
                    {booking.package_features.map((feature, index) => (
                      <li key={index} className="text-sm text-purple-700 flex items-start">
                        <Check className="text-purple-600 mr-2 mt-0.5" size={14} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upsells */}
        {booking.upsells && booking.upsells.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Service Enhancements (${booking.upsells_total.toFixed(2)})
            </h4>
            <div className="space-y-2">
              {booking.upsells.map((upsell) => {
                return (
                  <div key={upsell.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-green-600">
                        {getUpsellIcon(upsell.category)}
                      </div>
                      <div>
                        <h5 className="font-medium text-green-900 text-sm">{upsell.name}</h5>
                        <p className="text-xs text-green-700">{upsell.category}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-900">
                      +${upsell.price.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {booking.special_instructions && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Client Instructions</h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">{booking.special_instructions}</p>
            </div>
          </div>
        )}

        {/* Pricing Breakdown */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Package</span>
                <span className="font-medium">${booking.base_amount_usd.toFixed(2)}</span>
              </div>

              {booking.upsells_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Enhancements</span>
                  <span className="font-medium">${booking.upsells_total.toFixed(2)}</span>
                </div>
              )}

              {booking.promo_code && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Promo Code ({booking.promo_code})</span>
                  <span className="font-medium text-green-600">-Discount</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Platform Fee ({((booking.platform_fee_usd / (booking.base_amount_usd + booking.upsells_total)) * 100).toFixed(0)}%)
                </span>
                <span className="font-medium">${booking.platform_fee_usd.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Total Amount</span>
                  <span className="font-bold text-gray-900">${booking.total_amount_usd.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              {getPaymentMethodIcon(booking.payment_method)}
              <div>
                <p className="text-sm font-medium text-green-900">{booking.payment_method.toUpperCase()}</p>
                <p className="text-xs text-green-700">Payment Method</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              <Check className="text-green-600" size={16} />
              <div>
                <p className="text-sm font-medium text-green-900">{booking.payment_status.toUpperCase()}</p>
                <p className="text-xs text-green-700">Payment Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Project Timeline</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="text-gray-400" size={16} />
              <div>
                <p className="text-sm font-medium text-gray-900">Booking Created</p>
                <p className="text-xs text-gray-600">{new Date(booking.created_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="text-blue-600" size={16} />
              <div>
                <p className="text-sm font-medium text-gray-900">Delivery Deadline</p>
                <p className="text-xs text-gray-600">
                  {new Date(booking.delivery_deadline).toLocaleDateString()} ({booking.days_remaining} days remaining)
                </p>
              </div>
            </div>

            {booking.days_remaining <= 3 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="text-red-600" size={16} />
                <div>
                  <p className="text-sm font-medium text-red-900">Deadline Approaching</p>
                  <p className="text-xs text-red-600">
                    Only {booking.days_remaining} day{booking.days_remaining !== 1 ? 's' : ''} left to deliver
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
            <MessageCircle size={16} />
            <span>Start Chat</span>
          </button>
          <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2">
            <Package size={16} />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}