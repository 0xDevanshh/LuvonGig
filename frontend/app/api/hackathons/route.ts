import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4). This tree and /api/hackquest
// now resolve to the same handlers; Phase 7 deletes the duplicate.
export async function GET(request: NextRequest) {
  return proxy(request, '/api/hackathons');
}

export async function POST(request: NextRequest) {
  return proxy(request, '/api/hackathons');
}
