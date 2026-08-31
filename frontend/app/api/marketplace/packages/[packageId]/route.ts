import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 3).
type Ctx = { params: Promise<{ packageId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { packageId } = await params;
  return proxy(request, `/api/packages/${packageId}`);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { packageId } = await params;
  return proxy(request, `/api/packages/${packageId}`);
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { packageId } = await params;
  return proxy(request, `/api/packages/${packageId}`);
}
