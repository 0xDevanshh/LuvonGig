import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 3).
type Ctx = { params: Promise<{ stageId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { stageId } = await params;
  return proxy(request, `/api/stages/${stageId}`);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { stageId } = await params;
  return proxy(request, `/api/stages/${stageId}`);
}
