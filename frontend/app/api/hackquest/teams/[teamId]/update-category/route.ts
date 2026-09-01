import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4).
type Ctx = { params: Promise<{ teamId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const { teamId } = await params;
  return proxy(request, `/api/teams/${teamId}/category`);
}
