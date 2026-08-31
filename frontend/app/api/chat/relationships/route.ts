import { NextRequest, NextResponse } from 'next/server';
import { chatDbService } from '@/lib/chat-db-service';

// Create chat relationship based on booking
export async function POST(request: NextRequest) {
  try {
    const { 
      bookingId, 
      clientEmail, 
      freelancerEmail,
      serviceTitle,
      serviceId,
      packageId,
      bookingStatus
    } = await request.json();

    if (!clientEmail || !freelancerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Client email and freelancer email are required'
      }, { status: 400 });
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail) || !emailRegex.test(freelancerEmail)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Create chat relationship in PostgreSQL database
    const relationshipId = await chatDbService.createChatRelationship(
      clientEmail,
      freelancerEmail,
      bookingId || null,
      serviceTitle || null,
      serviceId || null,
      packageId || null,
      bookingStatus || 'Active'
    );

    if (relationshipId) {
      console.log(`[ChatRelationship] Created relationship: ${clientEmail} <-> ${freelancerEmail} (Booking: ${bookingId || 'N/A'})`);

      return NextResponse.json({
        success: true,
        data: {
          id: relationshipId,
          clientEmail,
          freelancerEmail,
          bookingId: bookingId || null,
          serviceTitle: serviceTitle || null,
          serviceId: serviceId || null,
          packageId: packageId || null,
          status: bookingStatus || 'Active',
          createdAt: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create chat relationship'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[ChatRelationship] Error creating relationship:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Get chat relationships for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userEmail = searchParams.get('email');
    const bookingId = searchParams.get('bookingId');

    // If no email provided, try to get it from the current session
    if (!userEmail && !bookingId) {
      try {
        // Call the session API to get current user
        const sessionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/session`);
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.session && sessionData.session.email) {
            userEmail = sessionData.session.email;
            console.log(`[ChatRelationship] Using logged-in user email: ${userEmail}`);
          }
        }
      } catch (sessionError) {
        console.error('[ChatRelationship] Failed to get session:', sessionError);
      }
    }

    if (!userEmail && !bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Email or booking ID is required, and no active session found'
      }, { status: 400 });
    }

    let relationships = [];

    if (userEmail) {
      // Get relationships from PostgreSQL database
      const dbRelationships = await chatDbService.getChatRelationships(userEmail);
      
      // Transform to match expected format
      relationships = dbRelationships.map(rel => ({
        id: rel.id,
        chatId: rel.bookingId || rel.id,
        userEmail: userEmail,
        partnerEmail: rel.clientEmail === userEmail ? rel.freelancerEmail : rel.clientEmail,
        userRole: rel.clientEmail === userEmail ? 'client' : 'freelancer',
        bookingId: rel.bookingId,
        serviceTitle: rel.serviceTitle || 'Service',
        serviceId: rel.serviceId,
        packageId: rel.packageId,
        status: rel.bookingStatus || 'Active',
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt,
      }));

      console.log(`[ChatRelationship] Found ${relationships.length} chat relationships for ${userEmail}`);
    } else if (bookingId) {
      // Get specific relationship by booking ID
      const dbRelationships = await chatDbService.getChatRelationships('');
      relationships = dbRelationships.filter(rel => rel.bookingId === bookingId);
    }

    return NextResponse.json({
      success: true,
      data: {
        relationships,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[ChatRelationship] Error fetching relationships:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}