import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/ic-marketplace-agent';
import { getStagesByBooking, createDefaultStages, getStageById } from '@/lib/stage-storage';
import { getEnhancedBookingData } from '@/lib/booking-utils';



// GET /api/marketplace/stages - List stages for booking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    console.log(`🔍 Fetching stages for booking: ${bookingId}`);

    // NOTE: JobMarketplace canister does not support stages.
    // We are relying on local storage (which acts as our database) for stages.
    // The previous canister call actor.listStagesForBooking(bookingId) failed
    // because the method does not exist on the JobMarketplace canister.

    // Fallback to local storage (which is the source of truth for now)
    let stages: any[] = getStagesByBooking(bookingId);

    // If no stages exist locally, try to create default stages
    if (stages.length === 0) {
      console.log('📝 No stages found locally, checking if we should create defaults...');

      // Check if booking exists and get its details
      const bookingData = getEnhancedBookingData(bookingId);
      if (bookingData && bookingData.total_amount_e8s) {
        console.log(`📋 Creating default stages for booking ${bookingId}`);
        stages = createDefaultStages(bookingId, bookingData.total_amount_e8s);
      }
    }

    if (stages.length > 0) {
      console.log(`✅ Found ${stages.length} stages in local storage`);
      return NextResponse.json({
        success: true,
        data: stages,
        count: stages.length,
        source: 'local-storage'
      });
    } else {
      console.log(`📝 No stages found for booking ${bookingId}, returning empty list`);
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        source: 'none'
      });
    }
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}

// POST /api/marketplace/stages - Create stages for booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { freelancerId, bookingId, stageDefinitions } = body;

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

    if (!stageDefinitions || !Array.isArray(stageDefinitions)) {
      return NextResponse.json({
        success: false,
        error: 'Stage definitions array is required'
      }, { status: 400 });
    }

    // NOTE: Relying on local storage as JobMarketplace does not support stages
    console.log(`📝 Creating ${stageDefinitions.length} stages locally for booking ${bookingId}`);

    const now = Date.now() * 1000000; // Nanoseconds
    const stages: any[] = stageDefinitions.map((def: any, index: number) => ({
      stage_id: `ST_${bookingId}_${index + 1}_${Date.now()}`,
      booking_id: bookingId,
      stage_number: index + 1,
      title: def.title,
      description: def.description || '',
      amount_e8s: def.amount_e8s || 0,
      status: 'Pending',
      created_at: now,
      updated_at: now
    }));

    // Import saveStages dynamically or add to imports if available
    // We need to import saveStages from lib/stage-storage
    const { saveStages } = await import('@/lib/stage-storage');
    saveStages(stages);

    return NextResponse.json({
      success: true,
      data: stages,
      count: stages.length
    });

  } catch (error) {
    console.error('Error creating stages:', error);
    return NextResponse.json({
      success: false,
      error: handleApiError(error)
    }, { status: 500 });
  }
}
