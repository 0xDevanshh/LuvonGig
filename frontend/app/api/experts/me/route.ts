import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  return proxy(request, '/api/experts/me');
}

export async function PUT(request: NextRequest) {
  return proxy(request, '/api/experts/me');
}
