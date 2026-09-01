import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4).
// Compat shim: 'principal' now carries the user id. Deleted in Phase 7
// together with the pages that still call it.
export async function GET(request: NextRequest) {
  return proxy(request, '/api/compat/hackquest/participant');
}
