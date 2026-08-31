'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useServiceForm } from '@/context/ServiceFormContext'
import { AddProjectNav } from '@/components/freelancer/AddProjectNav'
import { Coins } from 'lucide-react'
export default function AddServicePricing() {
  const router = useRouter()
  const { formData, updateFormData } = useServiceForm()

  const handlePriceChange = (
    tier: 'basic' | 'advanced' | 'premium',
    value: string,
  ) => {
    // Allow digits, single decimal point, and empty string
    // Match pattern: optional digits, optional decimal point, optional digits after decimal
    const decimalRegex = /^\d*\.?\d*$/
    
    // If empty, allow it (for clearing the field)
    if (value === '') {
      updateFormData({
        [`${tier}Price`]: '',
      })
      return
    }
    
    // Check if the value matches the decimal pattern
    if (decimalRegex.test(value)) {
      updateFormData({
        [`${tier}Price`]: value,
      })
    }
    // If it doesn't match, keep the previous value (don't update)
  }

  const handleTierModeToggle = () => {
    updateFormData({
      tierMode: formData.tierMode === '1tier' ? '3tier' : '1tier',
    })
  }
  const handleContinue = () => {
    router.push('/freelancer/add-service/portfolio')
  }
  return (
    <div className="flex flex-col min-h-screen bg-white">
     
      <main className="flex-1 container mx-auto py-6 px-4 max-w-5xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#161616]">
            Add Your Services
          </h1>
          <div className="text-sm text-gray-600">
            Pricing Details: <span className="font-medium">3/5 Done</span>
          </div>
        </div>
        <AddProjectNav />
        <div className="mt-12">
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#161616]">
                Set Your Pricing
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Define how much you'll charge for each service tier.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">1 Tier</span>
              <div
                className={`w-12 h-6 rounded-full flex items-center p-0.5 cursor-pointer ${
                  formData.tierMode === '3tier' ? 'bg-green-500' : 'bg-gray-200'
                }`}
                onClick={handleTierModeToggle}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    formData.tierMode === '3tier' ? 'transform translate-x-6' : ''
                  }`}
                ></div>
              </div>
              <span className="text-sm font-medium">3 Tiers</span>
            </div>
          </div>
          {formData.tierMode === '1tier' ? (
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <div className="bg-[#FFF8D6] p-4 rounded-t-lg text-center font-medium">
                  Basic
                </div>
                <div className="border border-gray-200 rounded-b-lg p-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Coins size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={formData.basicPrice}
                      onChange={(e) =>
                        handlePriceChange('basic', e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none"
                      placeholder="Enter price in ICP"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-8">
                <div className="bg-[#FFF8D6] p-4 rounded-t-lg text-center font-medium">
                  Basic
                </div>
                <div className="border border-gray-200 rounded-b-lg p-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Coins size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={formData.basicPrice}
                      onChange={(e) =>
                        handlePriceChange('basic', e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none"
                      placeholder="Enter price in ICP"
                    />
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
                      <Coins size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={formData.advancedPrice}
                      onChange={(e) =>
                        handlePriceChange('advanced', e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none"
                      placeholder="Enter price in ICP"
                    />
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
                      <Coins size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={formData.premiumPrice}
                      onChange={(e) =>
                        handlePriceChange('premium', e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none"
                      placeholder="Enter price in ICP"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-center mt-12">
            <button
              onClick={handleContinue}
              className="px-12 py-3 bg-rainbow-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}