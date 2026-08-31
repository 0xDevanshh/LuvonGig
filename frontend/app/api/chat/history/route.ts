import { NextRequest, NextResponse } from 'next/server';
import { chatDbService } from '@/lib/chat-db-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const contactEmail = searchParams.get('contactEmail');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userEmail || !contactEmail) {
      return NextResponse.json(
        { error: 'userEmail and contactEmail are required' },
        { status: 400 }
      );
    }

    console.log(`[ChatHistory] Loading chat history: ${userEmail} <-> ${contactEmail}`);
    
    // Load messages from PostgreSQL database
    const messages = await chatDbService.getChatHistory(
      userEmail,
      contactEmail,
      limit > 0 ? limit : 1000, // Use high limit if 0 or negative
      offset
    );

    console.log(`[ChatHistory] Loaded ${messages.length} messages from database`);

    return NextResponse.json({
      success: true,
      messages: messages,
      pagination: {
        limit,
        offset,
        count: messages.length,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('[ChatHistory] Get chat history error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}