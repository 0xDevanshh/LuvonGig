import { NextRequest, NextResponse } from 'next/server';
import { chatDbService } from '@/lib/chat-db-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail is required' },
        { status: 400 }
      );
    }

    const recentChats = await chatDbService.getRecentChats(userEmail, limit);

    return NextResponse.json({
      success: true,
      chats: recentChats,
      count: recentChats.length
    });
  } catch (error) {
    console.error('[ChatRecent] Get recent chats error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}