import { NextRequest, NextResponse } from 'next/server';
import { chatDbService } from '@/lib/chat-db-service';
import { canSendMessage, incrementMessageCount } from '@/lib/db/usage-service';

export async function POST(request: NextRequest) {
  try {
    const {
      from,
      to,
      text,
      messageType = 'text',
      timestamp,
      fileUrl,
      fileName,
      fileSize,
      replyTo,
      bookingId
    } = await request.json();

    // Validate required fields
    if (!from || !to || (!text && !fileUrl)) {
      return NextResponse.json({
        success: false,
        error: 'From, to, and either text or file URL are required'
      }, { status: 400 });
    }

    // Check direct message limits (only for 'text' and 'file' types, not 'system')
    if (messageType !== 'system' && messageType !== 'booking_confirmed') {
      const { allowed, error: limitError } = await canSendMessage(from);
      if (!allowed) {
        return NextResponse.json({
          success: false,
          error: limitError
        }, { status: 403 });
      }
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from) || !emailRegex.test(to)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Validate text length
    if (text && text.length > 4000) {
      return NextResponse.json({
        success: false,
        error: 'Message text too long (max 4000 characters)'
      }, { status: 400 });
    }

    // Validate file size if provided
    if (fileSize && fileSize > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({
        success: false,
        error: 'File too large (max 10MB)'
      }, { status: 400 });
    }

    // Use provided timestamp or create new one
    const messageTimestamp = timestamp || new Date().toISOString();

    // Save message to PostgreSQL database
    console.log(`[ChatMessage] Attempting to save message: ${from} -> ${to}`);
    const messageId = await chatDbService.saveMessage(
      from,
      to,
      text || '',
      messageType,
      messageTimestamp,
      fileUrl || null,
      fileName || null,
      fileSize ? BigInt(fileSize) : null,
      replyTo || null,
      bookingId || null
    );

    if (messageId) {
      console.log(`[ChatMessage] Message saved successfully: ${from} -> ${to} (${messageId})`);

      // Increment message count in usage tracking
      if (messageType !== 'system' && messageType !== 'booking_confirmed') {
        await incrementMessageCount(from);
      }

      return NextResponse.json({
        success: true,
        data: {
          messageId,
          from,
          to,
          text,
          messageType,
          timestamp: messageTimestamp,
          fileUrl,
          fileName,
          fileSize,
          replyTo,
          bookingId,
          savedAt: new Date().toISOString()
        }
      });
    } else {
      console.error(`[ChatMessage] Failed to save message: ${from} -> ${to}`);
      return NextResponse.json({
        success: false,
        error: 'Failed to save message to database'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ChatMessage] Error saving message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}