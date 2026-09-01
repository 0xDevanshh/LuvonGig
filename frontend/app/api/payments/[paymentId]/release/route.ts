import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 5).
type Ctx = { params: Promise<{ paymentId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { paymentId } = await params;
  return proxy(request, `/api/payments/${paymentId}/release`);
}
