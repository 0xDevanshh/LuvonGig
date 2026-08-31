import { NextRequest, NextResponse } from 'next/server';
import { chatStorageApi } from '@/lib/chat-storage-agent';

// Get recent messages between two users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const contactEmail = searchParams.get('contactEmail');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userEmail || !contactEmail) {
      return NextResponse.json({
        success: false,
        error: 'User email and contact email are required'
      }, { status: 400 });
    }

    // Get messages between the two users
    const messages = await (chatStorageApi as any).getMessagesBetweenUsers(userEmail, contactEmail, limit);

    return NextResponse.json({
      success: true,
      data: {
        messages,
        userEmail,
        contactEmail,
        count: messages.length
      }
    });

  } catch (error) {
    console.error('[ChatMessagesRecent] Error fetching recent messages:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}