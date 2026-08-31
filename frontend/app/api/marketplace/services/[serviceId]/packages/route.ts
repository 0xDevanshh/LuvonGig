import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 3).
type Ctx = { params: Promise<{ serviceId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { serviceId } = await params;
  return proxy(request, `/api/services/${serviceId}/packages`);
}
