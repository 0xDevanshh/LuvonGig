import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4).
export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}));
  const id = body.hackathonId ?? body.hackathon_id ?? '';
  return proxy(request, `/api/hackathons/${id}/winners`);
}
