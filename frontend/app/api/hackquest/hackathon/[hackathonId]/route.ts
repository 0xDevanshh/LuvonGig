import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4).
type Ctx = { params: Promise<{ hackathonId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { hackathonId } = await params;
  return proxy(request, `/api/hackathons/${hackathonId}`);
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { hackathonId } = await params;
  return proxy(request, `/api/hackathons/${hackathonId}`);
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { hackathonId } = await params;
  return proxy(request, `/api/hackathons/${hackathonId}`);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { hackathonId } = await params;
  return proxy(request, `/api/hackathons/${hackathonId}`);
}
