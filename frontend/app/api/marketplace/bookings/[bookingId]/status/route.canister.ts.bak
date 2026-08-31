import { NextRequest, NextResponse } from 'next/server';
import { deliverablesDb, initializeDeliverablesTables } from '@/lib/db/deliverables-db';
import { getSession } from '@/lib/auth';

let tablesInitialized = false;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    if (!tablesInitialized) {
      await initializeDeliverablesTables();
      tablesInitialized = true;
    }

    const { bookingId } = await params;
    const history = await deliverablesDb.getStatusHistoryByBooking(bookingId);
    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error('Error fetching status history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    if (!tablesInitialized) {
      await initializeDeliverablesTables();
      tablesInitialized = true;
    }

    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await params;
    const { status, notes } = await request.json();

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const update = await deliverablesDb.addStatusUpdate({
      booking_id: bookingId,
      status,
      updated_by: session.email,
      notes,
    });

    return NextResponse.json({ success: true, data: update });
  } catch (error: any) {
    console.error('Error updating project status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}