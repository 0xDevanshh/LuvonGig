import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// Shared payment session storage
const PAYMENT_SESSIONS_FILE = '/tmp/payment-sessions.json';

// Initialize payment sessions storage
if (!existsSync(PAYMENT_SESSIONS_FILE)) {
  writeFileSync(PAYMENT_SESSIONS_FILE, JSON.stringify({}), 'utf8');
}

function savePaymentSession(paymentId: string, session: any): void {
  try {
    let sessions: Record<string, any> = {};
    try {
      const data = readFileSync(PAYMENT_SESSIONS_FILE, 'utf8');
      sessions = JSON.parse(data);
    } catch (error) {
      console.error('Error reading payment sessions:', error);
    }

    sessions[paymentId] = session;
    writeFileSync(PAYMENT_SESSIONS_FILE, JSON.stringify(sessions), 'utf8');
  } catch (error) {
    console.error('Error saving payment session:', error);
  }
}

interface PaymentRequest {
  packageId: string;
  clientId: string;
  totalAmount: number;
  tokenSymbol: string;
  tokenAmount?: string;
  transactionId?: string;
  upsells?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  promoCode?: string;
  specialInstructions?: string;
  serviceData?: {
    serviceId?: string;
    freelancerEmail?: string;
    title?: string;
    mainCategory?: string;
    subCategory?: string;
    description?: string;
    whatsIncluded?: string;
  };
  packageData?: {
    title?: string;
    description?: string;
    deliveryDays?: number;
    deliveryTimeline?: string;
    revisionsIncluded?: number;
    features?: string[];
  };
}

// Create payment session for ICPay transactions
export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const { 
      packageId, 
      clientId, 
      totalAmount, 
      tokenSymbol,
      tokenAmount,
      transactionId,
      upsells, 
      promoCode, 
      specialInstructions, 
      serviceData, 
      packageData 
    } = body;

    // Validate required fields
    if (!packageId || !clientId || totalAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required payment information'
      }, { status: 400 });
    }

    // Generate payment session ID
    const paymentId = `PAY_ICPAY_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const timestamp = new Date().toISOString();

    // Calculate platform fee (5%)
    const platformFee = totalAmount * 0.05;
    const netAmount = totalAmount - platformFee;

    // Create payment session
    const paymentSession = {
      paymentId,
      packageId,
      serviceId: serviceData?.serviceId || `SVC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      paymentMethod: 'icpay',
      totalAmount,
      platformFee,
      netAmount,
      tokenSymbol: tokenSymbol || 'ICP',
      tokenAmount: tokenAmount || null,
      transactionId: transactionId || null,
      upsells: upsells || [],
      promoCode: promoCode || null,
      specialInstructions: specialInstructions || '',
      status: 'pending',
      createdAt: timestamp,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      serviceData: serviceData || {
        freelancerEmail: 'freelancer@example.com',
        title: 'Service',
        mainCategory: 'General',
        subCategory: 'General',
        description: 'Professional service',
        whatsIncluded: 'Complete service solution'
      },
      packageData: packageData || {
        title: 'Standard Package',
        description: 'Complete service package',
        deliveryDays: 7,
        deliveryTimeline: '7 days delivery',
        revisionsIncluded: 1,
        features: ['Professional delivery', 'Quality assurance']
      }
    };

    // Store payment session
    savePaymentSession(paymentId, paymentSession);
    console.log('ICPay payment session created:', paymentSession);

    // Return payment session details
    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentSession.paymentId,
        amount: paymentSession.totalAmount,
        currency: 'USD',
        tokenSymbol: paymentSession.tokenSymbol,
        status: 'pending',
        expiresAt: paymentSession.expiresAt
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create payment session'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID is required'
      }, { status: 400 });
    }

    // Read payment session from storage
    let sessions: Record<string, any> = {};
    try {
      const data = readFileSync(PAYMENT_SESSIONS_FILE, 'utf8');
      sessions = JSON.parse(data);
    } catch (error) {
      console.error('Error reading payment sessions:', error);
    }

    const paymentData = sessions[paymentId];

    if (!paymentData) {
      return NextResponse.json({
        success: false,
        error: 'Payment session not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve payment status'
    }, { status: 500 });
  }
}
