import { Icpay, IcpayError } from '@ic-pay/icpay-sdk'

// Server-side ICPay instance with secret key
export function createICPayServerClient() {
  if (!process.env.ICPAY_SECRET_KEY) {
    throw new Error('ICPAY_SECRET_KEY is not configured')
  }

  return new Icpay({
    secretKey: process.env.ICPAY_SECRET_KEY,
    apiUrl: 'https://api.betterstripe.com', // Sandbox API endpoint
    environment: 'development',
    debug: true,
  })
}

// Verify a payment transaction
export async function verifyPayment(paymentId: string) {
  const icpay = createICPayServerClient()

  try {
    // Get payment details using the secret key
    // Now using the correct method from the protected API
    const paymentAggregate = await icpay.protected.getPaymentById(paymentId)
    return paymentAggregate.payment
  } catch (error) {
    if (error instanceof IcpayError) {
      console.error('ICPay Server Error:', {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      })
    }
    throw error
  }
}

// Get transaction history for an account
export async function getTransactionHistory(accountId: string, limit = 50) {
  const icpay = createICPayServerClient()

  try {
    // Fetch transaction history using secret key
    const history = await icpay.protected.getPaymentHistory({
      accountId,
      limit,
    })
    return history.payments
  } catch (error) {
    if (error instanceof IcpayError) {
      console.error('ICPay Server Error:', {
        code: error.code,
        message: error.message,
      })
    }
    throw error
  }
}

// Verify webhook signature (if ICPay provides webhook functionality)
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // This is a placeholder implementation
    // Actual implementation depends on ICPay's webhook signature mechanism
    // Typically uses HMAC SHA256
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Get payment status by transaction ID
export async function getPaymentStatus(transactionId: string) {
  const icpay = createICPayServerClient()

  try {
    // Get transaction status
    const status = await icpay.protected.getTransactionStatus(parseInt(transactionId))
    return status
  } catch (error) {
    if (error instanceof IcpayError) {
      console.error('ICPay Server Error:', {
        code: error.code,
        message: error.message,
      })
    }
    throw error
  }
}

// Helper to validate payment metadata
export function validatePaymentMetadata(metadata: Record<string, any>): boolean {
  // Check if it's a subscription upgrade or connects purchase
  if (metadata.type === 'upgrade') {
    return !!metadata.email && !!metadata.plan
  } else if (metadata.type === 'connects') {
    return !!metadata.email && !!metadata.amount
  }

  return false
}

export { IcpayError }

