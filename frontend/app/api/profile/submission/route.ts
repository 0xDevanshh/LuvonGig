import { NextRequest } from 'next/server';
import { proxy } from '@/lib/api-proxy';

// Proxied to the Express backend (Phase 2).
export async function GET(request: NextRequest) {
  return proxy(request, '/api/users/profile/submission');
}

// POST marks the profile submitted; GET only reads the flag.
export async function POST(request: NextRequest) {
  return proxy(request, '/api/users/profile/submit');
}
