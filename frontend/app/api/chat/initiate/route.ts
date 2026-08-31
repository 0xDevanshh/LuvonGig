import { NextRequest, NextResponse } from 'next/server';
import { chatStorageApi } from '@/lib/chat-storage-agent';
import { canSendMessage, incrementMessageCount } from '@/lib/db/usage-service';

// Helper function to generate detailed booking message
function generateDetailedBookingMessage(serviceTitle: string, bookingId: string, bookingDetails?: any): string {
  let message = `🎉 **New Booking Confirmed!**\n\n📋 **Service:** ${serviceTitle}\n🆔 **Booking ID:** ${bookingId}\n`;

  if (bookingDetails) {
    // Add package information
    message += `\n📦 **Selected Package:** ${bookingDetails.packageTitle} (${bookingDetails.packageTier})\n`;
    message += `📅 **Delivery Time:** ${bookingDetails.deliveryDays} day${bookingDetails.deliveryDays !== 1 ? 's' : ''}\n`;
    message += `🔄 **Revisions:** ${bookingDetails.revisionsIncluded} included\n`;

    // Add features
    if (bookingDetails.features && bookingDetails.features.length > 0) {
      message += `\n✨ **What's Included:**\n`;
      bookingDetails.features.forEach((feature: string, index: number) => {
        message += `   • ${feature}\n`;
      });
    }

    // Add upsells if any
    if (bookingDetails.upsells && bookingDetails.upsells.length > 0) {
      message += `\n🚀 **Enhancements Added:**\n`;
      bookingDetails.upsells.forEach((upsell: any) => {
        message += `   • ${upsell.name} (+$${upsell.price})\n`;
      });
    }

    // Add pricing information
    message += `\n💰 **Payment Details:**\n`;
    message += `   • Total Amount: $${bookingDetails.totalAmount.toFixed(2)}\n`;
    message += `   • Payment Method: ${bookingDetails.paymentMethod.toUpperCase()}\n`;
    message += `   • Status: ✅ Confirmed (held in escrow)\n`;

    // Add special instructions if provided
    if (bookingDetails.specialInstructions) {
      message += `\n📝 **Client Instructions:**\n${bookingDetails.specialInstructions}\n`;
    }

    // Add delivery deadline
    if (bookingDetails.deliveryDeadline) {
      const deadline = new Date(bookingDetails.deliveryDeadline).toLocaleDateString();
      message += `\n🎯 **Delivery Deadline:** ${deadline}\n`;
    }
  }

  message += `\nI'm excited to work with you on this project! Let's discuss any specific requirements and timeline details.`;

  return message;
}

// POST /api/chat/initiate - Initiate chat between users
export async function POST(request: NextRequest) {
  try {
    const { clientEmail, freelancerEmail, serviceTitle, projectId, bookingId, bookingDetails } = await request.json();

    if (!clientEmail || !freelancerEmail) {
      return NextResponse.json(
        { error: 'Client email and freelancer email are required' },
        { status: 400 }
      );
    }

    // Check direct message limits
    const { allowed, error: limitError } = await canSendMessage(clientEmail);
    if (!allowed) {
      return NextResponse.json({
        success: false,
        error: limitError
      }, { status: 403 });
    }

    // Authenticate both users with the chat canister
    const [clientAuth, freelancerAuth] = await Promise.all([
      chatStorageApi.authenticateUser(clientEmail, 'Client'),
      chatStorageApi.authenticateUser(freelancerEmail, 'Freelancer')
    ]);

    if (!clientAuth || !freelancerAuth) {
      return NextResponse.json(
        { error: 'Failed to authenticate users for chat' },
        { status: 500 }
      );
    }

    // Create initial message based on context
    let initialMessage = 'Hello! I would like to discuss the project.';
    let messageType = 'text';

    if (serviceTitle && bookingId) {
      // Enhanced booking confirmation message with all details
      initialMessage = generateDetailedBookingMessage(serviceTitle, bookingId, bookingDetails);
      messageType = 'booking_confirmed';
    } else if (serviceTitle) {
      initialMessage = `Hello! I'm interested in your service: ${serviceTitle}. Let's discuss the details.`;
      messageType = 'service_inquiry';
    } else if (projectId) {
      initialMessage = `Hello! I've assigned you to project ${projectId}. Let's coordinate on the next steps.`;
      messageType = 'project_assignment';
    } else if (bookingId) {
      initialMessage = `Hello! I've booked your service (Booking ID: ${bookingId}). Let's get started!`;
      messageType = 'booking_confirmation';
    }

    // Send initial message from client to freelancer
    const messageId = await chatStorageApi.saveMessage(
      clientEmail,
      freelancerEmail,
      initialMessage,
      messageType,
      new Date().toISOString()
    );

    if (!messageId) {
      return NextResponse.json(
        { error: 'Failed to initiate chat' },
        { status: 500 }
      );
    }

    // Increment message count in usage tracking
    // For initiate, it's always the client sending the first message
    await incrementMessageCount(clientEmail);

    return NextResponse.json({
      success: true,
      chatInitiated: true,
      messageId,
      participants: {
        client: clientEmail,
        freelancer: freelancerEmail
      },
      initialMessage
    });
  } catch (error) {
    console.error('Chat initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate chat' },
      { status: 500 }
    );
  }
}

// GET /api/chat/initiate - Check if chat exists between users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientEmail = searchParams.get('clientEmail');
    const freelancerEmail = searchParams.get('freelancerEmail');

    if (!clientEmail || !freelancerEmail) {
      return NextResponse.json(
        { error: 'Client email and freelancer email are required' },
        { status: 400 }
      );
    }

    // Check if chat exists by getting chat history
    const messages = await chatStorageApi.getChatHistory(
      clientEmail,
      freelancerEmail,
      1, // Just get 1 message to check if chat exists
      0
    );

    const chatExists = messages.length > 0;

    return NextResponse.json({
      success: true,
      chatExists,
      messageCount: messages.length
    });
  } catch (error) {
    console.error('Chat check error:', error);
    return NextResponse.json(
      { error: 'Failed to check chat status' },
      { status: 500 }
    );
  }
}