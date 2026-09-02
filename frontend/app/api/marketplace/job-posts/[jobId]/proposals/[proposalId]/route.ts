import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 7).
type Ctx = { params: Promise<{ jobId: string; proposalId: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { jobId, proposalId } = await params;
  return proxy(request, `/api/job-posts/${jobId}/proposals/${proposalId}`);
}
