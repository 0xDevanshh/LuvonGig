import { NextResponse } from 'next/server';

// RETIRED (Phase 5). escrow.mo canister retired.
// Card payments now go through /api/payments/*, backed by Stripe Connect.
const GONE = NextResponse.json(
  { success: false, error: 'ICP escrow has been replaced by held card payments.', code: 'GONE' },
  { status: 410 },
);

export async function GET() { return GONE; }
export async function POST() { return GONE; }
export async function PUT() { return GONE; }
export async function DELETE() { return GONE; }
