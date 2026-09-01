import { NextResponse } from 'next/server';

// RETIRED (Phase 5). ICPay rail removed.
// Card payments now go through /api/payments/*, backed by Stripe Connect.
const GONE = NextResponse.json(
  { success: false, error: 'ICPay checkout has been replaced by card payments.', code: 'GONE' },
  { status: 410 },
);

export async function GET() { return GONE; }
export async function POST() { return GONE; }
export async function PUT() { return GONE; }
export async function DELETE() { return GONE; }
