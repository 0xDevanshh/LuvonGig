import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 6).
// The old /save split was a second door onto the same write.
export async function POST(request: NextRequest) {
  return proxy(request, '/api/chat/messages');
}
