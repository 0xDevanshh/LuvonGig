import { NextResponse } from 'next/server';
import { chatStorageApi } from '@/lib/chat-storage-agent';

export async function GET() {
  try {
    const health = await chatStorageApi.healthCheck();
    const totalMessages = await chatStorageApi.getTotalMessages();

    return NextResponse.json({
      status: health,
      totalMessages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}