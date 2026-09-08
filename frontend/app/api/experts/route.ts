import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  return proxy(request, '/api/experts');
}

export async function POST(request: NextRequest) {
  return proxy(request, '/api/experts');
}
