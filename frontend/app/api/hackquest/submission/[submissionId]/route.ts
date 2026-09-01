import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4).
type Ctx = { params: Promise<{ submissionId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { submissionId } = await params;
  return proxy(request, `/api/submissions/${submissionId}`);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { submissionId } = await params;
  return proxy(request, `/api/submissions/${submissionId}`);
}
