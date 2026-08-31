'use client'

import { Icpay, IcpayError } from '@ic-pay/icpay-sdk'
import { createWalletSelect } from '@ic-pay/icpay-widget'

// Supported tokens for payment
export const SUPPORTED_TOKENS = [
  { symbol: 'ICP', name: 'Internet Computer', decimals: 8 },
  { symbol: 'ckUSDC', name: 'Chain Key USDC', decimals: 6 },
  { symbol: 'ckBTC', name: 'Chain Key Bitcoin', decimals: 8 },
  { symbol: 'ckETH', name: 'Chain Key Ethereum', decimals: 18 },
] as const

export type SupportedToken = typeof SUPPORTED_TOKENS[number]['symbol']

// Wallet selector instance (singleton)
let walletSelectInstance: any = null

export function getWalletSelect() {
  if (!walletSelectInstance) {
    walletSelectInstance = createWalletSelect()
  }
  return walletSelectInstance
}

// ICPay client instance factory
export function createICPayClient(connectedWallet?: { owner: string }) {
  const walletSelect = getWalletSelect()

  const config: any = {
    publishableKey: process.env.NEXT_PUBLIC_ICPAY_PUBLISHABLE_KEY!,
    apiUrl: 'https://api.betterstripe.com', // Sandbox API endpoint
    environment: 'development',

  }

  // Only add wallet-specific config if wallet is connected
  if (connectedWallet) {
    config.actorProvider = (canisterId: string, idl: any) =>
      walletSelect.getActor({
        canisterId,
        idl,
        requiresSigning: true,
        anon: false
      })
    config.connectedWallet = connectedWallet
  }

  return new Icpay(config)
}

// Helper to get ledger information
export async function getLedgerInfo(symbol: SupportedToken) {
  const icpay = createICPayClient()

  try {
    const ledgerCanisterId = await icpay.getLedgerCanisterIdBySymbol(symbol)
    const info = await icpay.getLedgerInfo(ledgerCanisterId)
    return info
  } catch (error) {
    console.error(`Error fetching ledger info for ${symbol}:`, error)
    throw error
  }
}

// Helper to get all verified ledgers
export async function getVerifiedLedgers() {
  const icpay = createICPayClient()

  try {
    const ledgers = await icpay.getVerifiedLedgers()
    return ledgers
  } catch (error) {
    console.error('Error fetching verified ledgers:', error)
    throw error
  }
}

// Helper to get current prices for all ledgers
export async function getAllLedgerPrices() {
  const icpay = createICPayClient()

  try {
    const pricedLedgers = await icpay.getAllLedgersWithPrices()
    return pricedLedgers
  } catch (error) {
    console.error('Error fetching ledger prices:', error)
    throw error
  }
}

// Helper to calculate token amount from USD
export async function calculateTokenAmount(
  usdAmount: number,
  symbol: SupportedToken
) {
  const icpay = createICPayClient()

  try {
    const ledgerCanisterId = await icpay.getLedgerCanisterIdBySymbol(symbol)
    const calculation = await icpay.calculateTokenAmountFromUSD({
      usdAmount,
      ledgerCanisterId,
    })
    return calculation
  } catch (error) {
    console.error(`Error calculating token amount for ${symbol}:`, error)
    throw error
  }
}

// Helper to create a payment with fixed token amount
export async function createTokenPayment(params: {
  symbol: SupportedToken
  amount: string
  metadata: Record<string, any>
  connectedWallet: { owner: string }
}) {
  const icpay = createICPayClient(params.connectedWallet)

  try {
    const transaction = await icpay.createPayment({
      symbol: params.symbol,
      amount: params.amount,
      metadata: params.metadata,
    })
    return transaction
  } catch (error) {
    if (error instanceof IcpayError) {
      console.error('ICPay Error:', {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        userAction: error.userAction,
      })
    }
    throw error
  }
}

// Helper to create a payment with USD amount
export async function createUSDPayment(params: {
  symbol: SupportedToken
  usdAmount: number
  metadata: Record<string, any>
  connectedWallet: { owner: string }
}) {
  const icpay = createICPayClient(params.connectedWallet)

  try {
    const transaction = await icpay.createPaymentUsd({
      symbol: params.symbol,
      usdAmount: params.usdAmount,
      metadata: params.metadata,
    })
    return transaction
  } catch (error) {
    if (error instanceof IcpayError) {
      console.error('ICPay Error:', {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        userAction: error.userAction,
      })
    }
    throw error
  }
}

// Helper to format token amount with decimals
export function formatTokenAmount(amount: string, decimals: number): string {
  const num = BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const whole = num / divisor
  const fraction = num % divisor

  const fractionStr = fraction.toString().padStart(decimals, '0')
  const trimmedFraction = fractionStr.replace(/0+$/, '')

  if (trimmedFraction === '') {
    return whole.toString()
  }

  return `${whole}.${trimmedFraction}`
}

// Helper to convert USD to smallest token unit
export function usdToTokenAmount(usdAmount: number, tokenPrice: number, decimals: number): string {
  const tokenAmount = usdAmount / tokenPrice
  const smallestUnit = Math.floor(tokenAmount * (10 ** decimals))
  return smallestUnit.toString()
}

// Export ICPay error class for error handling
export { IcpayError }

