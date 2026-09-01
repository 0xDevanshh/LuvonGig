import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 5).
export async function POST(request: NextRequest) {
  return proxy(request, '/api/payments/expert-session');
}
