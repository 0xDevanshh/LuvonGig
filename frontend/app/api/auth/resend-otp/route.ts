import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 2). Previous canister-backed handler
// is kept alongside as route.canister.ts.bak until the cutover is confirmed.
export async function POST(request: NextRequest) {
  return proxy(request, '/api/auth/resend-otp');
}
