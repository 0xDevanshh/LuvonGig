'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Loader2, Info } from 'lucide-react'
import { SUPPORTED_TOKENS, type SupportedToken, getAllLedgerPrices, formatTokenAmount } from '@/lib/icpay-client'

interface LedgerSelectorProps {
  selectedToken: SupportedToken
  onTokenChange: (token: SupportedToken) => void
  usdAmount?: number
  className?: string
}

interface TokenPrice {
  symbol: string
  price: number
  decimals: number
  canisterId: string
}

export function LedgerSelector({
  selectedToken,
  onTokenChange,
  usdAmount,
  className = ''
}: LedgerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prices, setPrices] = useState<TokenPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      setLoading(true)
      setError(null)
      const pricedLedgers = await getAllLedgerPrices()

      // Filter to only include supported tokens
      const supportedSymbols = SUPPORTED_TOKENS.map(t => t.symbol)
      const filteredPrices = pricedLedgers
        .filter((ledger: any) => supportedSymbols.includes(ledger.symbol))
        .map((ledger: any) => ({
          symbol: ledger.symbol,
          price: ledger.price || 0,
          decimals: ledger.decimals,
          canisterId: ledger.canisterId,
        }))

      setPrices(filteredPrices)
    } catch (err) {
      console.error('Error fetching token prices:', err)
      setError('Unable to fetch token prices')
      // Set fallback prices for development
      setPrices(SUPPORTED_TOKENS.map(token => ({
        symbol: token.symbol,
        price: 0,
        decimals: token.decimals,
        canisterId: '',
      })))
    } finally {
      setLoading(false)
    }
  }

  const selectedTokenData = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken)
  const selectedPrice = prices.find(p => p.symbol === selectedToken)

  const calculateTokenAmount = (price: TokenPrice) => {
    if (!usdAmount || !price.price) return null
    const amount = usdAmount / price.price
    return amount.toFixed(6)
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Payment Token
      </label>

      {/* Selected Token Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
            {selectedToken === 'ICP' ? '∞' : selectedToken.substring(0, 2)}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">{selectedTokenData?.name}</div>
            <div className="text-sm text-gray-500">{selectedToken}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading ? (
            <Loader2 className="animate-spin text-gray-400" size={20} />
          ) : (
            <>
              {selectedPrice && selectedPrice.price > 0 && (
                <div className="text-right mr-2">
                  <div className="text-sm font-medium text-gray-900">
                    ${selectedPrice.price < 1 && selectedPrice.price > 0 ? selectedPrice.price.toFixed(4) : selectedPrice.price.toFixed(2)}
                  </div>
                  {usdAmount && (
                    <div className="text-xs text-gray-500">
                      ≈ {calculateTokenAmount(selectedPrice)} {selectedToken}
                    </div>
                  )}
                </div>
              )}
              <ChevronDown
                className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                size={20}
              />
            </>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          {error && (
            <div className="p-4 text-sm text-amber-600 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center space-x-2">
                <Info size={16} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="py-2">
            {SUPPORTED_TOKENS.map((token) => {
              const price = prices.find(p => p.symbol === token.symbol)
              const isSelected = selectedToken === token.symbol

              return (
                <button
                  key={token.symbol}
                  type="button"
                  onClick={() => {
                    onTokenChange(token.symbol)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-purple-50' : ''
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${token.symbol === 'ICP' ? 'bg-gradient-to-br from-purple-500 to-blue-500' :
                      token.symbol === 'ckUSDC' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                        token.symbol === 'ckBTC' ? 'bg-gradient-to-br from-orange-500 to-yellow-500' :
                          'bg-gradient-to-br from-gray-500 to-gray-700'
                      }`}>
                      {token.symbol === 'ICP' ? '∞' : token.symbol.substring(0, 2)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{token.name}</div>
                      <div className="text-sm text-gray-500">{token.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {loading ? (
                      <Loader2 className="animate-spin text-gray-400" size={16} />
                    ) : price && price.price > 0 ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          ${price.price < 1 && price.price > 0 ? price.price.toFixed(4) : price.price.toFixed(2)}
                        </div>
                        {usdAmount && (
                          <div className="text-xs text-gray-500">
                            ≈ {calculateTokenAmount(price)} {token.symbol}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">Price unavailable</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={fetchPrices}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Refresh Prices
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

