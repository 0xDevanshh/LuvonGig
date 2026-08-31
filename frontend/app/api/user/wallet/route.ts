import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 2).
export async function GET(request: NextRequest) {
  return proxy(request, '/api/users/wallet');
}

export async function POST(request: NextRequest) {
  return proxy(request, '/api/users/wallet');
}
