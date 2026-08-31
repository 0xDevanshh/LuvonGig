import { NextRequest, NextResponse } from 'next/server';

// POST /api/marketplace/bookings/[bookingId]/review - Submit a review for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { userId, rating, comment, isClient = true } = body;

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'Rating must be between 1 and 5'
      }, { status: 400 });
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Review comment must be at least 10 characters'
      }, { status: 400 });
    }

    console.log(`📝 Submitting review for booking ${bookingId} by ${isClient ? 'client' : 'freelancer'}`);

    try {
      const { getMarketplaceActor } = await import('@/lib/ic-marketplace-agent');
      const actor = await getMarketplaceActor();

      const result = await actor.addBookingReview(
        bookingId,
        userId,
        rating,
        comment.trim(),
        isClient
      );

      if ('ok' in result) {
        console.log('✅ Review submitted successfully');
        return NextResponse.json({
          success: true,
          message: 'Review submitted successfully',
          data: {
            bookingId,
            rating,
            timestamp: Date.now()
          }
        });
      } else {
        console.error('❌ Failed to submit review:', result.err);
        return NextResponse.json({
          success: false,
          error: `Failed to submit review: ${JSON.stringify(result.err)}`
        }, { status: 400 });
      }
    } catch (canisterError: any) {
      console.error('❌ Error calling marketplace canister:', canisterError);
      return NextResponse.json({
        success: false,
        error: `Canister error: ${canisterError.message || canisterError}`
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit review'
    }, { status: 500 });
  }
}


