import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4). This tree and /api/hackquest
// now resolve to the same handlers; Phase 7 deletes the duplicate.
type Ctx = { params: Promise<{ hackathonId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { hackathonId } = await params;
  return proxy(request, `/api/hackathons/${hackathonId}`);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { hackathonId } = await params;
  return proxy(request, `/api/hackathons/${hackathonId}`);
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { hackathonId } = await params;
  return proxy(request, `/api/hackathons/${hackathonId}`);
}
