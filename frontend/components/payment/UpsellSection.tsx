'use client'
import React from 'react';
import { Plus, Clock, RefreshCw, Headphones, FileText, Zap, Check } from 'lucide-react';

interface UpsellItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: string;
  popular?: boolean;
  category: 'delivery' | 'revisions' | 'support' | 'features';
}

interface UpsellSectionProps {
  upsells?: UpsellItem[];
  selectedUpsells: UpsellItem[];
  onUpsellsChange: (upsells: UpsellItem[]) => void;
  onToggle?: (upsell: UpsellItem) => void;
}

// Default upsells if none provided
const DEFAULT_UPSELLS: UpsellItem[] = [
  {
    id: 'express-delivery',
    name: 'Express Delivery',
    description: 'Get your project delivered 2x faster',
    price: 25,
    duration: '2-3 days faster',
    popular: true,
    category: 'delivery'
  },
  {
    id: 'extra-revisions',
    name: 'Extra Revisions',
    description: 'Add 2 more revision rounds',
    price: 15,
    category: 'revisions'
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: '24/7 priority support and faster response times',
    price: 20,
    duration: 'Throughout project',
    category: 'support'
  },
  {
    id: 'commercial-license',
    name: 'Commercial License',
    description: 'Full commercial rights to use deliverables',
    price: 50,
    popular: true,
    category: 'features'
  },
  {
    id: 'source-files',
    name: 'Source Files',
    description: 'Receive all editable source files',
    price: 30,
    category: 'features'
  },
  {
    id: 'extended-support',
    name: 'Extended Support',
    description: '30 days of post-delivery support',
    price: 40,
    duration: '30 days',
    category: 'support'
  }
];

export function UpsellSection({ 
  upsells = DEFAULT_UPSELLS, 
  selectedUpsells, 
  onUpsellsChange,
  onToggle 
}: UpsellSectionProps) {
  // Convert dollar price to ICP (ranging 2-10 ICP)
  const convertToICP = (dollarPrice: number): number => {
    // Map $15-$50 to 2-10 ICP range
    // Formula: ICP = 2 + (price - 15) * (10 - 2) / (50 - 15)
    const minDollar = 15;
    const maxDollar = 50;
    const minICP = 2;
    const maxICP = 10;
    
    if (dollarPrice <= minDollar) return minICP;
    if (dollarPrice >= maxDollar) return maxICP;
    
    const icp = minICP + (dollarPrice - minDollar) * (maxICP - minICP) / (maxDollar - minDollar);
    return Math.round(icp); // Round to whole number
  };

  const handleToggle = (upsell: UpsellItem) => {
    if (onToggle) {
      // If onToggle is provided, pass the upsell with converted ICP price
      const upsellWithICP = {
        ...upsell,
        price: convertToICP(upsell.price)
      };
      onToggle(upsellWithICP);
    } else {
      // Use onUpsellsChange
      const isSelected = selectedUpsells.some(item => item.id === upsell.id);
      if (isSelected) {
        onUpsellsChange(selectedUpsells.filter(item => item.id !== upsell.id));
      } else {
        // Convert price to ICP before adding to selected upsells
        const upsellWithICP = {
          ...upsell,
          price: convertToICP(upsell.price)
        };
        onUpsellsChange([...selectedUpsells, upsellWithICP]);
      }
    }
  };
  const getCategoryIcon = (category: UpsellItem['category']) => {
    switch (category) {
      case 'delivery':
        return Clock;
      case 'revisions':
        return RefreshCw;
      case 'support':
        return Headphones;
      case 'features':
        return FileText;
      default:
        return Plus;
    }
  };

  const getCategoryName = (category: UpsellItem['category']) => {
    switch (category) {
      case 'delivery':
        return 'Delivery Options';
      case 'revisions':
        return 'Revision Packages';
      case 'support':
        return 'Support Plans';
      case 'features':
        return 'Additional Features';
      default:
        return 'Other';
    }
  };

  // Group upsells by category
  const groupedUpsells = upsells.reduce((acc, upsell) => {
    if (!acc[upsell.category]) {
      acc[upsell.category] = [];
    }
    acc[upsell.category].push(upsell);
    return acc;
  }, {} as Record<UpsellItem['category'], UpsellItem[]>);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Enhance Your Service</h3>
        <span className="text-sm text-purple-600">Popular additions</span>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedUpsells).map(([category, items]) => {
          const Icon = getCategoryIcon(category as UpsellItem['category']);

          return (
            <div key={category} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center space-x-2 mb-3">
                <Icon size={18} className="text-purple-600" />
                <h4 className="font-medium text-gray-900">{getCategoryName(category as UpsellItem['category'])}</h4>
              </div>

              <div className="space-y-3">
                {items.map((upsell) => {
                  const isSelected = selectedUpsells.some(item => item.id === upsell.id);

                  return (
                    <div
                      key={upsell.id}
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => handleToggle(upsell)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium text-gray-900">{upsell.name}</h5>
                              {upsell.popular && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-2">{upsell.description}</p>

                            {upsell.duration && (
                              <div className="flex items-center space-x-2 text-sm text-purple-600">
                                <Zap size={14} />
                                <span>{upsell.duration}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-gray-900">{convertToICP(upsell.price)} ICP</div>
                          <div className="text-xs text-gray-500">one-time</div>
                        </div>
                      </div>

                      {/* Benefits section for selected items */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <div className="text-sm text-purple-700">
                            <span className="font-medium">Added to your order:</span> This enhancement will be applied to your service delivery.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Value Proposition */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Get More Value</h4>
            <p className="text-sm text-purple-700">
              Clients who add these enhancements typically receive 40% better results and complete their projects 30% faster.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">⚡ Faster delivery</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">🎯 Better quality</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">💬 More support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}