import { NextRequest, NextResponse } from 'next/server';
import { chatStorageApi } from '@/lib/chat-storage-agent';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, displayName } = await request.json();

    if (!email || !displayName) {
      return NextResponse.json({
        success: false,
        error: 'Email and display name are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Authenticate with chat storage canister
    const result = await chatStorageApi.authenticateUser(email, displayName);

    if (result) {
      // Create session token for additional security
      const sessionToken = createHash('sha256')
        .update(`${email}-${Date.now()}-${Math.random()}`)
        .digest('hex');

      console.log(`[ChatAuth] User authenticated successfully: ${email} (${displayName})`);

      return NextResponse.json({
        success: true,
        data: {
          email,
          displayName,
          sessionToken,
          timestamp: new Date().toISOString(),
          authenticated: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('[ChatAuth] Authentication error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const sessionToken = searchParams.get('token');

    if (!email || !sessionToken) {
      return NextResponse.json({
        success: false,
        error: 'Email and session token are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Verify session with chat storage canister
    const result = await chatStorageApi.verifySession(email);

    if (result) {
      return NextResponse.json({
        success: true,
        data: {
          email,
          authenticated: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('[ChatAuth] Session verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Session verification failed'
    }, { status: 500 });
  }
}