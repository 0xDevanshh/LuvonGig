import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 3).
type Ctx = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { bookingId } = await params;
  return proxy(request, `/api/bookings/${bookingId}`);
}
