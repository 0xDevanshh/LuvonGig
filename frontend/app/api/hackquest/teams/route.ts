import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4).
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('hackathonId')
    ?? request.nextUrl.searchParams.get('hackathon_id') ?? '';
  return proxy(request, `/api/hackathons/${id}/teams`);
}
