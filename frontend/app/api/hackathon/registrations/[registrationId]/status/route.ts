import { NextRequest, NextResponse } from 'next/server';
import { HackathonCanister } from '@/lib/hackathon-canister';

// PUT /api/hackathon/registrations/[registrationId]/status - Update registration status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await params;
    const body = await request.json();

    if (!registrationId) {
      return NextResponse.json({
        success: false,
        error: 'Registration ID is required'
      }, { status: 400 });
    }

    if (!body.status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: status'
      }, { status: 400 });
    }

    // Validate status values
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    const updatedRegistration = await HackathonCanister.updateRegistrationStatus(registrationId, body.status);

    if (!updatedRegistration) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update registration status. Registration not found.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedRegistration,
      message: 'Registration status updated successfully'
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update registration status'
    }, { status: 500 });
  }
}