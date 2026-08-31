import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { canSendMessage, incrementMessageCount } from '@/lib/db/usage-service';

// Message storage path
const MESSAGES_FILE = path.join('/tmp/marketplace-storage', 'messages.json');

// Helper functions for message storage
function getMessages(): any[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading messages:', error);
    return [];
  }
}

function saveMessages(messages: any[]): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(MESSAGES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
}

// Helper function to generate message ID
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/chat/messages - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const userEmail = searchParams.get('userEmail');
    const contactEmail = searchParams.get('contactEmail');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!bookingId && (!userEmail || !contactEmail)) {
      return NextResponse.json({
        success: false,
        error: 'Either bookingId or both userEmail and contactEmail are required'
      }, { status: 400 });
    }

    const allMessages = getMessages();
    let filteredMessages = [];

    if (bookingId) {
      // Get messages for specific booking
      filteredMessages = allMessages.filter(msg => msg.bookingId === bookingId);
    } else {
      // Get messages between two users (fallback)
      filteredMessages = allMessages.filter(msg =>
        (msg.from === userEmail && msg.to === contactEmail) ||
        (msg.from === contactEmail && msg.to === userEmail)
      );
    }

    // Sort by timestamp (most recent first)
    filteredMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    if (limit > 0) {
      filteredMessages = filteredMessages.slice(0, limit);
    }

    console.log(`[ChatMessages] Retrieved ${filteredMessages.length} messages for booking: ${bookingId || 'N/A'}`);

    return NextResponse.json({
      success: true,
      messages: filteredMessages,
      count: filteredMessages.length
    });

  } catch (error) {
    console.error('[ChatMessages] Error fetching messages:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch messages'
    }, { status: 500 });
  }
}

// POST /api/chat/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const {
      bookingId,
      from,
      to,
      text,
      messageType = 'text'
    } = await request.json();

    if (!from || !to || !text) {
      return NextResponse.json({
        success: false,
        error: 'From, to, and text are required'
      }, { status: 400 });
    }

    // Check direct message limits (only for 'text' and 'file' types, not 'system')
    if (messageType !== 'system') {
      const { allowed, error: limitError } = await canSendMessage(from);
      if (!allowed) {
        return NextResponse.json({
          success: false,
          error: limitError
        }, { status: 403 });
      }
    }

    // Create new message
    const newMessage = {
      id: generateMessageId(),
      bookingId: bookingId || null, // Can be null for direct chats
      from,
      to,
      text: text.trim(),
      messageType,
      timestamp: new Date().toISOString(),
      delivered: false,
      read: false
    };

    // Save message
    const allMessages = getMessages();
    allMessages.push(newMessage);
    saveMessages(allMessages);

    // Increment message count in usage tracking
    if (messageType !== 'system') {
      await incrementMessageCount(from);
    }

    console.log(`[ChatMessages] New message: ${from} -> ${to} (${bookingId || 'no booking'})`);

    return NextResponse.json({
      success: true,
      message: newMessage
    });

  } catch (error) {
    console.error('[ChatMessages] Error sending message:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send message'
    }, { status: 500 });
  }
}

// PUT /api/chat/messages - Update message status (delivered/read)
export async function PUT(request: NextRequest) {
  try {
    const {
      messageId,
      delivered,
      read
    } = await request.json();

    if (!messageId) {
      return NextResponse.json({
        success: false,
        error: 'Message ID is required'
      }, { status: 400 });
    }

    const allMessages = getMessages();
    const messageIndex = allMessages.findIndex(msg => msg.id === messageId);

    if (messageIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Message not found'
      }, { status: 404 });
    }

    // Update message status
    if (delivered !== undefined) {
      allMessages[messageIndex].delivered = delivered;
    }
    if (read !== undefined) {
      allMessages[messageIndex].read = read;
    }

    saveMessages(allMessages);

    console.log(`[ChatMessages] Updated message ${messageId}: delivered=${delivered}, read=${read}`);

    return NextResponse.json({
      success: true,
      message: allMessages[messageIndex]
    });

  } catch (error) {
    console.error('[ChatMessages] Error updating message:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update message'
    }, { status: 500 });
  }
}