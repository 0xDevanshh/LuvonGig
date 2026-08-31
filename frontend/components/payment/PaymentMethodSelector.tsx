'use client'

import React, { useState, useEffect } from 'react'
import { Wallet, Check, AlertCircle, Loader2 } from 'lucide-react'
import { LedgerSelector } from './LedgerSelector'
import { PaymentModeToggle, type PaymentMode } from './PaymentModeToggle'
import { getWalletSelect, type SupportedToken, calculateTokenAmount, formatTokenAmount } from '@/lib/icpay-client'

interface PaymentMethodSelectorProps {
  selectedToken: SupportedToken
  onTokenChange: (token: SupportedToken) => void
  paymentMode: PaymentMode
  onPaymentModeChange: (mode: PaymentMode) => void
  usdAmount?: number
  onWalletConnect?: (wallet: { principal: string; accountId?: string }) => void
  onWalletDisconnect?: () => void
}

interface WalletInfo {
  principal: string
  accountId?: string
  balance?: string
  connected: boolean
}

export function PaymentMethodSelector({
  selectedToken,
  onTokenChange,
  paymentMode,
  onPaymentModeChange,
  usdAmount,
  onWalletConnect,
  onWalletDisconnect,
}: PaymentMethodSelectorProps) {
  const [wallet, setWallet] = useState<WalletInfo>({
    principal: '',
    connected: false,
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [tokenAmount, setTokenAmount] = useState<string | null>(null)
  const [calculatingAmount, setCalculatingAmount] = useState(false)

  // Calculate token amount when USD amount or token changes in USD mode
  useEffect(() => {
    if (paymentMode === 'usd' && usdAmount) {
      calculateRequiredTokens()
    }
  }, [paymentMode, usdAmount, selectedToken])

  const calculateRequiredTokens = async () => {
    if (!usdAmount) return

    try {
      setCalculatingAmount(true)
      const calculation = await calculateTokenAmount(usdAmount, selectedToken)
      setTokenAmount(calculation.tokenAmount)
    } catch (error) {
      console.error('Error calculating token amount:', error)
      setTokenAmount(null)
    } finally {
      setCalculatingAmount(false)
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    setConnectionError(null)

    try {
      const walletSelect = getWalletSelect()
      
      // Open wallet selector modal
      const connected = await walletSelect.connect()
      
      if (connected) {
        // Get wallet information
        const principal = await walletSelect.getPrincipal()
        const accountId = await walletSelect.getAccountId?.()
        
        const walletInfo = {
          principal: principal.toString(),
          accountId: accountId?.toString(),
          connected: true,
        }

        setWallet(walletInfo)
        
        if (onWalletConnect) {
          onWalletConnect({
            principal: walletInfo.principal,
            accountId: walletInfo.accountId,
          })
        }
      } else {
        throw new Error('Wallet connection was cancelled')
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      setConnectionError(error.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      const walletSelect = getWalletSelect()
      await walletSelect.disconnect?.()
      
      setWallet({
        principal: '',
        connected: false,
      })
      
      if (onWalletDisconnect) {
        onWalletDisconnect()
      }
    } catch (error) {
      console.error('Wallet disconnection error:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Method</h3>
        <p className="text-sm text-gray-600">
          Pay securely with ICP or ICRC tokens
        </p>
      </div>

      {/* Payment Mode Toggle */}
      <PaymentModeToggle
        mode={paymentMode}
        onModeChange={onPaymentModeChange}
      />

      {/* Token Selector */}
      <LedgerSelector
        selectedToken={selectedToken}
        onTokenChange={onTokenChange}
        usdAmount={paymentMode === 'usd' ? usdAmount : undefined}
      />

      {/* Token Amount Display (for USD mode) */}
      {paymentMode === 'usd' && usdAmount && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">You will pay approximately:</div>
              {calculatingAmount ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin text-purple-600" size={16} />
                  <span className="text-sm text-gray-600">Calculating amount...</span>
                </div>
              ) : tokenAmount ? (
                <div className="text-xl font-bold text-gray-900">
                  {formatTokenAmount(tokenAmount, selectedToken === 'ICP' ? 8 : selectedToken === 'ckUSDC' ? 6 : selectedToken === 'ckBTC' ? 8 : 18)} {selectedToken}
                </div>
              ) : (
                <div className="text-sm text-amber-600">Amount calculation unavailable</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">USD Equivalent</div>
              <div className="text-xl font-bold text-gray-900">${usdAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Wallet Connection</h4>
        
        {!wallet.connected ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet size={20} />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>

            {connectionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm text-red-700">{connectionError}</div>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p className="mb-2">Connect your Internet Computer wallet to continue.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Internet Identity</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Plug Wallet</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Oisy</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">Stoic</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Check className="text-white" size={20} />
                  </div>
                  <div>
                    <h5 className="font-medium text-green-900 mb-1">Wallet Connected</h5>
                    <p className="text-sm text-green-700 font-mono break-all">
                      {wallet.principal.substring(0, 20)}...{wallet.principal.substring(wallet.principal.length - 10)}
                    </p>
                    {wallet.accountId && (
                      <p className="text-xs text-green-600 mt-1">
                        Account: {wallet.accountId.substring(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={disconnectWallet}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect
                </button>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Wallet className="text-purple-600 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h5 className="font-medium text-purple-900 mb-1">Payment Benefits</h5>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• No gas fees on the Internet Computer</li>
                    <li>• Instant transaction confirmation</li>
                    <li>• Direct blockchain settlement</li>
                    <li>• Secure escrow protection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
