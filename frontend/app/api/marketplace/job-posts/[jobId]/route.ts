import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 4).
type Ctx = { params: Promise<{ jobId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params;
  return proxy(request, `/api/job-posts/${jobId}`);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params;
  return proxy(request, `/api/job-posts/${jobId}`);
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params;
  return proxy(request, `/api/job-posts/${jobId}`);
}
