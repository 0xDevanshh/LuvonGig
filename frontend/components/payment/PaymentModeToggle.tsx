'use client'

import React from 'react'
import { DollarSign, Coins, Info } from 'lucide-react'

export type PaymentMode = 'tokens' | 'usd'

interface PaymentModeToggleProps {
  mode: PaymentMode
  onModeChange: (mode: PaymentMode) => void
  className?: string
}

export function PaymentModeToggle({ mode, onModeChange, className = '' }: PaymentModeToggleProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Payment Mode
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Pay in USD Mode */}
        <button
          type="button"
          onClick={() => onModeChange('usd')}
          className={`relative p-4 rounded-lg border-2 transition-all ${
            mode === 'usd'
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className={`p-2 rounded-lg ${
              mode === 'usd' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <DollarSign size={24} />
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">Pay in USD</div>
              <div className="text-xs text-gray-500 mt-1">
                Auto-convert to tokens
              </div>
            </div>
          </div>
          {mode === 'usd' && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full" />
            </div>
          )}
        </button>

        {/* Pay in Tokens Mode */}
        <button
          type="button"
          onClick={() => onModeChange('tokens')}
          className={`relative p-4 rounded-lg border-2 transition-all ${
            mode === 'tokens'
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className={`p-2 rounded-lg ${
              mode === 'tokens' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <Coins size={24} />
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">Pay in Tokens</div>
              <div className="text-xs text-gray-500 mt-1">
                Fixed token amount
              </div>
            </div>
          </div>
          {mode === 'tokens' && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full" />
            </div>
          )}
        </button>
      </div>

      {/* Info Banner */}
      <div className={`mt-3 p-3 rounded-lg ${
        mode === 'usd' 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-purple-50 border border-purple-200'
      }`}>
        <div className="flex items-start space-x-2">
          <Info 
            className={mode === 'usd' ? 'text-blue-600' : 'text-purple-600'} 
            size={16} 
          />
          <p className={`text-xs ${
            mode === 'usd' ? 'text-blue-700' : 'text-purple-700'
          }`}>
            {mode === 'usd' 
              ? 'The exact token amount will be calculated at the time of payment based on current exchange rates.'
              : 'You will pay the exact amount of tokens displayed. The USD value may vary based on market rates.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

