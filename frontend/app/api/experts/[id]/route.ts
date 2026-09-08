import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return proxy(request, `/api/experts/${id}`);
}
