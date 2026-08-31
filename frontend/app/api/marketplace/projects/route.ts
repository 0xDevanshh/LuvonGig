import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceActor, handleApiError, validateMarketplaceConfig } from '@/lib/ic-marketplace-agent';

// Helper functions to get user information
async function getClientEmailFromBooking(bookingId: string): Promise<string | null> {
  try {
    // In a real implementation, this would query the booking database
    // For now, return a mock email based on booking ID
    return `client-${bookingId}@example.com`;
  } catch (error) {
    console.error('Error getting client email from booking:', error);
    return null;
  }
}

async function getFreelancerEmail(freelancerId: string): Promise<string | null> {
  try {
    // In a real implementation, this would query the user database
    // For now, return a mock email based on freelancer ID
    return `freelancer-${freelancerId}@example.com`;
  } catch (error) {
    console.error('Error getting freelancer email:', error);
    return null;
  }
}

// POST /api/marketplace/projects - Complete or assign project
export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    try {
      validateMarketplaceConfig();
    } catch (configError) {
      console.warn('Marketplace configuration missing:', configError);
      return NextResponse.json({
        success: false,
        error: 'Marketplace service not configured'
      }, { status: 503 });
    }

    const body = await request.json();
    const { freelancerId, bookingId, action } = body;

    if (!freelancerId) {
      return NextResponse.json({
        success: false,
        error: 'Freelancer ID is required'
      }, { status: 400 });
    }

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    // Use mock agent for testing
    const actor = await getMarketplaceActor();
    let result;

    if (action === 'assign') {
      // Assign freelancer to project
      result = await actor.assignFreelancerToProject(freelancerId, bookingId);

      if ('ok' in result) {
        const projectData = result.ok;

        // Get user emails for chat initiation
        const clientEmail = await getClientEmailFromBooking(bookingId);
        const freelancerEmail = await getFreelancerEmail(freelancerId);

        if (clientEmail && freelancerEmail) {
          // Initiate chat between client and freelancer
          try {
            const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chat/initiate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientEmail,
                freelancerEmail,
                projectId: projectData.id,
                bookingId
              })
            });

            const chatResult = await chatResponse.json();
            if (chatResult.success) {
              console.log('Chat initiated successfully for project assignment:', projectData.id);
            }
          } catch (chatError) {
            console.error('Failed to initiate chat for project assignment:', chatError);
            // Don't fail the assignment if chat initiation fails
          }
        }

        return NextResponse.json({
          success: true,
          data: projectData,
          message: 'Freelancer assigned to project successfully'
        });
      }
    } else {
      // Complete project (default behavior)
      result = await actor.completeProject(freelancerId, bookingId);

      if ('ok' in result) {
        return NextResponse.json({
          success: true,
          data: result.ok
        });
      }
    }

    // Handle error case
    return NextResponse.json({
      success: false,
      error: handleApiError(result.err)
    }, { status: 400 });

  } catch (error) {
    console.error('Error in project operation:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
