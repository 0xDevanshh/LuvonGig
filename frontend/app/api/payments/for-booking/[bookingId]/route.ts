import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 8): resolves a booking to its live
// payment, replacing the escrow-id guessing the ICP client did.
type Ctx = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { bookingId } = await params;
  return proxy(request, `/api/payments/for-booking/${bookingId}`);
}
