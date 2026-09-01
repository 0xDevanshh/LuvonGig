import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 6).
export async function GET(request: NextRequest) {
  return proxy(request, '/api/chat/recent');
}
