import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/icpay-server';

/**
 * ICPay Webhook Handler
 * 
 * This endpoint receives webhook events from ICPay when payment status changes.
 * Events include: payment created, completed, failed, or mismatched.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('icpay-signature') || request.headers.get('x-icpay-signature');
    
    if (!signature) {
      console.error('❌ Webhook signature missing');
      return NextResponse.json({
        success: false,
        error: 'Webhook signature missing'
      }, { status: 401 });
    }

    // Get the raw body
    const rawBody = await request.text();
    
    // Verify webhook signature
    const webhookSecret = process.env.ICPAY_WEBHOOK_SECRET || process.env.ICPAY_SECRET_KEY || '';
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({
        success: false,
        error: 'Invalid webhook signature'
      }, { status: 401 });
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log('📬 ICPay webhook received:', { event, transactionId: data?.transactionId });

    // Handle different webhook events
    switch (event) {
      case 'payment.created':
        await handlePaymentCreated(data);
        break;
        
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
        
      case 'payment.mismatched':
        await handlePaymentMismatched(data);
        break;
        
      default:
        console.warn('⚠️ Unknown webhook event:', event);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed'
    }, { status: 500 });
  }
}

async function handlePaymentCreated(data: any) {
  console.log('💳 Payment created:', data);
  // Store payment intent in database
  // Update payment status to 'pending'
}

async function handlePaymentCompleted(data: any) {
  console.log('✅ Payment completed:', data);
  
  try {
    // Extract payment details
    const {
      transactionId,
      amount,
      tokenSymbol,
      tokenAmount,
      metadata,
    } = data;

    // Confirm payment and create booking
    const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        paymentStatus: 'succeeded',
        amount: parseFloat(amount),
        currency: 'USD',
        tokenSymbol,
        tokenAmount,
        serviceId: metadata?.serviceId,
        packageId: metadata?.packageId,
        clientId: metadata?.clientId,
        freelancerEmail: metadata?.freelancerEmail,
        metadata,
      }),
    });

    if (!confirmResponse.ok) {
      throw new Error('Failed to confirm payment');
    }

    const confirmData = await confirmResponse.json();
    console.log('✅ Payment confirmed via webhook:', confirmData);
  } catch (error) {
    console.error('❌ Error handling payment completion:', error);
    throw error;
  }
}

async function handlePaymentFailed(data: any) {
  console.log('❌ Payment failed:', data);
  // Update payment status to 'failed'
  // Notify user
  // Clean up any pending bookings
}

async function handlePaymentMismatched(data: any) {
  console.log('⚠️ Payment amount mismatch:', data);
  // Log the mismatch for investigation
  // Notify admin
  // May need manual review
}

// GET endpoint for webhook verification (optional)
export async function GET(request: NextRequest) {
  // Some webhook providers send a verification challenge
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({
    success: true,
    message: 'ICPay webhook endpoint is active'
  });
}

