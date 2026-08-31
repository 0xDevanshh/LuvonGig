'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceNavigation } from '@/components/ServiceNavigation';
import { useServiceForm } from '@/context/ServiceFormContext';
import { Check, DollarSign } from 'lucide-react';
import Image from 'next/image';
export default function AddServicePricing() {
  const navigate = useRouter();
  const {
    formData,
    updateFormData,
    isSaved,
    setSaved
  } = useServiceForm();
  const handlePriceChange = (tier: 'basic' | 'advanced' | 'premium', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    updateFormData({
      [`${tier}Price`]: numericValue
    });
    setSaved(`${tier}Price`, true);
  };
  const handleContinue = () => {
    navigate.push('/add-service/portfolio');
  };
  return <div className="flex flex-col min-h-screen bg-white">
    <header className="flex justify-between items-center p-4 border-b border-gray-200">
      <img src="/WB.png" alt="Workbudd Logo" className="h-6" />

      <button className="px-8 py-2 rounded-full border border-gray-300 text-gray-800 hover:bg-gray-50">
        Exit
      </button>
    </header>
    <main className="flex-1 container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#161616]">
          Add Your Services
        </h1>
        <div className="text-sm text-gray-600">
          Pricing Details: <span className="font-medium">1/5 Done</span>
        </div>
      </div>
      <ServiceNavigation activeTab="pricing" />
      <div className="mt-12">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#161616]">
            Set Your Pricing
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Define how much you'll charge for each service tier.
          </p>
        </div>
        {formData.tierMode === '1tier' ? <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="bg-[#FFF8D6] p-4 rounded-t-lg text-center font-medium">
              Basic
            </div>
            <div className="border border-gray-200 rounded-b-lg p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-gray-500" />
                </div>
                <input type="text" value={formData.basicPrice} onChange={e => handlePriceChange('basic', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Enter price" />
                {isSaved.basicPrice && <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
                  <Check size={16} className="mr-1" />
                  <span className="text-sm">Saved</span>
                </div>}
              </div>
            </div>
          </div>
        </div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mb-8">
            <div className="bg-[#FFF8D6] p-4 rounded-t-lg text-center font-medium">
              Basic
            </div>
            <div className="border border-gray-200 rounded-b-lg p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-gray-500" />
                </div>
                <input type="text" value={formData.basicPrice} onChange={e => handlePriceChange('basic', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Enter price" />
                {isSaved.basicPrice && <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
                  <Check size={16} className="mr-1" />
                  <span className="text-sm">Saved</span>
                </div>}
              </div>
            </div>
          </div>
          <div className="mb-8">
            <div className="bg-[#DFFCE9] p-4 rounded-t-lg text-center font-medium">
              Advanced
            </div>
            <div className="border border-gray-200 rounded-b-lg p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-gray-500" />
                </div>
                <input type="text" value={formData.advancedPrice} onChange={e => handlePriceChange('advanced', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Enter price" />
                {isSaved.advancedPrice && <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
                  <Check size={16} className="mr-1" />
                  <span className="text-sm">Saved</span>
                </div>}
              </div>
            </div>
          </div>
          <div className="mb-8">
            <div className="bg-[#E9D8FF] p-4 rounded-t-lg text-center font-medium">
              Premium
            </div>
            <div className="border border-gray-200 rounded-b-lg p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-gray-500" />
                </div>
                <input type="text" value={formData.premiumPrice} onChange={e => handlePriceChange('premium', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none" placeholder="Enter price" />
                {isSaved.premiumPrice && <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
                  <Check size={16} className="mr-1" />
                  <span className="text-sm">Saved</span>
                </div>}
              </div>
            </div>
          </div>
        </div>}
        <div className="mt-12 flex justify-center">
          <button onClick={handleContinue} className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Continue
          </button>
        </div>
      </div>
    </main>
  </div>;
}